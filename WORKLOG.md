# Project Hercules — Work Log

```
Maintained by: Lionel Lam Song Poh, James Wong
Purpose: Record of work done, decisions made, challenges encountered, and assumptions held —
         to serve as a lessons learned reference for current and future contributors.
Last updated: 12 July 2026
```

---

## 02 July 2026 — Project Initialisation

### What Was Done
- Created the GitHub repository and made the initial commit with the Project Charter.
- Added the Project Plan, including Appendix A (Personas) and a risks section.
- Added the MIT License with Lionel Lam and James Wong as co-copyright holders.
- Renamed the project plan file to follow the same naming convention as the charter.
- Added CPMAI (Cognitive Project Management AI) as a stated objective in the project plan.

### Decisions Made
- **MIT License chosen** — open source, permissive, community-friendly. Aligns with the project's stated goal of building for the community.
- **Two copyright holders** — both Lionel Lam and James Wong credited from the outset, reflecting co-creation intent.
- **CPMAI framework adopted** — the project is explicitly framed as a real-world validation of cognitive project development methodology, not just a utility app.
- **Claude Code used as AI pair** — all Claude-assisted commits are co-authored with `Claude Sonnet 4.6 <noreply@anthropic.com>` to maintain transparency in the git history.

### Assumptions
- The project will remain self-hosted and open source throughout its development.
- CPMAI will be applied progressively as the project matures beyond the POC phase.

---

## 03 July 2026 — Initial Backlog, ERD, and Specification

### What Was Done
- Added the Project Hercules Specification document (v0.1).
- Added the initial backlog (HRC-001 to HRC-023).
- Added the Entity Relationship Diagram (SVG, aligned with v0.4 data model).
- Added the feature breakdown structure by delivery phase.
- Added a stakeholder presentation deck (9 slides).
- Resolved several open questions in the specification:
  - User/profile model confirmed — multiple independent profiles on a single deployment, no cross-profile visibility.
  - "Other" category handling resolved — a dedicated `is_other` flag on the Category table; an `other_sub_label` field captures specificity without overloading `remarks`.
  - SLM role extended to include category suggestion from the user's active category list (not free-text invention).
  - Confirmation screen made mandatory — no parsed data is saved without user review.
  - Category taxonomy made extensible — not fixed at build time.
- Specification bumped from v0.1 through to v0.4 across the day's commits.
- Initial backlog was added then removed — superseded by the feature breakdown structure, which was deemed a cleaner representation at this stage.

### Decisions Made
- **SLM scope kept narrow (CPMAI-aligned)** — the SLM (Phi-4-mini via Ollama) is used only for the cognitive task of interpreting free text into structured fields. Storage, validation, retrieval, and editing are handled by deterministic application code. This keeps the AI surface area small, auditable, and technically grounded.
- **Human-in-the-loop is non-negotiable** — the confirmation screen is mandatory. No parsed data is ever written to the database without the user seeing and approving it first.
- **Audit trail by design** — the original natural language input is preserved verbatim alongside structured output, enabling future diagnostics and parsing quality review.
- **`other_sub_label` field added** — captures specificity (e.g. "gift", "charity") when the selected category is "Other", without conflating it with `remarks` (which is user-authored context, not categorisation).
- **Stakeholder deck removed** — added and removed on the same day; deemed premature for the current project phase.

### Assumptions
- The application will eventually support multiple user profiles, but the POC is single-user.
- Categories will be user-configurable in later phases; the POC uses a fixed flat list loaded from a text file.

---

## 04 July 2026 — Minor Documentation Fix

### What Was Done
- Fixed SLM acronym capitalisation in the project overview.

---

## 05 July 2026 — Diagrams, Wireframes, and POC Preparation

### What Was Done
- Added the "Log an Expense" process flow diagram (SVG, UPN-style, aligned with v0.4 spec).
- Added mid-fidelity application wireframes (SVG).
- Added a draw.io version of the flow diagram and exported it as PNG.
- Removed the SVG flow diagram — superseded by the draw.io version.
- Removed the feature breakdown structure and stakeholder deck — superseded.
- Added version history tables to the charter and project plan.

### Decisions Made
- **draw.io chosen over SVG for diagrams** — provides an editable source file (`.drawio`) alongside a rendered export (`.png`), making future updates easier without requiring SVG editing tools.
- **UPN-style process flow** — Universal Process Notation used for the "Log an Expense" flow to align with PM methodology standards and improve readability for non-technical stakeholders.
- **Wireframes at mid-fidelity** — sufficient to communicate layout and user flow without over-investing in visual design at the POC stage.
- **Feature breakdown and backlog removed** — the team decided to keep planning artefacts lean at this stage; detailed backlog management deferred to when development moves beyond the POC.

---

## 06 July 2026 — CLI Proof of Concept (Phase 1)

