# Pelorus — Architecture & Codebase Guide

Pelorus is an AI-powered commercial insurance underwriting triage platform. It evaluates broker submissions (PDFs, DOCX, text) against carrier underwriting guidelines and returns a structured decision (PROCEED / REFER / DECLINE), a composite risk score, guideline compliance checks, flags, insights, and a structured risk profile — all with source citations.

---

## Tech Stack

| Component        | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | Nuxt 4 (Vue 3 frontend + Nitro server backend) |
| Styling          | Tailwind CSS 3                                 |
| Database         | Supabase (PostgreSQL)                          |
| Document Parsing | Reducto AI                                     |
| LLM              | Anthropic Claude (`claude-sonnet-4-6`, `claude-haiku-4-5`) |
| Email (inbound)  | SendGrid Inbound Parse webhook                 |
| Email (outbound) | SendGrid Mail (`@sendgrid/mail`)               |
| PDF Generation   | pdfmake (server-side, CJS via `createRequire`) |
| Auth             | nuxt-auth-utils (signed cookie sessions)       |

---

## Directory Structure

```
Pelorus/
├── app/
│   ├── pages/
│   │   ├── index.vue                  # Marketing page
│   │   └── app/
│   │       ├── index.vue              # Submission inbox
│   │       ├── settings.vue           # Guidelines management
│   │       └── submissions/[id].vue   # Verdict detail view
│   ├── middleware/
│   │   └── auth.global.ts             # Redirect unauthenticated users
│   └── app.vue
│
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts          # POST /api/auth/login
│   │   │   ├── logout.post.ts         # POST /api/auth/logout
│   │   │   └── me.get.ts              # GET  /api/auth/me
│   │   ├── email/
│   │   │   └── inbound.post.ts        # POST /api/email/inbound (SendGrid webhook)
│   │   ├── guidelines/
│   │   │   ├── index.get.ts           # GET  /api/guidelines
│   │   │   └── upload.post.ts         # POST /api/guidelines/upload
│   │   ├── submissions/
│   │   │   ├── index.get.ts           # GET  /api/submissions
│   │   │   ├── ingest.post.ts         # POST /api/submissions/ingest
│   │   │   └── [id]/
│   │   │       ├── index.get.ts       # GET  /api/submissions/:id
│   │   │       ├── evaluate.post.ts   # POST /api/submissions/:id/evaluate
│   │   │       └── pdf.get.ts         # GET  /api/submissions/:id/pdf
│   │   └── users/
│   │       └── index.get.ts           # GET  /api/users (admin only)
│   ├── middleware/
│   │   └── ipwhitelist.ts             # IP allowlist (bypassed for /api/email/inbound)
│   ├── plugins/
│   │   └── startup.ts                 # Reset stuck submissions on boot
│   └── utils/
│       ├── supabase.ts                # Supabase client singleton
│       ├── org.ts                     # Session helpers: getSessionUser, getOrgId, requireAdmin
│       ├── reducto.ts                 # Reducto document parsing + chunk filtering
│       ├── rag.ts                     # Guideline chunk fetcher (all chunks, no vector search)
│       ├── claude.ts                  # LLM orchestration: evaluate, classify, extract
│       ├── email.ts                   # SendGrid outbound email helpers
│       ├── pdfBuilder.ts              # pdfmake PDF generation from verdict
│       └── prompts/
│           ├── voice.ts               # VOICE style rules + HARD_STOP_RULES
│           ├── checks.ts              # CHECKS_TOOL schema + buildChecksMessages()
│           ├── flags.ts               # buildFlagsPrompt()
│           ├── insights.ts            # buildInsightsPrompt()
│           ├── riskProfile.ts         # buildRiskProfilePrompt()
│           ├── classify.ts            # CLASSIFY_INSTRUCTIONS
│           ├── hardStops.ts           # buildHardStopsPrompt()
│           └── riskFields.ts          # buildRiskFieldsPrompt()
│
├── types/
│   └── auth.d.ts                      # Augments nuxt-auth-utils User interface
├── nuxt.config.ts
└── package.json
```

---

## Authentication & Authorization

Auth is handled by `nuxt-auth-utils`. Login writes an encrypted cookie session containing `{ id, email, org_id, role }`. All server routes call `getSessionUser(event)` from `org.ts` to validate the session.

### Roles

| Role          | Capabilities                                                    |
| ------------- | --------------------------------------------------------------- |
| `admin`       | Upload guidelines, see all users, drill into any user's inbox   |
| `underwriter` | Submit and view their own submissions only                      |

