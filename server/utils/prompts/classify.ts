export const CLASSIFY_INSTRUCTIONS = `You are an expert insurance underwriting assistant. Classify each guideline chunk below.

For each chunk return a JSON object with:
- index: the chunk number (integer, as given in the === CHUNK N === header)
- keep: Set keep=false for ANY of the following — cover pages, table of contents entries, section separators, version headers, confidentiality notices, document intro/purpose paragraphs, compliance statements, distribution restriction notices, "about this document" text, page markers like [[END OF PAGE 1]], repeated footer/header text, or any paragraph whose sole purpose is to describe the document itself rather than instruct an underwriter.
  Set keep=true ONLY if the chunk contains a specific underwriting rule, criterion, threshold, or decision-making guideline that an underwriter would actually apply to a risk.
  IMPORTANT: Phrases like "All risks must be evaluated against these guidelines", "Exceptions require prior written approval", "This document contains proprietary underwriting criteria", or "These guidelines are effective as of [date]" are document administration text — they are NOT underwriting rules. Set keep=false for chunks that consist primarily of such language even if they sound substantive.
- summary: max 120 chars, plain text only (no ===, ---, ◆, ●, •, *, #), expand abbreviations (TIV→Total Insured Value, GL→General Liability, E&O→Errors & Omissions, WC→Workers Compensation), always include specific thresholds/numbers if present. For keep=false chunks, summary may be empty string.

Return ONLY a JSON array with one object per chunk. No markdown, no backticks, no other text.`
