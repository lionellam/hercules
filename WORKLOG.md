# Project Hercules — Work Log

```
Maintained by: Lionel Lam Song Poh, James Wong
Purpose: Record of work done, decisions made, challenges encountered, and assumptions held —
to serve as a lessons learned reference for current and future contributors.
Last updated: 2 November 2026
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

## 12 July 2026 — Flow Diagram Update

### What Was Done
- Updated the "Log an Expense" flow diagram (`.drawio`) and re-exported the PNG.

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

---

## 12 July 2026 — History Command Update and Category Addition

### What Was Done
- Changed the `history` / `h` command to show all expenses for the current calendar month, replacing the previous fixed limit of 10 most recent entries.
- Added `get_monthly_expenses()` to `db.py` — queries expenses filtered by the current year-month prefix, ordered by date then creation time. Mirrors the scoping approach used by `get_monthly_summary()`.
- Updated the history display header to show the month and year (e.g. `EXPENSES — July 2026`), consistent with the summary view.
- Added **Household** as a new expense category in `poc/data/categories.txt`.

### Decisions Made
- **History scoped to month-to-date** — aligns the history view with the summary view, making both commands consistently month-scoped. The previous "last 10" behaviour was arbitrary and less useful for reviewing a month's spending.

---

## 16 July 2026 — Single-Click Launcher

### What Was Done
- Created `Hercules.command` — a shell script at the project root that activates the venv and launches the CLI, double-clickable from Finder with no terminal setup required.
- Fixed a path issue on first launch: the script initially `cd`'d to the project root, causing `sqlite3.OperationalError: unable to open database file` because `db.py` resolves `data/expenses.db` relative to the working directory. Fixed by `cd`-ing into `poc/` before launching.

### Decisions Made
- **Shell script (`.command`) chosen over Automator or Platypus** — simplest option with no new dependencies. Covers the goal (single-click launch, no venv setup) with minimal complexity. Electron was considered but ruled out as the interaction quality inside the app was not a concern at this stage.
- **Launcher kept in the project root** — natural home alongside the rest of the project; easy to find and double-click from Finder or pin to the Dock's file area.

---

## 16 July 2026 — Previous Month Summary in Summary Command

### What Was Done
- Extended the `summary` / `s` command to show both the previous month's full summary and the current month-to-date summary in a single view, with the previous month displayed first.
- Added `get_previous_month_summary()` to `db.py` — derives the previous month's year-month prefix by stepping back from the first day of the current month, then queries using the same `date LIKE 'YYYY-MM-%'` pattern as `get_monthly_summary()`.
- Refactored `show_monthly_summary()` in `cli.py` by extracting a reusable `_print_summary_block()` helper to avoid duplicating the table-rendering logic for each month.

### Decisions Made
- **Previous month shown first** — provides a natural reading order from older to newer, and gives the previous month as a reference point before seeing the current month's running total.
- **Empty previous month handled gracefully** — if no expenses exist for the previous month, a "No expenses recorded" note is shown rather than an empty table.

---

## 30 August 2026 — Summary Table Alignment Fix

### What Was Done
- Fixed column misalignment in the `summary` command when a category name exceeds 22 characters (e.g. "Professional Development").
- Updated `_print_summary_block()` in `cli.py` to calculate the category column width dynamically based on the longest category name in the results, with a minimum of 22 characters.

### Decisions Made
- **Dynamic column width** — a hardcoded width is fragile as categories are user-configurable. Sizing to the longest name ensures the table always renders correctly regardless of what categories exist.

---

## 26 October 2026 — Web App UI Mockup

### What Was Done
- Added **Professional Development** as a new expense category in `poc/data/categories.txt`, and saved a backup of the parser prompt template to `poc/prompts/Backup/parse_expense.txt`.
- Created a clickable, mobile-first HTML mockup of a proposed web app UI at `design/ui-mockup.html`, covering four screens:
  - **Sign in** — a single "Sign in with Apple" button.
  - **Log** — natural language input with an inline, editable review card (amount, category, merchant, date, remarks) and Save / Discard actions.
  - **History** — month-to-date entries grouped by day, with a month switcher and an "edited" tag on corrected entries.
  - **Summary** — current / previous month toggle, total spent with change vs the previous month, and per-category bars.
- The mockup's parsing is a simple keyword and pattern-matching stand-in to demonstrate the flow; no language model is called.

### Decisions Made
- **Mobile-first** — expenses are typically logged on the go, so the log screen is designed for one-handed use with a bottom tab bar.
- **Clean, minimal visual tone** — monochrome with a single accent, following the system light / dark setting.
- **User authentication via Sign in with Apple** — replaces the Phase 1 hardcoded profile picker described in the Specification.
- **Confirmation shown inline, not on a separate screen** — preserves the mandatory human-in-the-loop review from the Specification while keeping logging to a single screen.

### Assumptions
- The web app will reuse the existing parser prompt, with the review, edit, and save flow unchanged.
- Moving to a cloud-hosted model and Apple sign-in will require updates to the Charter and Specification; an architecture proposal will be drafted for review before any app code is written.

---

## 26 October 2026 — Web App Architecture Decisions and Document Updates

### What Was Done
- Worked through a 21-question decision list covering users and access, the language model, hosting and data, the application stack, first-version scope, and process.
- Created the **Architecture document** (v0.1), recording all 21 decisions with the reason for each, plus a system overview diagram.
- Updated the **Project Charter** (v0.4 → v0.5), **Project Plan** (v0.5 → v0.6) and **Specification** (v0.6 → v0.7) to reflect the hosted web app.
- In the Project Plan, added an **Invited Family Member** persona and moved the Mei, Priya and Sam personas to a new Appendix B (Future / Out of Current Scope). Sam's quote was updated to remove the outdated reference to a 3.8B model.

### Decisions Made
- **Reframed as a hosted, invite-only family app** — self-hosting and local inference moved to non-goals. A "two tracks" framing (hosted app plus self-hosted CLI) was considered but not chosen.
- **Google sign-in with an allow-list** — Sign in with Apple was the first choice, but it requires a paid Apple Developer Program membership (US$99/year); Google sign-in is free and also covers Android users.
- **Claude Haiku 5.5 via the Anthropic API** — fast and inexpensive for simple extraction; structured outputs guarantee valid JSON. Sending expense text to a cloud provider was accepted, on the basis that API data is not used for training.
- **Cost guards** — US$5/month spend limit on the Anthropic account and 100 parses per user per day.
- **Vercel, Neon and Next.js (TypeScript)** — chosen together; Python was not required for the web app, and SQLite cannot persist on Vercel.
- **CLI kept separate** — it continues as a local, offline, experimental tool using Phi-4 and SQLite; existing CLI data will be imported into the web app once.
- **First version limited** to sign-in, Log, History and Summary, with edit and soft delete; installable as a PWA; SGD only; no offline logging; per-user categories with no management screen.

### Assumptions
- James Wong may review these decisions later; the new document versions are authored by Lionel Lam only.
- The Vercel Hobby plan's terms permit a personal, non-commercial family app (to be confirmed on sign-up).

---

## 26 October 2026 — Mockup Updated to Google Sign-In

### What Was Done
- Replaced the "Sign in with Apple" button in `design/ui-mockup.html` with a standard "Sign in with Google" button (multicolour Google logo, Google's light and dark button colours).
- Updated the sign-in screen's note to "Invite only. Your expenses are private to your account."
- Marked the mockup follow-up as done in the Architecture document.

### Decisions Made
- **Follow Google's standard button styling** — a recognisable, familiar sign-in button, consistent with Google's branding guidance, rather than restyling it to match the app's monochrome theme.

---

## 26 October 2026 — Web App v1 Built (Local)

### What Was Done
- Built the Phase 2 web app in a new `web/` folder: Next.js 16 (TypeScript), Auth.js with Google sign-in, Postgres via `pg`, and the Anthropic SDK.
  - **Screens:** Google sign-in, Log (with inline review card), History (month-by-month, tap to edit or delete), Summary (current and previous month, with change vs the previous month).
  - **Parser:** the CLI prompt ported to TypeScript, calling Claude Haiku 5.5 with structured outputs; the category is constrained to the user's own list. Locally, a keyword stand-in is used when no API key is set.
  - **Access:** allow-list stored in an `allowed_emails` table and re-checked on every request; uninvited accounts see a friendly "not invited" message. Sessions last 90 days.
  - **Safeguards:** 100 parses per user per rolling 24 hours; soft delete; edits recorded with `updated_at` and the `edited` flag.
  - **PWA:** web manifest and generated app icons for Add to Home Screen.
  - **Scripts:** `db:migrate`, `allow` (add / remove / list), and `import:cli` (one-off import of the CLI's SQLite data, with a dry-run option).
- Tested end to end locally (PGlite database, dev sign-in): sign-in refusal and success, parse and save, History month navigation, edit, soft delete, Summary, and the import of all 229 CLI records (monthly counts and totals match the CLI exactly).
- Added `web/README.md` with local setup and step-by-step deployment instructions.
- Added a `source_ref` field to the Expense table in the Specification.

### Decisions Made
- **Allow-list in a database table** — invitations take effect without redeploying.
- **Imported records tracked by their CLI id (`source_ref`)** — the first approach (matching on raw text and timestamp) would have silently skipped 11 genuine expenses, because a batch of CLI records shares identical text and timestamps.
- **History shows the original text when there is no merchant** — most CLI records have no merchant, so a dash was uninformative.
- **Dev sign-in for local testing only** — enabled by `DEV_LOGIN=true` and never available in production builds.
- **Today's date comes from the phone** — so relative dates ("yesterday") resolve in the user's own timezone, not the server's.

### Assumptions
- Deployment still requires accounts and keys to be set up by the owner (Anthropic, Vercel, Neon, Google Cloud); see `web/README.md`.

---

## 26 October 2026 — Real Parsing Verified with Claude Haiku 5.5

### What Was Done
- Added an Anthropic API key locally (in `web/.env.local`, which is not committed) and tested the real parser with six informal inputs. All were parsed correctly, including relative dates ("yesterday", "last Friday"), slang amounts ("12 bucks"), dates without a year ("3 Oct"), and category choices such as Household for aircon servicing and Professional Development for an online course. Responses took about 1–3 seconds.
- Fixed a bug found during testing: a detected non-SGD currency (e.g. "USD 15") was shown and saved as SGD. The review card now shows the detected currency, it is saved with the expense, and lists show the currency for non-SGD amounts. Summaries still add amounts without conversion, as decided.

### Decisions Made
- **Stayed with Claude Haiku 5.5** — Gemini's free tier was considered but not chosen, because its terms allow free-tier inputs to be used to improve Google's products. Recorded in the Architecture document (decision 5).

---

## 01 November 2026 — Web App v1 Live on Vercel

### What Was Done
- Deployed the web app to Vercel (Hobby plan) from the `web/` folder: `https://hercules-eta-three.vercel.app`. Pushes to `main` now redeploy automatically.
- Created a Neon Postgres database (`hercules-db`, Free plan, Singapore region) through Vercel's Storage tab, applied the schema, and verified it with a read-only check against `db/schema.sql` (all tables, columns, indexes and foreign keys present).
- Set up Google sign-in in Google Cloud (project `hercules-513414`): an External consent screen named "Hercules" and an OAuth client ("Hercules web") with redirect URIs for the Vercel address and `localhost:3000`.
- Added the production settings in Vercel: `ANTHROPIC_API_KEY`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `DATABASE_URL` (from Neon).
- Signed in on the live site, then imported the CLI history: 229 records imported, 0 skipped, 0 invalid. History shows July and August correctly.
- Allowed the local dev server to be opened from a phone on the home network (`allowedDevOrigins` in `web/next.config.ts`), for trying the app on an iPhone before deployment.