### Submission Scoping

- `submissions.user_id` stores who created the submission.
- Underwriters: every DB query filters by `user_id = session.id`.
- Admins: see all submissions, or filter by a specific user via `?userId=` query param.
- Inbound email submissions have `user_id = null` (no session); only admins see them.

---

## End-to-End Data Flow

### 1. Guidelines Upload (admin only)

```
POST /api/guidelines/upload
  → Reducto parses PDF into chunks
  → filterChunks() removes noise (headers, footers, <80 char fragments)
  → Claude extractHardStops() — identifies automatic-decline rules
  → Claude extractRiskProfileFields() — identifies key submission data fields
      → stored in organizations.risk_profile_fields
  → Claude classifyChunks() — keep/discard + summary per chunk
  → Build rows (no embeddings)
  → Bulk insert into guideline_chunks
      · Standard chunks: is_pinned = false
      · Hard stop rows: is_pinned = true
```

### 2. Submission Ingestion (upload)

```
POST /api/submissions/ingest
  → Parse multipart files via Reducto (all files in parallel)
  → Label each document: "=== DOCUMENT: filename.pdf ===\n{text}"
  → Concatenate with "---" separators → raw_text
  → INSERT submission row (status: processing, user_id: session.id)
  → Return immediately to client
  → setImmediate → run evaluation pipeline in background
  → On complete: send results email if broker_email present
```

### 3. Submission Ingestion (inbound email)

```
POST /api/email/inbound  (SendGrid Inbound Parse webhook)
  → Parse multipart form: from, to, subject, text, html, attachments
  → Derive org from inbound handle: {handle}@mail.pelorusai.io
  → Verify sender email exists in org's users table
  → Collect attachments; if none, wrap email body as .txt
  → Label documents + concat → raw_text
  → INSERT submission row (status: processing, user_id: null)
  → setImmediate → run evaluation pipeline in background
  → On complete: send email reply with PDF attachment
```

### 4. Evaluation Pipeline (background, both paths)

```
raw_text
  → getGuidelineChunks(orgId)
      · Fetch ALL guideline_chunks for org, ordered by chunk_index
      · Split into: pinned (hard stops) + guidelines (standard)
      · Fetch risk_profile_fields from organizations table
  → Build prompt context:
      · hardStopsText  — pinned chunks as bullet list
      · guidelinesText — standard chunks with page refs
      · hardStopCheckList — one check per pinned chunk
  → Fire in parallel:
      · runInsightsCall()     — pattern recognition, market context, coverage gaps
      · runRiskProfileCall()  — structured field extraction with source citations
      · Stream checks call (claude-sonnet-4-6, tool_use: submit_evaluation)
          · As soon as decision appears in stream → fire runFlagsCall() immediately
  → Await all parallel results
  → INSERT into evaluations (verdict JSON)
  → UPDATE submission status → complete
```

### 5. Verdict Review

Users view results at `/app/submissions/:id`:

- **Decision banner** — PROCEED / REFER / DECLINE with composite score
- **Dimension Scores** — 7 dimensions, 0–10 scale
- **Summary tab** — recommendation, flags (CONDITION/VERIFY), favorable factors, risk summary
- **Guidelines tab** — full check table with source citations on submitted findings
- **Insights tab** — pattern recognition, market context, consistency, coverage gaps, missing info
- **Risk Profile tab** — all extracted fields with source citations (document + page)
- **Download PDF** — full verdict as formatted PDF via pdfmake

---

## Guideline Chunk Strategy

All chunks are fetched for every evaluation — no vector similarity search. This guarantees no relevant guideline is ever missed due to retrieval error.

- **Pinned chunks** (`is_pinned = true`): hard stop rows derived from `extractHardStops()`. Always included first. Each becomes one mandatory check in the evaluation.
- **Standard chunks** (`is_pinned = false`): classified, summarized guideline sections. Passed as context.

---

## Source Citations

All AI-generated output includes source attribution:

- **Risk profile fields**: each field returns `{ value, source }` where source is the document name and page (e.g. "2_ACORD_125.pdf, Page 1"). Claude can identify the source because documents are labeled with `=== DOCUMENT: filename ===` headers in the raw text.
- **Guideline checks**: each check includes `submission_source` — which document and page the submitted finding came from.
- **Flags**: `cited_section` references the carrier guideline section that triggered the flag.

---

## Prompt Architecture

All Claude prompts live in `server/utils/prompts/`. `claude.ts` is orchestration-only.

