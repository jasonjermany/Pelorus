# Pelorus — Architecture & Codebase Guide

Pelorus is an AI-powered commercial insurance underwriting triage system. It automatically evaluates broker-submitted applications (PDFs, DOCX, text) against carrier underwriting guidelines, returning a structured decision (PROCEED / REFER / DECLINE), a composite risk score, detailed guideline compliance checks, and risk insights.

---

## Tech Stack

| Component          | Technology                                      |
| ------------------ | ----------------------------------------------- |
| Framework          | Nuxt 4 (Vue 3 frontend + Nitro server backend)  |
| Styling            | Tailwind CSS 3                                  |
| Database           | Supabase (PostgreSQL + pgvector)                |
| Document Parsing   | Reducto AI (custom pipelines)                   |
| Embeddings         | Voyage AI (`voyage-law-2`, 1024-dim vectors)    |
| LLM                | Anthropic Claude (`claude-sonnet-4-6`)          |
| Validation         | Zod                                             |

---

## Directory Structure

```
Pelorus/
├── app/                           # Frontend (Vue 3)
│   ├── pages/
│   │   ├── index.vue              # Submission inbox & upload
│   │   ├── settings.vue           # Guidelines management
│   │   └── submissions/[id].vue   # Verdict detail view
│   ├── components/ui/             # Badge, Button, Card
│   ├── layouts/default.vue        # Root layout
│   ├── types/models.ts            # TypeScript interfaces
│   ├── assets/css/main.css        # Tailwind imports
│   └── app.vue                    # Root wrapper
│
├── server/                        # Backend (Nitro)
│   ├── api/
│   │   ├── guidelines/
│   │   │   ├── index.get.ts       # GET  /api/guidelines
│   │   │   └── upload.post.ts     # POST /api/guidelines/upload
│   │   └── submissions/
│   │       ├── index.get.ts       # GET  /api/submissions
│   │       ├── ingest.post.ts     # POST /api/submissions/ingest
│   │       └── [id]/
│   │           ├── index.get.ts   # GET  /api/submissions/:id
│   │           └── evaluate.post.ts # POST /api/submissions/:id/evaluate
│   ├── plugins/startup.ts         # Reset stuck submissions on boot
│   └── utils/
│       ├── supabase.ts            # Supabase client singleton
│       ├── org.ts                 # Single-tenant org resolver
│       ├── reducto.ts             # Reducto document parsing
│       ├── embeddings.ts          # Voyage AI embedding calls
│       ├── rag.ts                 # RAG: pinned chunks + similarity search
│       └── claude.ts              # Claude LLM prompts & evaluation logic
│
├── nuxt.config.ts
├── tailwind.config.ts
└── package.json
```

---

## End-to-End Data Flow

### 1. Guidelines Upload (one-time setup)

An underwriter uploads a guidelines PDF on the **Settings** page (`/settings`).

```
PDF upload
  → POST /api/guidelines/upload
  → Reducto parses PDF into chunks
  → filterChunks() removes noise (headers, footers, short fragments)
  → Claude extractHardStops() identifies automatic-decline rules
  → Claude extractRiskProfileFields() identifies key data fields
  → Voyage AI embeds all chunks (standard + hard stops) in parallel
  → Bulk insert into guideline_chunks table (Supabase)
```

Hard stop chunks are stored with `is_pinned = true` and `rule_type = 'hard_stop'`. These are always included in every evaluation — they are never subject to similarity search cutoffs.

### 2. Submission Ingestion

A user uploads broker submission files (or pastes text) on the **Inbox** page (`/`).

```
File upload / text paste
  → POST /api/submissions/ingest
  → Reducto parses files in parallel
  → Concatenate all chunk text into raw_text
  → INSERT into submissions table (status: pending)
  → Return immediately to client (fire-and-forget)
  → Background: run evaluation pipeline
```

The inbox polls `/api/submissions` every 5 seconds while any submission is `pending` or `processing`.

### 3. Evaluation Pipeline (background)

Runs asynchronously via `setImmediate` after ingestion returns:

```
raw_text (full, no truncation)
  → getRelevantChunks():
      - Fetch ALL pinned hard stop chunks (deterministic, ordered by chunk_index)
      - Embed submission text → pgvector similarity search → top 6 similar chunks
      - Fetch risk_profile_fields from organizations table
  → Build prompt with hard stop checklist + guideline context
  → Claude streaming call (temperature: 0) → guideline_checks + decision
  → In parallel (fired as soon as decision is visible in stream):
      - runFlagsCall() → flags, favorable factors, dimension scores, recommendation
      - runInsightsCall() → pattern recognition, market context, coverage gaps
      - runRiskProfileCall() → structured field extraction
  → Server-side composite score calculation (not LLM-generated):
      - Any fail → DECLINE (score: max 25)
      - Any review → REFER (score: 40–74)
      - All pass → PROCEED (score: 80–100)
  → INSERT into evaluations table with full verdict JSON
  → Update submission status to complete
```