### Decisions Made
- **Kept the generated Vercel address** (`hercules-eta-three.vercel.app`) rather than renaming it.
- **Google consent screen stays in Testing mode** — each invitee is added as a Google test user (limit 100) as well as to the Hercules allow-list. Publishing would require a home page, a privacy policy and, most likely, a custom domain, which is more than a family app needs for now.
- **Neon variables use the `DATABASE` prefix** — so the connection string arrives as `DATABASE_URL`, the name the app already expects.
- **Summary stays limited to this month and last month for v1** — imported July and August data is viewable in History; a month switcher for Summary was considered and deferred.

### Challenges
- Vercel asks for an authenticator code before deploying or redeploying, which the owner must enter; a first redeploy attempt silently did not go through because of this prompt.
- The project owner is not automatically a Google test user; the owner's own email had to be added to the test-user list before the first sign-in.

### Assumptions
- Vercel's Hobby plan terms suit a private, non-commercial family app (still to be confirmed by the owner).

---

## 02 November 2026 — Editable "Today" List on the Log Screen

### What Was Done
- Expenses in the "Today" list on the Log screen can now be tapped to open the same edit sheet as History, to edit or delete them (deletion still asks for confirmation and is a soft delete).
- Moved the edit sheet into a shared component used by both the Log and History screens.
- Updated the Specification to v0.8 (process flow step 8).
- Tested locally: saved an expense, edited its amount from the Today list (list refreshed with the "edited" tag), deleted it, and confirmed History's edit sheet still works.

