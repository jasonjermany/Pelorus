# Pelorus MVP

Pelorus is an AI-powered underwriting submission triage prototype.

Core flow:
1. Paste underwriting guidelines.
2. Generate structured rules.
3. Paste a submission.
4. Extract structured facts.
5. Evaluate pass/fail against the rules.

## AI Architecture (Claude Only)

All intelligence uses Anthropic Claude.

- `server/lib/ai/anthropic.ts`: Claude client + prompts + strict JSON parsing/validation
- `server/lib/ai/index.ts`: routing layer for Claude-backed generation/extraction
- `server/data/factCatalog.json`: optional catalog of known underwriting facts for normalization
- `server/utils/factCatalog.ts`: catalog loaders (`loadFactCatalog`, `getFactKeys`)

Primary exported functions:
- `generateRulesFromGuidelines(guidelineText: string): Promise<Rule[]>`
- `extractFactsFromSubmission(submissionText: string, rules: Rule[]): Promise<{ facts: ExtractedFact[]; additionalFacts: ExtractedFact[] }>`

Behavior:
- `ANTHROPIC_API_KEY` is required.
- If the key is missing or Claude fails, API endpoints return an error (no fallback parsing).
- If the fact catalog is missing/empty, AI extraction still works with dynamic field naming.

## Setup

### Install

```bash
npm install
```

### Environment

Create `.env` with:

```bash
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Notes:
- `ANTHROPIC_API_KEY` enables Claude-backed parsing/extraction.
- `ANTHROPIC_MODEL` is optional; defaults to `claude-sonnet-4-6`.

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

- `POST /api/rules` -> `{ rules: Rule[], provider: string, filesProcessed?: number }`
- `POST /api/facts` -> `{ facts: ExtractedFact[], additionalFacts? ExtractedFact[] }`

All endpoints return useful error payloads when AI calls fail.

## File Upload Support

The `/api/rules` endpoint supports file uploads for guideline processing:

Supported formats:
- PDF (`.pdf`)
- DOCX (`.docx`)
- XLSX (`.xlsx`)
- XLS (`.xls`)
- TXT (`.txt`)

Flow (Guidelines):
1. Upload one or more guideline files or paste guideline text.
2. Files are parsed by Reducto and text is extracted.
3. Extracted/pasted text is sent to Claude to generate rules.
4. Rules are returned structurally validated and renumbered.

Notes:
- No OCR is included.
- Requires `REDUCTO_API_KEY` environment variable for file uploads.
- Scanned/image-only PDFs may return limited text.

## Types

The existing flexible model is preserved in `app/types/models.ts`:
- `Rule`
- `ExtractedFact`
- `EvaluationResult`

Rule evaluation remains dynamic (`field`, `operator`, `value`) in `app/utils/ruleEngine.ts`.