| File           | Exports                                          | Used by            |
| -------------- | ------------------------------------------------ | ------------------ |
| `voice.ts`     | `VOICE`, `HARD_STOP_RULES`                       | checks, flags, insights |
| `checks.ts`    | `CHECKS_TOOL`, `buildChecksMessages()`           | evaluateSubmission |
| `flags.ts`     | `buildFlagsPrompt()`                             | runFlagsCall       |
| `insights.ts`  | `buildInsightsPrompt()`                          | runInsightsCall    |
| `riskProfile.ts` | `buildRiskProfilePrompt()`                     | runRiskProfileCall |
| `classify.ts`  | `CLASSIFY_INSTRUCTIONS`                          | classifyChunks     |
| `hardStops.ts` | `buildHardStopsPrompt()`                         | extractHardStops   |
| `riskFields.ts`| `buildRiskFieldsPrompt()`                        | extractRiskProfileFields |

### Voice & Style

All AI output follows a shared `VOICE` constant enforcing:
- Senior underwriter register, declarative present tense
- No em dashes, no hedging language, no filler openers
- Required field openers (e.g. "Risk pattern:", "Decision:", "Hard stop confirmed.")

---

## API Endpoints

### Auth
| Method | Path                  | Purpose              |
| ------ | --------------------- | -------------------- |
| POST   | `/api/auth/login`     | Authenticate user    |
| POST   | `/api/auth/logout`    | Clear session        |
| GET    | `/api/auth/me`        | Current session user |

### Guidelines
| Method | Path                     | Purpose                                     |
| ------ | ------------------------ | ------------------------------------------- |
| GET    | `/api/guidelines`        | List all guideline chunks for org           |
| POST   | `/api/guidelines/upload` | Upload & process guidelines (admin only)    |

### Submissions
| Method | Path                            | Purpose                                      |
| ------ | ------------------------------- | -------------------------------------------- |
| GET    | `/api/submissions`              | List submissions (scoped by role; `?userId=` for admin filter) |
| POST   | `/api/submissions/ingest`       | Ingest new submission                        |
| GET    | `/api/submissions/:id`          | Fetch submission + full verdict              |
| POST   | `/api/submissions/:id/evaluate` | Re-run evaluation                            |
| GET    | `/api/submissions/:id/pdf`      | Download verdict as PDF                      |

### Users
| Method | Path          | Purpose                         |
| ------ | ------------- | ------------------------------- |
| GET    | `/api/users`  | List org users (admin only)     |

### Email
| Method | Path                  | Purpose                             |
| ------ | --------------------- | ----------------------------------- |
| POST   | `/api/email/inbound`  | SendGrid Inbound Parse webhook      |

---

## Database Schema

### `organizations`
| Column               | Type        | Notes                                       |
| -------------------- | ----------- | ------------------------------------------- |
| id                   | uuid        | PK                                          |
| name                 | text        |                                             |
| inbound_email_handle | text        | Subdomain handle for inbound email routing  |
| risk_profile_fields  | jsonb       | Field names extracted from guidelines       |

### `users`
| Column     | Type        | Notes                        |
| ---------- | ----------- | ---------------------------- |
| id         | uuid        | PK                           |
| org_id     | uuid        | FK → organizations           |
| email      | text        |                              |
| role       | text        | `admin` or `underwriter`     |
| created_at | timestamptz |                              |

### `submissions`
| Column           | Type        | Notes                                           |
| ---------------- | ----------- | ----------------------------------------------- |
| id               | uuid        | PK                                              |
| org_id           | uuid        | FK → organizations                              |
| user_id          | uuid        | FK → users (null for inbound email submissions) |
| raw_text         | text        | Full extracted text, document-labeled           |
| broker_email     | text        | Optional                                        |
| source           | text        | `upload` or `email`                             |
| status           | text        | `processing` → `complete` / `error`             |
| extracted_fields | jsonb       | Reserved                                        |
| created_at       | timestamptz |                                                 |

### `evaluations`
| Column          | Type        | Notes                             |
| --------------- | ----------- | --------------------------------- |
| id              | uuid        | PK                                |
| org_id          | uuid        | FK → organizations                |
| submission_id   | uuid        | FK → submissions                  |
| decision        | text        | `PROCEED` / `REFER` / `DECLINE`   |
| composite_score | float       | 0.0–10.0                          |
| verdict         | jsonb       | Full structured evaluation result |
| created_at      | timestamptz |                                   |