### Decisions Made
- **Reuse History's edit sheet rather than editing inline** — one consistent way to edit an expense across the app, and no new code paths on the server.

---

## 02 November 2026 — First Family Member Invited

### What Was Done
- Invited the first family member: added as a Google test user in the Hercules Google Cloud project, and to the Hercules allow-list in the live Neon database.
- Confirmed with `npm run allow -- list` against Neon that the allow-list holds exactly two emails: the owner's (added 1 Nov) and the family member's (added 2 Nov).

### Challenges
- Google Cloud's "Add users" panel did not save the test user on the first click of Save (the same happened on 1 Nov); a second Save worked. Worth re-checking the test-user list after adding someone.

---

## 02 November 2026 — Today's Spend by Category on the Log Screen

### What Was Done
- Added a "Today by category" section below the Today list on the Log screen: today's total spend, then one row per category (largest first) with the number of expenses, the amount, and a bar, matching the Summary screen's style. It only appears once something has been logged today.
- Totals are worked out in the app from today's expenses, which the Log screen already loads, so no server changes were needed. They update straight away after saving, editing or deleting an expense.
- Updated the Specification to v0.9 (process flow step 8).
- Tested locally with three test expenses in two categories (totals correct, sorted largest first), then deleted one from the Today list and confirmed the totals updated. Test data removed afterwards.