### 4. Verdict Review

The underwriter views results on the **Detail** page (`/submissions/:id`):

- Decision banner with composite score
- **Summary tab**: recommendation, action items, flags (CONDITION/VERIFY), favorable factors
- **Guidelines tab**: full check table with pass/review/fail status per rule
- **Insights tab**: pattern recognition, market context, consistency, coverage gaps, missing info
- **Risk Profile tab**: all extracted fields in table format

A "Re-run Evaluation" button triggers `POST /api/submissions/:id/evaluate` for retries.

---

## API Endpoints

### Guidelines

| Method | Path                      | Purpose                              |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/api/guidelines`         | List all guideline chunks for org    |
| POST   | `/api/guidelines/upload`  | Upload & process a guidelines document (replaces existing) |

### Submissions

| Method | Path                               | Purpose                                      |
| ------ | ---------------------------------- | -------------------------------------------- |
| GET    | `/api/submissions`                 | List all submissions with latest verdict info |
| POST   | `/api/submissions/ingest`          | Ingest new submission (fire-and-forget eval)  |
| GET    | `/api/submissions/:id`             | Fetch submission + full verdict               |
| POST   | `/api/submissions/:id/evaluate`    | Manually re-run evaluation                    |

---

## Server Utilities

### `supabase.ts`
Singleton Supabase client. Note: Supabase JS client does not throw on errors — always destructure `{ error }` and check it.

### `org.ts`
Single-tenant organization resolver. Checks `ORG_ID` env var first, falls back to first org in DB, auto-creates one if none exists. Every DB query filters by `org_id`.

### `reducto.ts`
Integrates with Reducto AI for document parsing. Uses two pre-configured pipelines:
- **PIPELINE_GUIDELINES** — optimized for underwriting guideline PDFs
- **PIPELINE_SUBMISSIONS** — optimized for broker submission documents

Key functions:
- `parseFileToChunks(buffer, filename, pipelineId)` — uploads file, returns structured chunks
- `filterChunks(chunks)` — removes noise (headers, footers, short text <80 chars)
- `getChunkPage()` / `getChunkBlockTypes()` — chunk metadata helpers

### `embeddings.ts`
Calls Voyage AI `voyage-law-2` model to produce 1024-dimensional vectors. Input truncated to 16,000 chars.

### `rag.ts`
Retrieval-Augmented Generation layer:
1. Fetches **all** pinned hard stop chunks (deterministic, always included)
2. Embeds submission text and runs pgvector `match_chunks` RPC for top 6 similar standard chunks
3. Returns both sets plus the org's `risk_profile_fields`

### `claude.ts`
Core LLM integration. Key functions:

- **`evaluateSubmission()`** — orchestrates the full evaluation: RAG retrieval → streaming Claude call → parallel flags/insights/risk extraction → server-side scoring
- **`extractHardStops()`** — identifies automatic-decline rules from guideline text; auto-retries with larger token budget if truncated
- **`extractRiskProfileFields()`** — identifies key underwriting data fields from guidelines; falls back to sensible defaults
- **`runFlagsCall()`** — generates flags (CONDITION/VERIFY), favorable factors, dimension scores, recommendation
- **`runInsightsCall()`** — pattern recognition, market context, consistency analysis, coverage gaps
- **`runRiskProfileCall()`** — extracts structured key-value risk data from submission text

All evaluation calls use `temperature: 0` for deterministic output. The composite score and final decision are calculated server-side from check results — not by the LLM.

---

## Database Schema (Supabase / PostgreSQL)

### `organizations`
| Column               | Type   | Notes                                  |
| -------------------- | ------ | -------------------------------------- |
| id                   | uuid   | PK                                     |
| name                 | text   |                                        |
| risk_profile_fields  | jsonb  | Field names extracted from guidelines  |

### `submissions`
| Column           | Type        | Notes                                        |
| ---------------- | ----------- | -------------------------------------------- |
| id               | uuid        | PK                                           |
| org_id           | uuid        | FK → organizations                           |
| raw_text         | text        | Full extracted text from uploaded files       |
| broker_email     | text        | Optional                                     |
| source           | text        | `upload` or `email`                          |
| status           | text        | `pending` → `processing` → `complete`/`error` |
| extracted_fields | jsonb       | Reserved for future use                      |
| created_at       | timestamptz |                                              |

### `evaluations`
| Column          | Type        | Notes                             |
| --------------- | ----------- | --------------------------------- |
| id              | uuid        | PK                                |
| org_id          | uuid        | FK → organizations                |
| submission_id   | uuid        | FK → submissions                  |
| decision        | text        | PROCEED / REFER / DECLINE         |
| composite_score | int         | 0–100, calculated server-side     |
| verdict         | jsonb       | Full structured evaluation result |
| created_at      | timestamptz |                                   |

### `guideline_chunks`
| Column      | Type         | Notes                                          |
| ----------- | ------------ | ---------------------------------------------- |
| id          | uuid         | PK                                             |
| org_id      | uuid         | FK → organizations                             |
| chunk_index | int          | Order within source document                   |
| content     | text         | Raw chunk text from Reducto                    |
| embed_text  | text         | Cleaned text used for embedding                |
| embedding   | vector(1024) | Voyage AI vector (pgvector)                    |
| page        | int          | Source page number                             |
| block_types | text[]       | Reducto block types (Text, Table, List Item…)  |
| is_pinned   | bool         | true = hard stop, always fetched in evaluation |
| rule_type   | text         | `standard` or `hard_stop`                      |
| created_at  | timestamptz  |                                                |

### `match_chunks` (RPC)
pgvector function for cosine similarity search. Takes `query_embedding`, `org_id`, `match_count`. Returns non-pinned chunks ranked by similarity.

---

## Verdict JSON Structure

The `evaluations.verdict` column stores:

```ts
{
  decision: "PROCEED" | "REFER" | "DECLINE",
  composite_score: number,                // 0–100
  analyzed_in_seconds: string,

  guideline_checks: [{
    rule: string,
    required: string,      // What the guideline requires
    submitted: string,     // What the submission says
    status: "pass" | "review" | "fail",
    cited_section: string
  }],

  recommendation: {
    summary: string,
    action_items: string[]  // Max 4
  },

  flags: [{                 // Max 6
    title: string,
    type: "CONDITION" | "VERIFY",
    explanation: string,
    action_required: string,
    cited_section: string
  }],

  favorable_factors: string[],  // Max 4

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
    pattern_recognition: string,
    market_context: string,
    consistency_check: string,
    coverage_gap: string
  },

  missing_info: [{          // Max 5
    label: string,
    description: string
  }],

  risk_profile: {           // Dynamic fields based on guidelines
    named_insured: string,
    broker: string,
    tiv: string,
    // ... additional org-specific fields
  }
}
```

---

## Key Design Decisions

**Fire-and-forget ingestion** — `POST /api/submissions/ingest` returns immediately after inserting the submission row. Evaluation runs in background via `setImmediate`. The frontend polls every 5 seconds until all submissions reach a terminal state.

**Deterministic evaluation** — All Claude calls use `temperature: 0`. The guideline checks list is derived from hard stops stored in the DB, not chosen by the LLM. The composite score and final decision are calculated server-side from check pass/review/fail counts.

**Hard stop architecture** — Hard stops are extracted once during guidelines upload and stored as pinned chunks. At evaluation time, ALL pinned chunks are always included in the prompt (not subject to similarity search). This guarantees no automatic-decline rule is ever missed.

**Server-side scoring** — The composite score uses a banded calculation: any fail → DECLINE (max 25), any review → REFER (40–74), all pass → PROCEED (80–100). This prevents the LLM from gaming or miscalculating scores.

**Parallel LLM calls** — The main evaluation streams guideline checks first. As soon as the decision is visible in the stream, flags/insights/risk-profile calls fire in parallel to reduce total latency.

**Crash recovery** — A server startup plugin (`server/plugins/startup.ts`) resets any submissions stuck in `processing` or `pending` to `error`, preventing permanently stuck rows after dev server restarts.

**Single-tenant with multi-tenant ready** — Every query filters by `org_id`. Currently uses a single org resolved by `getOrgId()`. Auth and multi-tenant isolation can be added later without schema changes.

---

## Environment Variables

| Variable           | Used by        | Purpose                     |
| ------------------ | -------------- | --------------------------- |
| `ANTHROPIC_API_KEY`| claude.ts      | Claude API auth             |
| `ANTHROPIC_MODEL`  | claude.ts      | Model override (optional)   |
| `SUPABASE_URL`     | supabase.ts    | Supabase project URL        |
| `SUPABASE_KEY`     | supabase.ts    | Supabase service role key   |
| `VOYAGE_API_KEY`   | embeddings.ts  | Voyage AI auth              |
| `REDUCTO_API_KEY`  | reducto.ts     | Reducto AI auth             |
| `ORG_ID`           | org.ts         | Hardcoded org ID (optional) |

---

## Frontend Pages

### Inbox (`/`) — `app/pages/index.vue`
Main landing page. Lists all submissions with status, decision badge, and composite score. Includes a "New Submission" modal for uploading files or pasting text. Auto-polls while submissions are processing.

### Settings (`/settings`) — `app/pages/settings.vue`
Guidelines management. Upload a PDF/DOCX/TXT to replace existing guidelines. Shows extraction progress, then displays a chunk table with page numbers, previews, and rule types (standard vs hard stop).

### Verdict Detail (`/submissions/:id`) — `app/pages/submissions/[id].vue`
Full evaluation result with tabbed view: Summary (recommendation, flags, favorable factors), Guidelines (check table), Insights (patterns, market context, coverage gaps), and Risk Profile (extracted fields). Includes re-run button for failed evaluations.