### What Was Done
- Built the CLI POC as a Python application under `poc/`.
- Created the following files:
  - `cli.py` — main entry point and application loop
  - `parser.py` — SLM call boundary (the only file that touches the model)
  - `db.py` — SQLite database operations (init, save, retrieve)
  - `models.py` — Pydantic data models (`ParsedExpense`, `Expense`)
  - `prompts/parse_expense.txt` — prompt template with `{raw_input}` and `{categories}` placeholders
  - `data/categories.txt` — 10 default expense categories (one per line)
  - `requirements.txt` — Python dependencies (`pydantic`, `ollama`)
  - `README.md` — setup and usage instructions
- Added `.gitignore` to exclude `__pycache__`, `*.pyc`, `venv/`, and `data/expenses.db`.
- Used Phi-4-mini via Ollama for the SLM step.

### Decisions Made
- **Python CLI chosen for the POC** — lightweight, no frontend required, easy to run locally. Appropriate for validating the core expense parsing flow before committing to a web stack.
- **SQLite chosen for storage** — zero-configuration, file-based, no server required. Appropriate for a single-user local POC; can be replaced with PostgreSQL or similar in a production deployment.
- **Pydantic for data validation** — provides type checking and structured parsing of SLM JSON output with minimal boilerplate. Acts as a gatekeeper between the model's output and the rest of the application.
- **SLM boundary isolated in `parser.py`** — all model interaction is contained in a single function (`parse_expense()`). This makes it easy to swap models, migrate to a web backend, or replace the SLM without touching other parts of the application.
- **Categories loaded from a text file** — one category per line in `data/categories.txt`. Keeps categories configurable without code changes; the naming convention (`categories_default.txt`) anticipates future per-user category lists.
- **Human-in-the-loop confirmation screen implemented** — consistent with the spec. Every parsed expense is shown to the user before saving. The user can edit any field or discard entirely.
- **`was_edited` flag recorded** — tracks whether the user modified any parsed field before saving. Acts as a proxy signal for parsing accuracy over time.
- **`raw_input` stored verbatim** — the original natural language text is preserved alongside the structured record, consistent with the audit-trail design principle.
- **Prompt uses `.replace()` not `.format()`** — the prompt template contains JSON curly braces `{}` which would conflict with Python's `str.format()`. Simple string replacement avoids this.