### Decisions Made
- **Amounts are added without currency conversion** — the same rule as Summary, since the first version is SGD only.

---

## 02 November 2026 — Vercel Hobby Plan Confirmed

### What Was Done
- Confirmed in Vercel's billing settings that the team is on the Hobby plan (active), with no payment method on file and no paid add-ons, so no charges can arise.
- The owner reviewed the Hobby plan terms and confirmed they suit a private, non-commercial family app. Ticked on the Go-Live Checklist and marked as done in the Architecture document's follow-ups.

---

## 02 November 2026 — Faster Page Loads

### What Was Done
- Investigated slow navigation between screens and found two causes: the live server was running in Vercel's default US East region (`iad1`) while the Neon database is in Singapore, and each screen discarded its data when left, so every tab switch reloaded it.
- Measured the live site before the change: four test requests, made without signing in, each took 1.1–1.5 seconds.
- Added `web/vercel.json` to run the server in Singapore (`sin1`), next to the database. Confirmed on the live site after deployment: requests are now served from `sin1`. The same test, again made without signing in, took 0.06–0.88 seconds across five requests, compared with 1.1–1.5 seconds before. Signed-in requests have not been timed.
- Added an in-memory cache to the app. It loads this month's expenses and Summary when the app opens. Screens show the last-loaded data straight away and refresh it in the background. Any save, edit or delete reloads everything held.
- Updated the Architecture document to v0.2 (decisions 22 and 23) and the Specification to v0.10 (process flow step 8).
- Tested locally with an artificial delay on every request: tabs with loaded data opened within 60 ms despite a 1.5-second delay. Editing an expense updated History, Today and Summary, deleting it returned the totals to their previous values, and a failed background refresh left the existing data on screen. Type-check, lint and a production build all passed.