### `guideline_chunks`
| Column      | Type        | Notes                                           |
| ----------- | ----------- | ----------------------------------------------- |
| id          | uuid        | PK                                              |
| org_id      | uuid        | FK → organizations                              |
| chunk_index | int         | Order within source document                    |
| content     | text        | Raw chunk text from Reducto                     |
| embed_text  | text        | Cleaned text used for prompts                   |
| page        | int         | Source page number                              |
| block_types | text[]      | Reducto block types                             |
| is_pinned   | bool        | true = hard stop, always included in evaluation |
| summary     | text        | Claude-generated 120-char summary               |
| created_at  | timestamptz |                                                 |

---

## Verdict JSON Structure

```ts
{
  decision: "PROCEED" | "REFER" | "DECLINE",
  composite_score: number,          // 0.0–10.0, LLM-generated holistic score
  analyzed_in_seconds: string,

  guideline_checks: [{              // Only review/fail checks included
    rule: string,
    required: string,
    submitted: string,
    submission_source: string,      // e.g. "ACORD_125.pdf, Page 2"
    status: "review" | "fail",
    cited_section: string           // Carrier guideline section
  }],

  recommendation: {
    summary: string,
    action_items: string[]          // Max 4, imperative verb-first
  },

  flags: [{                         // Max 6
    title: string,
    type: "CONDITION" | "VERIFY",   // CONDITION = fail, VERIFY = review
    explanation: string,
    action_required: string,
    cited_section: string
  }],

  favorable_factors: string[],      // Max 4

  dimension_scores: {
    construction: number,
    fire_protection: number,
    management: number,
    submission_quality: number,
    loss_history: number,
    occupancy: number,
    cat_exposure: number
  },

  insights: {
    pattern_recognition: string,    // Starts: "Risk pattern: ..."
    market_context: string,         // Starts: "Market context: ..."
    consistency_check: string,      // Starts: "Consistency: ..."
    coverage_gap: string            // Starts: "Coverage gap: ..."
  },

  missing_info: [{
    label: string,
    description: string             // Starts: "Required: ..."
  }],

  risk_profile: {
    [field: string]: {
      value: string,                // Extracted value or "Not disclosed"
      source: string                // Document + page, or "Not disclosed"
    }
  }
}
```

---

## Key Design Decisions

**All-chunks evaluation** — All guideline chunks are fetched and passed to Claude for every evaluation. No vector similarity search. This eliminates the retrieval failure mode where a relevant guideline section is missed, and removes the need for embeddings, pgvector, and Voyage AI entirely.

**Hard stop architecture** — Hard stops are extracted once on guidelines upload and stored as pinned chunks. Every evaluation includes all pinned chunks as a mandatory checklist. Claude cannot omit or skip them.

**Streaming + parallel calls** — The checks call streams. As soon as the decision token is visible in the stream, `runFlagsCall()` fires immediately. Insights and risk profile fire at the start, before checks finish. This minimizes total wall-clock time despite 4 sequential/parallel LLM calls.

**Source attribution** — Documents are labeled (`=== DOCUMENT: filename ===`) before concatenation so Claude can cite which file and page each extracted value or finding came from.

**Prompt isolation** — All prompt text lives in `server/utils/prompts/`. `claude.ts` contains only orchestration logic (API calls, streaming, error handling, parallel coordination).

**Role-based submission scoping** — Underwriters see only their own submissions. Admins see all submissions organized by user, with an "All Submissions" view and per-user drill-down.

**Fire-and-forget ingestion** — Both upload and inbound email paths return immediately after inserting the submission row. Evaluation runs via `setImmediate`. The frontend uses Supabase Realtime to update the inbox without polling.

**pdfmake on Railway** — pdfmake uses CJS and must be loaded via `createRequire`. Nitro's `traceInclude` config forces the build files into the Railway deployment bundle.

---

## Environment Variables

| Variable            | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `ANTHROPIC_API_KEY` | Claude API authentication                    |
| `ANTHROPIC_MODEL`   | Model override (default: `claude-sonnet-4-6`) |
| `SUPABASE_URL`      | Supabase project URL                         |
| `SUPABASE_KEY`      | Supabase service role key                    |
| `REDUCTO_API_KEY`   | Reducto AI authentication                    |
| `SENDGRID_API_KEY`  | SendGrid outbound mail                       |
| `NUXT_SESSION_PASSWORD` | nuxt-auth-utils cookie encryption key    |
| `SITE_URL`          | Base URL for email result links              |