### Challenges and Fixes
- **Model wraps JSON in markdown code fences** — Phi-4-mini returned ` ```json { } ``` ` instead of raw JSON. Fixed by stripping the fence before parsing: if the response starts with ` ``` `, split on newlines and drop the first and last lines.
- **Pydantic model immutability** — `raw_input` was not initially declared in `ParsedExpense`, causing an error when trying to set it after parsing. Fixed by adding `raw_input: Optional[str] = None` and using `model.model_copy(update={"raw_input": raw})`.
- **`pip` not found on macOS** — system Python blocked direct pip install. Fixed by creating a virtual environment: `python3 -m venv venv` and using `venv/bin/pip`.

### Assumptions
- Ollama is running locally and Phi-4-mini is already pulled.
- The POC is single-user; no authentication or profile selection is required at this stage.
- The `poc/` directory is a subdirectory of the main project repository, not a separate repo.

---

## 11 July 2026 — Housekeeping

### What Was Done
- Added draw.io backup files to `.gitignore` to prevent build artefacts from being committed.

---

## 12 July 2026 — Month-to-Date Summary, Date Normalisation, and Model Switch

### What Was Done

#### Month-to-Date Summary Feature
- Added a `summary` / `s` command to the CLI showing month-to-date spending totals grouped by category.
- Added `get_monthly_summary()` to `db.py` — queries expenses filtered by the current year-month prefix.
- Updated the startup hint text to list all available commands.

#### Date Normalisation
- Identified that `date` was stored as free text (e.g. "today", "yesterday") from the original prompt, making SQL date filtering unreliable.
- Updated `prompts/parse_expense.txt` to instruct the SLM to return dates in `YYYY-MM-DD` format.
- Injected `{today}` (today's actual date) into the prompt at runtime via `parser.py` so the model can resolve relative date terms.

#### Test Plan and Results
- Created `poc/TEST_PLAN.md` — 10 test cases covering startup, expense logging, confirmation screen, history, summary, and edge cases.
- Ran all test cases via automated stdin piping.
- **TC-03 (relative date — "yesterday")** initially failed: Phi-4-mini resolved the day and month correctly but used the wrong year (`2023` instead of `2026`). Fixed by tightening the prompt to explicitly prohibit use of any year other than the one in `{today}`, and to frame relative date resolution as arithmetic counting back from `{today}`.
- Created `poc/TEST_RESULTS.md` documenting round 1 results, the fix applied, and round 2 confirmation.

#### Explicit Back-Date Issue — Investigation
- Discovered that expenses logged with an explicit past date (e.g. "07 July 2026") were consistently being stored as today's date, requiring the user to manually edit field `[4]` on the confirmation screen.
- Confirmed via database inspection: all 6 records for 07 July 2026 had `was_edited = 1`.
- Investigated root cause systematically:
  - Multiple prompt revisions attempted (priority rules, few-shot examples, chain-of-thought framing) — none resolved the issue with Phi-4-mini.
  - Tested llama3.2 — same failure pattern.
  - Discovered that the full prompt entered directly in the Ollama desktop app returned the correct date. The desktop app maintains a conversational context (stateful), whereas the Python `ollama.generate()` API is stateless (single-shot). Small models rely on conversational context to reason correctly about conditional date logic; without it, they default to today.
  - Confirmed via direct Python API test: the same prompt that works in the Ollama desktop app fails via `ollama.generate()`.

#### Model Switch to Phi-4 (Full)
- Downloaded the full Phi-4 model (9 GB) and tested it against all date format scenarios via the Python API.
- Results: all 9 date format scenarios passed — explicit dates in all common formats (`07 July 2026`, `7 July`, `07-July-2026`, `2026-07-07`, `7th July 2026`, `July 7 2026`), relative dates ("yesterday"), and no date (default to today).
- Switched the POC from `phi4-mini` to `phi4` by updating `MODEL_NAME` in `parser.py`.
- Updated the CLI banner to reflect the model change.

#### Database Cleanup
- Identified and deleted 4 test records (IDs 1–4) created during development and testing:
  - Record 1: date stored as `"today"` (pre-normalisation), duplicate entry
  - Record 2: duplicate Ya Kun entry from TC-02 test run
  - Record 3: wrong year (`2023-07-11`) from TC-03 before date fix
  - Record 4: generic test input ("lunch $15") from TC-04

### Decisions Made
- **Phi-4 (full model) adopted over Phi-4-mini** — the date issue proved to be a fundamental limitation of small model reasoning in stateless API calls, not a prompt engineering problem. After exhausting prompt-level fixes and testing llama3.2, the full Phi-4 model was found to resolve all date formats correctly. The trade-off (9 GB vs 2.5 GB, slower response) is acceptable for a local POC.
- **`dateparser` Python library considered but deferred** — an alternative fix was to move date resolution entirely into Python (`dateparser` library handles all common formats). This remains on the backlog as a future option, particularly if the project moves to a lighter model in production. It is the recommended approach if Phi-4 proves too slow or resource-intensive in practice.
- **Prompt kept clean rather than over-engineered** — after testing multiple prompt variants (rules-based, few-shot, chain-of-thought), the final prompt is intentionally lean. Complexity in the prompt did not improve small model accuracy; what mattered was model capability.
- **Test artifacts committed to the repository** — `TEST_PLAN.md` and `TEST_RESULTS.md` kept in `poc/` as part of the project record, not discarded after testing.
- **Database cleanup done manually via Python script** — no migration tooling used at POC stage; direct SQLite deletion is sufficient.

### Challenges
- **Stateless vs. stateful model behaviour** — the most significant discovery of this session. The Ollama desktop app (stateful chat) and the Python API (stateless single-shot) produce different outputs for the same prompt and model. This is a fundamental architectural consideration for any project using local SLMs via API: do not assume desktop app behaviour translates to API behaviour.
- **Small model instruction-following ceiling** — both Phi-4-mini and llama3.2 failed identically on explicit back-dated entries via the API, despite the prompt clearly stating the expected behaviour. This is not a prompt problem — it is a model capability ceiling. The lesson: for tasks requiring conditional reasoning (if X, do Y; else Z), a minimum model size threshold applies. For local Ollama models, 7B+ parameters is the practical minimum for reliable instruction-following in stateless calls.
- **Few-shot examples did not help small models** — contrary to common prompt engineering advice, adding few-shot examples to the prompt did not improve small model accuracy on the date task. The models appeared to pattern-match on the example outputs (all using today's date) rather than reason from the examples. This may be specific to the date-reasoning task or to models below a certain capability threshold.

### Assumptions
- Phi-4 (full) will remain performant enough for local POC use on the development machine.
- The `dateparser` approach remains viable as a fallback if model performance becomes an issue.
- Real expense data entry begins from 07 July 2026; records prior to that date in the database are test artefacts.

---

## 12 July 2026 — Documentation Terminology Updates

### What Was Done

#### Model Reference Update (Phi-4-mini → Phi-4)
- Updated all references to `Phi-4-mini` → `Phi-4` across the three project documents: Charter (v0.3), Project Plan (v0.4), and Specification (v0.5).
- Also updated `poc/parser.py` (MODEL_NAME constant) and `poc/README.md` (prerequisites section) to reflect the model switch.

#### Terminology Update (SLM → Local Model)
- Replaced all content-level uses of "SLM" (Small Language Model) and "Small Language Model" with "local model" and "locally-hosted language model" across Charter (v0.4), Project Plan (v0.5), and Specification (v0.6).
- Historical version history rows that referenced "SLM" were left unchanged as they record past decisions.

### Decisions Made
- **"Local model" preferred over "SLM"** — Phi-4 at 14B parameters does not accurately fit the Small Language Model classification (typically applied to models in the 1–7B range). "Local model" better reflects the architectural intent of the project: the defining characteristic is that the model runs on-premises via Ollama, not that it is small. The CPMAI-aligned design principle (narrow cognitive scope) remains unchanged.