### Decisions Made
- **Keep cached data in memory only** — nothing stays on the device once the app closes or the user signs out. The trade-off is that cold starts are not sped up by the cache.
- **No server-side caching** — the allow-list is re-checked on every request so that removing someone takes effect immediately, and the region move is expected to remove most of the delay.
- **Show last-loaded data while refreshing** — a figure can look out of date for a moment after a change or an entry from another device, until the refresh finishes.

### Assumptions
- The first open after a quiet spell will still be slower, because Neon's free plan suspends an idle database and Vercel's server needs a moment to start. The Parse button's speed also depends on the model's response time.

---

## 02 November 2026 — Pie Chart on the Summary Screen

### What Was Done
- Added a "Share of spend" pie chart below the category list on the Summary screen, with a legend showing each category's name and percentage. It follows the selected month and uses the data Summary already loads, so no server changes were needed.
- Updated the Specification to v0.11 (process flow step 8).
- Ran the chart colours through a palette validator for colour-blind separation and contrast against the app's own backgrounds, in light and dark mode. All hard checks passed. Three light-mode colours are below 3:1 contrast against white, so the legend and the category list carry the labels.
- Tested locally with real data and with mocked summaries: none, one, two, six, seven and 14 categories, at 320 and 375 pixels wide. Fixed cut-off legend names, a "100%" label beside "<1%", an over-bright grey slice in dark mode and a label collision at 320 pixels. Type-check, lint and a production build all passed.

### Decisions Made
- **At most six slices** — with more than six categories, the largest five are shown and the rest are grouped as "Everything else", because 14 slices would be unreadable. The full list stays directly above the chart.
- **"Everything else" rather than "Other"** — "Other" is already a real category.
- **No chart for fewer than two categories** — a full circle adds nothing to the single row above it.
- **Colours follow rank, not category** — the largest category is always blue, so a category's colour can differ between months. Fixed colours were not used because 14 categories cannot have distinct colours without some looking alike.

---

## 02 November 2026 — Wider Layout and Light/Dark Toggle

### What Was Done
- Made the app moderately responsive. Below 768 pixels wide, the phone layout is unchanged apart from the toggle. From 768 pixels, the app grows to a maximum of 820 pixels wide, centred on the screen. Log shows Today and Today by Category side by side, Summary shows the category list beside a larger pie chart, and edit sheets become centred dialogs. The sign-in page keeps its narrower width.
- Added a light/dark toggle at the top right of the Log, History and Summary screens. It follows the device's setting until first used, then remembers the choice in that browser. A saved choice is applied before the page first draws, so dark mode doesn't flash white, and the phone's status bar colour is updated to match on the main screens.
- Updated the Architecture document to v0.3 (decisions 24 and 25).
- Tested locally at 375, 768 and 1280 pixels wide: no sideways scrolling and the expected columns and centred dialog. Tested the toggle in both directions, including a saved choice that differs from the device's setting and surviving a reload, with no hydration errors. Type-check, lint and a production build all passed. Not yet tried on a physical iPhone or iPad.

### Decisions Made
- **Keep the bottom tab bar at every width** — one way to navigate, and it suits a tablet. A top bar or sidebar would be a larger redesign than "moderately responsive" calls for.
- **Keep History in one column** — it is a single list, so two columns would add nothing.
- **Save the theme in the browser, not the database** — it is a display preference for each device, so it doesn't follow the user across devices. Once used, the toggle overrides the device's setting and there is no option in the app to return to following it.
- **No toggle on the sign-in page** — that page follows a saved choice or the device's setting.

---

## 02 November 2026 — Fixed Top Section on the Log Screen

### What Was Done
- The date, "Log an expense" heading, text input and Parse button now stay fixed at the top of the Log screen while the review card and lists scroll beneath them. The theme toggle, any error, the offline notice and the "Saved" message are in the same section, so they stay visible too.
- Pressing Parse now returns to the top of the screen, because the review card could otherwise open out of view when the list has been scrolled.
- Updated the Specification to v0.12 (process flow step 1).
- Tested locally with 25 mocked expenses and a mocked parse at phone and tablet widths, in light and dark mode: the section stays in place while scrolling, the toggle works when scrolled, and the review card opens in view. Type-check, lint and a production build all passed. Not yet tried on a physical iPhone, including with the on-screen keyboard open.

### Decisions Made
- **Log screen only** — History and Summary scroll as before, since they have no input to keep within reach.
- **The review card scrolls** — it is too tall to fix in place on a phone without leaving almost no room for anything else.
- **Not fixed on very short screens** — below 500 pixels tall, such as a phone held sideways, the section scrolls with the page, so it doesn't take up most of the screen.

---

## 02 November 2026 — Today's Total in the Log Screen's Fixed Section

### What Was Done
- Added a "Spent today" line directly below the text input on the Log screen, inside the fixed top section, so today's total stays visible while the list scrolls. It updates after saving, editing or deleting an expense, and uses the same reload as the Today list, so no server changes were needed.
- Updated the Specification to v0.13 (process flow step 1).
- Tested locally with no expenses and with 25 mocked expenses (24 dated today): the total counted only today's and matched the expected sum and the Today by Category total, and the line stayed in place while scrolling. Type-check, lint and a production build all passed.

### Decisions Made
- **Amounts are added without currency conversion** — the same rule as Summary and Today by Category, since the first version is SGD only.
- **Keep the total in Today by Category as well** — that heading scrolls away with the list, so the two serve different moments.

---

## 02 November 2026 — Pie Chart Shown for Every Month with Expenses

### What Was Done
- The owner asked for the pie chart on both month tabs in Summary. It had been hidden for months with only one category, which is why it could be missing from the current month. This reverses the earlier "no chart for fewer than two categories" decision.
- A month with one category now shows a full circle at 100%. A month with no expenses still shows only the "No expenses this month." message, as there is nothing to chart.
- Updated the Specification to v0.14 (process flow step 8).
- Tested locally on both month tabs with local data, and with mocked summaries of none, one and two categories. Type-check, lint and a production build all passed.

---

## 02 November 2026 — Categories Screen and Monthly Budgets

### What Was Done
- Added a fourth tab, Categories, listing the user's categories with their monthly budgets. Categories can be added and renamed, and each can have an optional monthly budget in SGD.
- Added a `monthly_budget` column to the `categories` table (`db/schema.sql`). The migration is safe to re-run and does not change existing data. It must be applied to Neon before this code is deployed.
- Summary now shows "x of budget" beside a category for the current month only, when that category has a budget. Previous months show the total alone.
- Categories now load through the in-memory cache, so changes reach the Log, History and Summary screens straight away.
- Updated the Charter to v0.6, the Project Plan to v0.7, the Architecture document to v0.4 (decisions 26 and 27; decision 17 superseded) and the Specification to v0.15.
- Tested locally: add, rename and budget changes through the screen; duplicate names regardless of capitals; blank names, line breaks and invalid budgets; "Other" keeping its name and last place; another user's category refused; renames carrying through History and Summary; 320 pixels and tablet widths. A real parse of "vet checkup for my dog" chose a newly added "Pets" category. Test data removed afterwards. Type-check, lint and a production build all passed.

### Decisions Made
- **Keep "Other" fixed** — the application falls back to it by name, so it can't be renamed and stays last. Its budget can still be set.
- **No deleting or retiring yet** — an older expense in a retired category would not open and save correctly in the edit sheet. To be handled as a separate change.
- **Store budgets as a column, not a table** — only the current amount is kept, so past months aren't compared against budgets. A table can replace it if budget history is needed.
- **Limit of 50 categories per user** — every category is sent to the language model with each parse, so the list needs an upper bound.

### Assumptions
- A category with a budget and no spend this month doesn't appear in Summary, because Summary lists only categories with spending.
- The bars in Summary still compare categories with each other rather than with their budgets.

---

## 02 November 2026 — Summary Bars Show Spend Against Budget

### What Was Done
- In the current month on Summary, a category with a budget now has a bar showing the share of its budget used, full at 100% or above. Categories without a budget, and all categories in the previous month, keep bars relative to the month's largest category.
- Updated the Specification to v0.16 (process flow step 8) and the wording of Architecture decision 27.
- Tested locally with mocked summaries: under, exactly at and over budget, no budget, and the previous month ignoring budgets. Type-check, lint and a production build all passed.

### Assumptions
- An over-budget bar looks the same as one exactly at budget; the "x of budget" text shows the difference.
