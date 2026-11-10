# Project Hercules — Work Log

```
Maintained by: Lionel Lam Song Poh, James Wong
Purpose: Record of work done, decisions made, challenges encountered, and assumptions held —
to serve as a lessons learned reference for current and future contributors.
Last updated: 10 November 2026
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

---

## 02 November 2026 — Over-Budget Bars Turn Red

### What Was Done
- In the current month on Summary, a category's bar turns red once its spend is above its budget. A category exactly on budget stays in the normal colour. This replaces the earlier assumption that over-budget bars would look the same as bars exactly at budget.
- Updated the Specification to v0.17 (process flow step 8).
- Tested locally with mocked summaries in light and dark mode: over budget, one cent over, exactly on budget, under budget and no budget, with no red bars in the previous month. Type-check, lint and a production build all passed.

---

## 02 November 2026 — Fixed Top Section on the History Screen

### What Was Done
- The "History" heading, theme toggle and month switcher now stay fixed at the top of the History screen while the list scrolls, using the same fixed section as the Log screen. This changes the earlier decision to fix the top section on the Log screen only.
- Switching month now returns to the top of the list, because the new month would otherwise open partway down.
- Updated the Specification to v0.18 (process flow step 8). *Amended 7 November 2026: the step 8 sentence was placed in the v0.10 version history row by mistake instead of step 8; moved to step 8 and the v0.10 row restored in Specification v0.24.*
- Tested locally at phone and tablet widths with local data: the section stays in place while scrolling, the month buttons work and the toggle stays reachable when scrolled, and the edit sheet opens above the section. Log, Summary and Categories were rechecked. Type-check, lint and a production build all passed.

---

## 02 November 2026 — Fixed Top Section on the Summary Screen

### What Was Done
- The "Summary" heading, theme toggle and month selector now stay fixed at the top of the Summary screen while the content scrolls, using the same fixed section as Log and History.
- Switching month now returns to the top of the screen, as on History.
- Updated the Specification to v0.19 (process flow step 8). *Amended 7 November 2026: as with v0.18, the step 8 change was placed in the v0.10 version history row by mistake; corrected in Specification v0.24.*
- Tested locally on a short phone-sized screen with local data: the section stays in place while scrolling, switching month returns to the top, the toggle works, and the other tabs still have their toggle. Type-check, lint and a production build all passed.

---

## 02 November 2026 — Fixed Top Section on the Categories Screen

### What Was Done
- The "Categories" heading, its note, the theme toggle and the Add category button now stay fixed at the top while the list scrolls, so all four screens work the same way.
- Updated the Specification to v0.20 (Section 5.2).
- Tested locally on a short phone-sized screen: the section stays in place while scrolling, Add category and the category rows open their sheets above it, and every tab still has one toggle. Type-check, lint and a production build all passed.

---

## 07 November 2026 — Spending Pace Against Budget on Summary

### What Was Done
- Explored ways to show spending pace against budget, like a burn-up chart. A planning subagent compared three options, and mockups of each were drawn in `design/summary-pace-mockups.html`. The owner chose Option A and asked to drop the "too early to tell" step for the first days of the month, to keep things simpler.
- For the current month on Summary, each budgeted bar now has a marker at the amount expected by today (budget × day of month ÷ days in month, counting today), and a note beneath it: "Over budget by $X" (red, with an icon), "Budget used", "On pace" (within 5% of the budget either side of the expected amount) or "$X over/under pace", then the amount left and about how much a day remains.
- Tapping a budgeted category opens a burn-up chart: its running total, the budget spread evenly over the month (dashed), and today. Pointing at or dragging across the chart, or using the arrow keys, shows any day's spend and expected amount. A "Daily figures" table lists the same numbers. One chart opens at a time.
- Budgeted categories with no spending yet now appear at $0, and "Day 7 of 30" is shown under the month's total. The previous month is unchanged.
- The current month's figures are now worked out in the app from the month's expense list and categories, so the totals, bars and pace always agree. No server or database changes.
- Updated the Specification to v0.21 (process flow step 8) and the Architecture document to v0.5 (decision 28).
- Tested locally with sample budgets and expenses for 1–7 November: Budget used, Over budget, On pace, under pace and over pace wording, the expected-by-today markers, opening and closing charts, the tooltip by pointer and keyboard, the daily figures, the October tab without pace, and tablet width. Test data removed afterwards. Type-check, lint and a production build all passed.

### Decisions Made
- **No "too early to tell" period** — chosen by the owner for simplicity. In the first days of the month, a single expense can therefore show as over pace.
- **Red only for over budget** — spending early, such as rent on day 1, is not overspending, so over pace stays in the normal colour.
- **No month-end forecast** — it would be badly wrong early in the month and for one-off spends.
- **Charts only for budgeted categories** — categories without a budget have nothing to pace against.

### Assumptions
- Budget changes made on another device appear after the app reloads its data, for example after saving an expense or reopening the app.

---

## 07 November 2026 — Summary Lists Only Categories with Spending

### What Was Done
- On the owner's request, Summary no longer lists budgeted categories with no spending in the current month, to keep the page clean. This reverses the earlier choice to list them at $0. When nothing has been spent this month, Summary again shows "No expenses this month."
- Updated the Specification to v0.22 (process flow step 8).
- Tested locally with the owner's own local budgets and expenses: categories with spending appear with their pace notes, and budgeted categories with nothing spent are hidden. Type-check, lint and a production build all passed.

### Challenges
- During testing, the owner was also setting budgets in the same local app. A test change briefly overwrote and then cleared their local Groceries budget ($300); it was restored straight away. Live data was not affected.

---

## 07 November 2026 — Spending Pace Rules Documented

### What Was Done
- Added Section 4.1 to the Specification (now v0.23): the spending pace rules as an ordered table, showing which note wins, how each amount is calculated, the "about $Z/day" figure, the last day of the month, and that the on-pace band is 5% of the full monthly budget. It includes a worked example for 7 November. Process flow step 8 now points to it. Documentation only; the app is unchanged.

---

## 07 November 2026 — Documentation Corrections

### What Was Done
- Produced a readable guide to the Specification and Architecture, with screen mockups, as a private claude.ai artifact ("How Hercules Works"). Writing it surfaced five problems in the source documents, which the owner reviewed one by one before they were fixed.
- **Item 1:** the Specification's v0.10 version history row had wrongly absorbed the History and Summary pinned-header sentence intended for process flow step 8 (in v0.18 and v0.19). The row was restored, the sentence moved to step 8 (Specification v0.24), and the two original worklog entries amended.
- **Item 2:** "Last Reviewed" dates in both documents updated from 2 to 7 November 2026.
- **Item 3:** the Architecture system overview now lists all four screens, including Categories.
- **Item 4:** Architecture decision 8 now records that the Vercel Hobby plan terms were confirmed on 2 November 2026, instead of "to be checked on sign-up".
- **Item 5:** two features described in the Specification are not built in the web app: merchant suggestions from past entries, and the "Other" category's sub-label prompt. Both are now marked as not yet built (Specification v0.25). The sub-label column exists in the database but is always empty.
- Documentation only; the app is unchanged. Specification now v0.25, Architecture v0.6.

### Challenges
- The item 1 error came from an edit script that replaced the first occurrence of a phrase appearing twice in the document. Edits now check that the text being replaced occurs exactly once.

---

## 07 November 2026 — Readable Guide Added to the Repository

### What Was Done
- Added `Project Hercules - How Hercules Works.html`, a standalone copy of the readable guide to the Specification (v0.25) and Architecture (v0.6), with screen mockups. It opens directly in a browser. The same guide is also kept as a private claude.ai artifact.

### Assumptions
- The Markdown documents remain the source of truth. The guide is a snapshot and should be refreshed when either document changes significantly.

---

## 07 November 2026 — Document Integrity Check

### What Was Done
- Checked every project document against the others and against the app's code. Versions, limits (100 parses a day, 50 categories, 14 defaults, US$5 a month), the model, the server region, the layout breakpoints and the spending pace rules all agree.
- Fixed four contradictions:
  - The Charter's Expense data model listed "date and time" and "payment method", which the app doesn't have.
  - The Specification and Project Plan said the allow-list lives in "configuration or the database"; it is the `allowed_emails` table, managed with `npm run allow`.
  - The Project Plan still said the Vercel Hobby plan terms were "to be checked on sign-up".
  - The Specification and Architecture said expenses are edited "from History"; they can also be edited from the Log screen's Today list.
- Brought the Project Plan's feature list up to date with the pie chart and spending pace.
- Added two notes to `web/README.md`: apply schema changes to Neon before pushing code that relies on them, and keep the server and database in the same region (`vercel.json` uses `sin1`).
- Noted that the diagrams from July 2026 (flow diagram, Entity Relationship Diagram, Application Wireframes) and the October UI mockup are historical, pending a redraw.
- Charter now v0.7, Project Plan v0.8, Specification v0.26, Architecture v0.7. The readable guide's version references were updated to match. Documentation only; the app is unchanged.

---

## 07 November 2026 — Larger Burn-up Chart

### What Was Done
- The owner felt the burn-up chart on Summary wasted space at its sides. Mockups compared several options (`design/burnup-chart-mockups.html`): removing the y-axis, narrower margins, and a full-width layout with and without the amount beside today's dot, including how labels move near the end of a month that runs over budget. The owner chose the full-width layout with the amount kept beside the dot.
- The chart now runs to the edges of the open category, with no y-axis labels and small side margins, and is a little taller. On a 375-pixel phone, the plotted area grew from about 233 to 347 pixels wide (62% to 93% of the screen).
- Labels move to stay clear of each other: today's amount moves to the dot's left when it would run past the right edge, "Budget X" moves to the left end of its line late in the month once spending reaches 80% of the budget, and "Today" and the end dates align to the chart's edges.
- This also fixes an overlap in the previous chart, where today's amount could run into "Budget X" late in the month when spending was close to the budget.
- Updated the Specification to v0.27 (Section 4.1, burn-up chart layout).
- Tested locally with temporary expenses and simulated dates (days 22, 26, 28 and 30), plus today's real date with the tooltip showing. A check of every label against the other labels, the dots and both lines found no overlaps, and the chart filled the open panel exactly. Test data removed afterwards. Type-check, lint and a production build all passed.

### Assumptions
- Expenses dated later in the current month count towards the month's total and pace note, as before. This only arises if someone logs an expense with a future date.

---

## 07 November 2026 — Readable Guide Refreshed

### What Was Done
- Updated the readable guide (repository copy and the private claude.ai artifact) for Specification v0.27: its Summary mockup now shows the larger burn-up chart, drawn with the same layout and label rules as the app, and its document versions now read Specification v0.27 and Architecture v0.7.

---

## 07 November 2026 — Wider Layout on Larger Screens

### What Was Done
- The owner noticed wide empty bands either side of the app in a laptop browser. Mockups (`design/wide-layout-mockups.html`) compared the current 820-pixel limit with two wider options in a 1,440-pixel laptop window and on an iPad held sideways; the owner chose Option A.
- The app now widens to 920 pixels from 1,024-pixel windows (iPad held sideways, small laptops) and to 1,000 pixels from 1,280-pixel windows. Phones and upright iPads are unchanged, as are the two columns, the tab bar and the inner padding.
- In a 1,440-pixel window, the app now uses 69% of the width instead of 57%, and each empty band shrinks from 310 to 220 pixels. The burn-up chart grows with its column, and its text from about 11 to 14 pixels, which stays comfortable to read.
- Updated the Architecture document to v0.8 (decision 24) and the readable guide (repository copy and artifact).
- Tested locally at 375, 900, 1,024, 1,279, 1,280 and 1,440 pixels across all four tabs and the edit dialog: the expected widths at each step, no sideways scrolling, and the edit dialog still 480 pixels. Type-check and a production build passed.

### Decisions Made
- **Option A over the wider Option B** — Option B (up to 1,120 pixels, list column favoured) would have made the burn-up chart's text oversized unless the chart was rewritten to keep its labels a fixed size.
- **History and Categories use the full width too** — their rows are a little wider at 1,000 pixels but still read comfortably, so they weren't capped.

---

## 07 November 2026 — Second Document Integrity Check

### What Was Done
- Re-checked all project documents against each other, the readable guide and the code after the burn-up chart and wider layout changes. Versions, layout widths, chart rules and the guide all agreed.
- Fixed two wording issues in the Specification (now v0.28): the v0.27 entry said the chart has no side margins (it has small ones), and Section 4.1 now states that the "Today" label aligns left on the first day and right on the last two days of the month, as the code does. The readable guide now cites Specification v0.28. Documentation only.

---

## 07 November 2026 — Sample Data for Local Testing

### What Was Done
- Added `npm run sample -- add <email>` and `remove <email>` (`web/scripts/sample-data.mts`), which add 194 made-up expenses to the local database: full months for September and October 2026, and 1 to 7 November chosen so the Summary shows each pace state against the local budgets (Food & Dining and Transport over pace, Groceries on pace, Shopping under pace).
- Loaded the sample into the owner's local database alongside their existing entries, and checked the Summary screen. Re-running `add` adds nothing new. Documented in the web README.

### Decisions Made
- **Tagged, not separate** — sample rows use `source_ref = 'sample:<n>'`, the same column the CLI import uses, so they can be removed exactly without touching real entries, and no schema change is needed.
- **Local database only** — the script refuses to run unless `DATABASE_URL` points at the local machine, so sample data can't reach the live Neon database.
- **Fixed, repeatable data** — a seeded generator produces the same expenses every time, so results are predictable when testing.

---

## 08 November 2026 — Security Audit: Impossible Dates Refused

### What Was Done
- Ran a basic security audit of the web app. Access control, per-user data separation, query safety, input validation, secrets handling and the live site's sign-in checks were all sound; five low-risk improvements were listed, and the owner chose to fix the date handling first.
- Impossible dates such as 31 February, month 13 or year 0000 passed the format check and then failed in the database, giving a server error. The app now checks for a real calendar date in the years 2000 to 2099 when saving or editing an expense, when asking for a month's expenses or summary, and for the date sent with a parse request. These are refused with the usual "Please check the amount and fields." message. A parsed date that isn't real now falls back to today, as a badly formatted one already did.
- Updated the Specification to v0.29 (process step 7 and the `date` field).
- Tested against the local app with read-only or refused requests only: bad dates and months returned 400 on every route, and a normal month still loaded. Type-check, lint and a production build passed.

### Decisions Made
- **Years limited to 2000–2099** — wide enough for any real expense, and it rules out years the database can't store.
- **Correction to the audit** — the audit also listed very large category numbers as causing a server error. Testing showed they were already refused cleanly, so no change was needed there.

---

## 08 November 2026 — Retiring Categories

### What Was Done
- The owner asked to delete categories without losing them from past expenses, and whether each expense should also store a text copy of its category name. A planning subagent reviewed the impact across the code and documents; mockups (`design/category-retire-mockups.html`) showed each screen, and the owner approved the recommended design, with History left unmarked.
- **Retire and restore:** any category except "Other" can be retired from its edit sheet, after a confirmation that mentions its budget when it has one. Retired categories move to a collapsed "Retired" group at the bottom of the Categories screen, each with a Restore button. Adding a name that matches a retired category restores it instead of reporting "name in use"; the sheet says so beforehand, and whether a budget will apply. Retired categories can't be renamed until restored.
- **Past expenses:** History, the Today list and Summary keep showing a retired category's name. Its budget isn't tracked while retired, so this month's spending in it shows as a plain bar. An expense already in a retired category opens with "*name* (retired)" and saves normally; previously this case showed the wrong category and failed to save. No other expense can be put in a retired category, and the parser only sees active categories.
- Updated the Specification (v0.30), Architecture (v0.9, new decision 29, with decision 26's deferral struck through), Project Charter (v0.8), Project Plan (v0.9) and the readable guide (repository copy and artifact).
- Tested against the local app with temporary `zz-test-` categories and `[TEST]` expenses: 15 server checks (retire, refusing "Other", refusing new expenses in a retired category, editing an old one, moving it out but not back, refusing renames, restoring by re-adding and by the Restore route) and the screens themselves, then removed the test rows. The owner's local data was unchanged afterwards (14 active categories; November's 20 expenses still totalling $2,283.02). Type-check, lint and a production build passed.

### Decisions Made
- **Retire, not delete** — the row stays, using the existing `is_active` flag, so no database migration was needed. A permanent delete would fail anyway for any category an expense refers to, including deleted expenses.
- **No text copy of the category name on expenses** — categories are never removed, so the name can always be looked up. A copy would either keep old names after a rename, against decision 26, or need rewriting on every rename.
- **History not marked** — the owner chose to show retired categories in History as normal; only the edit sheet says "(retired)".

---

## 08 November 2026 — Confirmation Sheets, Undo and Unsaved Changes

### What Was Done
- While testing locally, the owner found Retire did nothing in the Claude app's built-in browser: it switches off the browser's own prompts and silently answers "Cancel". The same applied to deleting an expense. Earlier tests had missed it because they stood in for the prompt and answered "yes".
- Mockups (`design/confirmation-mockups.html`) covered four uses of an in-app confirmation sheet. The owner chose to build the first two now, with both a confirmation and Undo for deleting and retiring; duplicate and unusual-value warnings are left for later.
- **Confirmation sheet:** the app's own sheet slides up over the open screen (a centred dialog on wider screens). Delete expense shows which expense; Retire category explains what happens, with a budget paragraph when it has one.
- **Undo:** after deleting an expense or retiring a category, an "… · Undo" bar shows above the tab bar for about five seconds. Deleting now has an in-app way back, through a new `POST /api/expenses/[id]/restore` route.
- **Unsaved changes:** Edit expense, Edit category and Add category ask "Discard changes?" when closed with changes, by Cancel or by tapping outside. The Log screen's review card asks "Discard your edits?" only if a parsed detail was changed. Unchanged sheets close straight away.
- Updated the Specification (v0.31, new Section 4.2), Architecture (v0.10, decision 30) and the readable guide (repository copy and artifact).
- Tested in the local app with a temporary `zz-test-c` category and a `[TEST]` expense: delete with confirmation, Undo, the bar closing by itself after five seconds, retire with the budget paragraph, Undo and Restore, Cancel on each confirmation, discard checks with and without changes on all four sheets, and the centred dialog at 1,024 pixels. Two test parses were run. Test rows and parse records were then removed, and the owner's local expenses and categories were confirmed identical to a snapshot taken beforehand. Type-check, lint and a production build passed.

### Decisions Made
- **Both confirmation and Undo** for deleting and retiring — a delete is easy to tap by mistake, and Undo also covers a confirmation tapped through too quickly.
- **Only ask when something changed** — so the discard prompt keeps its meaning.
- **One Undo at a time** — a new action replaces the previous bar.

---

## 08 November 2026 — Refactoring Review and Quick Wins

### What Was Done
- Reviewed the codebase for refactoring opportunities. The main finding was that `components/hercules-app.tsx` has grown to over 1,000 lines; others were scattered date helpers, types defined twice, repeated sign-in boilerplate in the 11 server routes, and no automated tests. The owner chose to start with two quick wins.
- **Unused request removed:** the app requested the current month's Summary totals each time it opened and each time Summary loaded, but the current month is worked out on the device from this month's expenses, so the result was never used. It is no longer requested, saving a database query on every app open. The month summary also no longer returns budgets, which only the current month uses. Architecture decision 23 updated (v0.11).
- **Fragile query fixed:** restoring a category built part of its SQL by text-replacing a placeholder in a shared fragment. The fragment is now a small function that takes its parameter positions explicitly.
- Tested in the local app: on opening, only this month's expenses, the categories and last month's totals are requested; Summary shows the same figures as before for November ($2,283.02, −$1,224.48 vs October, same pace notes) and October ($3,507.50, +$348.60 vs September). Retire, restore, restore-by-re-adding and the duplicate-name check all behaved as before, using temporary `zz-test-` categories that were then removed; local data was confirmed identical to a snapshot taken beforehand. Type-check, lint and a production build passed.

---

## 08 November 2026 — Code Reorganised by Role

### What Was Done
- Split `web/components/hercules-app.tsx` (1,066 lines) by role, with no change to behaviour:
  - `components/screens/`: `log.tsx`, `history.tsx`, `summary.tsx`, `categories.tsx` (one file per screen).
  - `components/`: `confirm.tsx` (confirmation sheet and Undo bar), `expense-sheet.tsx` (expense row and edit sheet), `pace.tsx` (pace note and burn-up chart), `spend-pie.tsx`. `hercules-app.tsx` keeps only the shell and tab bar (59 lines).
  - `lib/types.ts`: `Category`, `Expense` and `SummaryRow`, defined once for the server and the screens (previously defined twice).
  - `lib/dates.ts`: all date checks, arithmetic and formatting, previously split across `lib/expenses.ts`, `lib/parser.ts` and the screen file, with the same date format written out in five places. The parser no longer imports the database module just to check a date.
  - `lib/pace.ts`: the spending pace maths, as plain functions that can be tested on their own.
  - `lib/client.ts`: fetching, the in-memory cache, the online check and money formatting.
- Architecture v0.12 records the layout as decision 31.
- Checked that every block of the old file appears unchanged in the new files, apart from the intended changes (shared types and date helpers, two renamed parameters). Clicked through every screen in the local app: Log, History (day headings, delete confirmation), Summary ($2,283.02, −$1,224.48 vs October, the same pace notes, pie chart and burn-up chart) and Categories (14 categories, discard and retire confirmations), all matching earlier results; local data confirmed unchanged. Type-check, lint and a production build passed.

---

## 08 November 2026 — "How Hercules Works" Rewritten as a User Guide

### What Was Done
- At the owner's request, rewrote `Project Hercules - How Hercules Works.html` (repository copy and the private claude.ai artifact) as a guide for people using the app, instead of a plain-language edition of the Specification and Architecture.
- New sections: getting started (signing in, adding to the home screen, light and dark mode), logging an expense, what to type (with examples), fixing and deleting (with Undo), History, Summary, spending pace in everyday terms, categories and budgets (including retiring and restoring), privacy, and quick answers to common problems.
- Kept the existing look and the app mockups; added mockups of the delete confirmation and the Undo bar. Removed the project material (principles, data model, AI boundary table, system diagram, decision record, costs, open questions and roadmap), which remains in the Specification and Architecture.
- Checked the guide's statements against the app: button labels, the 90-day sign-in, the 100-a-day parse limit, the pace notes, the 50-category limit, Discard keeping the typed text, and what is sent to Claude and Google.

### Decisions Made
- **Plain privacy section** — states plainly that the owner can reach the database to fix problems or recover deleted expenses, rather than implying no one can.

---

## 08 November 2026 — User Guide Published on GitHub Pages

### What Was Done
- Published the user guide at https://lionellam.github.io/hercules/ using GitHub Pages, at the owner's request.
- Added `.github/workflows/guide-pages.yml`, which copies `Project Hercules - How Hercules Works.html` to the site's `index.html` and deploys it whenever the guide changes on `main` (or when run by hand). Only the guide is published.
- Turned on GitHub Pages for the repository with GitHub Actions as the source.

### Decisions Made
- **Publish only the guide** — the repository is already public, but the site shows just the guide, under a short address, without renaming or copying the file in the repository.
- **Checked before publishing** — the guide contains no email addresses or link to the app; it names the owner by first name only.

---

## 08 November 2026 — README Links to the User Guide

### What Was Done
- Added a top-level `README.md`, which the repository had not had, so its GitHub front page now explains the project, links to the user guide on GitHub Pages, and lists the folders and project documents.
- Added the user guide link to `web/README.md`, with a note on how the page is published.

---

## 09 November 2026 — Search on History

### What Was Done
- The owner asked for a search field on History that filters with each keystroke, with an "×" to clear it and "No search results" when nothing matches. Mockups (`design/history-search-mockups.html`) compared searching the month shown with searching all months; the owner chose the month shown, with the field below the month switcher, the results-and-total line kept, and the search cleared when leaving History.
- History now has a search field below the month switcher, in the pinned top section. It filters the selected month's expenses on each keystroke, keeping the day groups and highlighting matching text. Each word must appear, in any order and regardless of capitals, in the merchant, original text, category, remarks or amount. A line above the list shows the number of results and their total; "No search results" names the month and the search text. The "×" (or Escape) clears it, and changing the month or leaving History clears it too.
- No server change: the month's expenses are already loaded for the list.
- Updated the Specification (v0.32, new Section 4.3), Architecture (v0.13, decision 32) and the user guide's History section.
- Tested in the local app by typing letter by letter: "g" (16 results) narrowing to "grab" (3 results, $69.80, all highlighted); "grab sushi" showing "No search results"; the × and Escape restoring all 20 expenses; "64.90" finding the one Shopee expense; "KUN ya" finding Ya Kun regardless of order and capitals; switching to October clearing the search; and leaving and returning to History starting fresh. Checked in light and dark mode. Searching only reads data, so nothing was changed. Type-check, lint and a production build passed.

### Decisions Made
- **Search the month shown, not all months** — instant on every keystroke with no server work; all-months search can be added later if needed.
- **Clear the search when the month changes** — the search belongs to the month selected, so each month starts with its full list.

---

## 09 November 2026 — No More Zooming In on Phone Fields

### What Was Done
- The owner noticed that on their phone, tapping some fields to edit them made the browser zoom in slightly, and they had to zoom back out by hand afterwards. This is Safari on iPhone zooming in on any text field whose text is smaller than 16 pixels; the fields on the review card, Edit expense and the category sheet (Category, Merchant, Date, Remarks, Name, Monthly budget) used 15 pixels.
- Those fields now use 16-pixel text on phone-sized screens (up to 767 pixels wide). Tablets and computers keep 15 pixels. The expense box (17px), the amount (34px) and History search (16px) were already large enough.
- Updated Architecture decision 24 (v0.14).
- Checked at phone width that every field on Log, History search, Edit expense and Edit category is now 16 pixels or larger, that the edit sheet still lays out cleanly, and that fields at 1,024 pixels are unchanged at 15 pixels. Production build passed. Safari's zoom itself can't be reproduced in the test browser, so the owner will confirm the fix on their phone.
- **Confirmed (9 November 2026):** after the deploy, the owner checked on their phone that tapping the edit fields no longer zooms the page.

### Decisions Made
- **Larger text rather than turning zoom off** — telling the browser not to zoom would also stop the auto-zoom, but on some phones it blocks pinch-to-zoom too, which hurts readability for anyone who needs larger text.

---

## 09 November 2026 — Test Plan for the Web App

### What Was Done
- Wrote `Project Hercules - Test Plan.md` (v1.0) at the owner's request: a complete, human-readable set of manual test cases for the web app, each with steps and the expected result, using the app's exact messages.
- Covers signing in and access, logging, the review card, fixing and deleting with Undo, unsaved changes, History and search, Summary, spending pace (with a worked example), the burn-up chart, categories and budgets, retiring and restoring, look and layout, phones, offline and limits, and database checks. Section 6 is a short check for the live app after each deploy; Section 7 is a results record to copy.
- Sets out where to test (the local app, with sample data), how to mark test data (`[TEST]` and `zz-test-`) and how to clean it up.
- Linked from the top-level README.

### Decisions Made
- **Local app for testing, live app only for a short smoke test** — keeps test data out of real spending, in line with how testing has been done throughout.

---

## 09 November 2026 — Clear Button on the Log Box

### What Was Done
- The owner asked about keeping a draft of the Log box's text between visits, and an "×" to clear it. Saving drafts was discussed (it would also keep text when switching tabs) but the owner chose to keep things simple and add only the "×". Mockups: `design/log-clear-mockups.html`.
- An "×" now appears at the top right of the Log screen's text box once there is text, and clears it in one tap without asking, leaving the cursor in the box. Long text wraps before reaching it. It matches the "×" in History search.
- Updated the Specification (v0.33, process step 1) and the user guide's Log section.
- Tested in the local app at phone width and at 1,024 pixels, in light and dark mode: no "×" when empty; typing shows it at the top right inside the box; tapping it empties the box, keeps the cursor there and dims Parse; typing again brings it back. No expenses were parsed or saved. Type-check, lint and a production build passed.

---

## 09 November 2026 — User Guide Mockups Brought Up to Date

### What Was Done
- The owner noticed the user guide's screen mockups no longer matched the app. Updated them in both copies (repository and artifact): the Log and review mockups now show the "×" in the text box, the three History mockups show the search field below the month, and a new mockup in the History section shows a search for "grab" with highlighted matches and the results-and-total line.

---

## 09 November 2026 — Settings Tab

### What Was Done
- The owner asked for a Settings page, with Categories moved into it and renamed. Mockups (`design/settings-mockups.html`) compared Settings as a short menu (Option A) with everything on one page (Option B). The owner chose Option A, named the page "Categories & budgets", and asked for no user guide link, and for the app's version and last update to be shown below the account section.
- **Tab bar:** Log, History, Summary and **Settings** (a gear), in place of Categories.
- **Settings:** Spending (**Categories & budgets**, with the number of categories and how many have a budget), Appearance (System, Light or Dark), Account (email address and Sign out), and the version with the date and time of the last update.
- **Categories & budgets** opens as its own page with "‹ Settings" to go back; it works exactly as the Categories tab did. Opening the Settings tab always starts on the list.
- **Appearance** replaces the sun or moon icon on every screen, and adds a System choice that follows the device (the saved choice is cleared). The phone's status-bar colour still follows the theme. **Sign out** moves from the bottom of Summary.
- **Version and last update** come from `web/package.json`, the short commit ID and the build time, fixed when the app is built (`web/next.config.ts`); on Vercel the commit comes from the deployment.
- Updated the Specification (v0.34, new Section 4.4), Architecture (v0.15, decision 33; decisions 25 and 26 updated), Project Plan (v0.10), Project Charter (v0.9), Test Plan (v1.1, new Section Q) and the user guide (new Settings section and mockup; tab bars and the categories mockup updated; theme icon removed from mockups).
- Tested in the local app at phone width and at 1,024 pixels: the four tabs; no theme icon on Log, History or Summary and no sign-out on Summary; the Settings list with "14 categories · 5 with a budget" and "Version 0.1.0 (6b31fbc)"; Categories & budgets opening and "‹ Settings" returning; Settings reopening on the list after switching tabs; Dark, Light and System each applying at once with the status-bar colour following; System following a dark device; and Dark kept after a reload. The test browser's theme was put back to System afterwards. No data was changed. Type-check, lint and a production build passed.

### Decisions Made
- **A menu rather than one long page** — keeps Settings tidy and leaves room for more settings later.
- **Theme choice only in Settings** — tidier screen headers, and a System option the old icon couldn't offer.

---

## 09 November 2026 — Sign-out Confirmation

### What Was Done
- The owner asked for a confirmation before signing out. Mockups (`design/signout-confirm-mockups.html`) showed the app's confirmation sheet with a dark or a red button; the owner chose red.
- Tapping **Sign out** in Settings now opens "Sign out?" ("You'll need to sign in with Google again to use Hercules on this device. Your expenses stay safe in your account.") with a red **Sign out** button and **Cancel**. Tapping outside the sheet also cancels.
- **Found while testing:** after signing out and back in on the same browser tab, the app reopened on the tab used before (Settings), because the framework keeps a page's state in memory across navigation. Expenses loaded before signing out could therefore stay in memory for whoever signed in next on the same tab, and briefly show before refreshing. Fixed: signing out now only clears the sign-in cookie and then fully reloads the page, and the app is tied to the person signed in, so a different sign-in always starts empty.
- Updated the Specification (v0.35; Section 4.2 table and Section 4.4, and "signing out" removed from the actions that don't ask), Architecture (v0.16; decisions 23 and 30), Test Plan (v1.2; A-05, A-09, A-10) and the user guide's Settings section.
- Tested in the local app: the sheet's text and red button; Cancel and tapping outside both keep you signed in; confirming signs out to the sign-in screen with the page's memory cleared (a marker set before signing out was gone); signing back in opened fresh on Log. Type-check passed.
- **Confirmed (9 November 2026):** after the deploy, the owner checked on their phone that Sign out shows the confirmation and works as expected.

---

## 09 November 2026 — User Guide: What and Why, and Mockups Refreshed

### What Was Done
- At the owner's request, added a "What Hercules is, and why" section at the start of the user guide, before Getting started: what the app is; why it exists (logging should take seconds, you stay in control, no subscription, private by design, budgets you can act on mid-month, and a real-world trial of CPMAI), drawn from the Project Charter's objectives and problem statement; and what it doesn't do (no bank sync or receipt reading, SGD totals, no shared budgets, no export yet).
- Brought the mockups up to date with the app: Summary now shows the comparison with last month ("+$412.60 vs October"); Settings shows the current version line; a new mockup shows the sign-out confirmation; and Categories & budgets shows the collapsed "Retired" row.
- Updated both copies (repository and artifact).

---

## 09 November 2026 — Version 1.0.0, Changelog and Tags

### What Was Done
- Discussed how to manage the app's version, which had stayed at 0.1.0 since the start although the app has been live since 1 November. The owner chose semantic versioning, starting at 1.0.0, with a changelog and Git tags.
- Set the web app's version to 1.0.0 (`web/package.json` and `package-lock.json`); Settings now shows "Version 1.0.0" with the commit and build time.
- Added `CHANGELOG.md` with a plain-English 1.0.0 entry covering everything built up to now, linked from the README.
- Recorded the rules in Architecture decision 34 (v0.17), the top-level README (Versions) and `web/README.md` (Releasing a new version).
- Tagged the release `v1.0.0`.

### Decisions Made
- **Semantic versioning** — major for a fundamental change or an irreversible data change, minor for a new feature, patch for a fix or small tweak, and no change for documents alone.
- **Start at 1.0.0 now** rather than counting back from go-live — simpler, and the worklog already records the history.
- **Bump in the same commit, tag after pushing** — the number and the code never disagree, and each tag marks exactly what was released.

---

## 09 November 2026 — Test Plan Integrity Check

### What Was Done
- Checked the Test Plan against the code, Specification v0.35 and Architecture v0.17. Every quoted message and the spending-pace arithmetic were correct, and every feature in the Specification has at least one test.
- Fixed six issues (Test Plan v1.3): S-02 still listed a Categories tab; B-07 referred to a non-existent M-07 (now L-01); A-09 and A-10 were out of order; the v1.2 history entry left out A-10; Q-08 now checks the version against `CHANGELOG.md`, with a new after-deploy check S-07; and the clean-up SQL now also removes test parse records, which count towards the daily limit. Documents only, so the app version stays at 1.0.0.

---

## 09 November 2026 — Version 1.1.0: Download Expenses as CSV

### What Was Done
- The owner asked for a way to download an expense report as a CSV file from Summary: month to date for the current month, and the whole of the previous month. Mockups (`design/export-csv-mockups.html`) compared a button beside the month's total (A), an icon in the heading (B) and a full-width button at the bottom (C), with a preview of the file. The owner chose A, all nine columns, and file names by month only.
- **Summary** now has a **CSV** button beside the month's total. It downloads the month selected, as `hercules-expenses-YYYY-MM.csv`, and a short message names the file.
- **The file** comes from a new server route, `GET /api/expenses/export?month=YYYY-MM`, so it downloads reliably on phones, including the home-screen app. It has one row per expense, oldest first, with Date, Category, Merchant, Amount, Currency, Remarks, What you typed, Edited and Logged at (Singapore time). Deleted expenses are left out. It is UTF-8 with a byte-order mark for Excel, text is quoted where needed, and text starting with `=`, `+`, `-` or `@` gets a leading apostrophe so a spreadsheet can't run it as a formula.
- Version **1.1.0** (a new feature), with a changelog entry.
- Updated the Specification (v0.36, new Section 4.5), Architecture (v0.18, decision 35), Project Plan (v0.11) and Charter (v0.10), which now record export as delivered early, the Test Plan (v1.4, new Section R) and the user guide (Summary section; "no export yet" removed).
- Tested in the local app: signed-out requests get 401 and no file; November's file has 20 rows totalling $2,283.02, matching the app; October's has 106 rows totalling $3,507.50, matching Summary; rows are oldest first; an empty month gives the header only; an invalid month is refused; the file starts with the byte-order mark; a temporary `[TEST]` expense with a comma, quotes, "é" and the remark `=SUM(1)` came out correctly quoted with the remark as text; once deleted it was left out. On screen, the button sits beside the total on phone and desktop, follows the month selected, and shows the message for three seconds (the actual download was blocked during testing, so nothing was saved to the computer). Settings shows "Version 1.1.0". The test expense was removed and local data confirmed identical to a snapshot. Type-check, lint and a production build passed.
- **Confirmed (9 November 2026):** after the deploy, the owner checked on their phone that the CSV download works.

---

## 09 November 2026 — User Guide Mockups for 1.1.0

### What Was Done
- Updated the user guide's mockups (repository copy and artifact) for version 1.1.0: the Summary mockup now shows the **CSV** button beside the total, with a note in its caption, and the Settings mockup shows "Version 1.1.0 (cdfd0e7)". Documents only, so the app version stays at 1.1.0.

---

## 09 November 2026 — Document Integrity Check (after 1.1.0)

### What Was Done
- Checked all project documents against each other and against the app at version 1.1.0. Versions, dates, history tables, the changelog, both READMEs, the user guide's text and the Go-Live Checklist were consistent.
- Fixed seven issues:
  1. Architecture (v0.19): the system overview still listed a Categories tab; it now lists Settings.
  2. User guide: the "Updated" date in its header still said 8 November.
  3. Specification (v0.37): the resolved "User/profile model" question still described the prototype's hardcoded profiles; it now records Google sign-in with an allow-list.
  4. Charter (v0.11) and Project Plan (v0.12): Phase 2 (Web App v1) is now marked complete — live since 1 November, released as 1.0.0.
  5. Project Plan: the feature list now includes History search, Settings, and confirmations with Undo; Phase 3 notes History search and the CSV download as delivered early.
  6. Specification: the "`raw_input` storage shape" question is marked resolved (a single table, as built).
  7. Test Plan (v1.5): new after-deploy check S-08 for the CSV download.
- Documents only, so the app version stays at 1.1.0.

---

## 09 November 2026 — User Guide: Owner Not Named

### What Was Done
- At the owner's request, removed their name from the user guide (repository copy and artifact). The three mentions now say "the app owner", matching the wording on the app's sign-in screen: whom to ask for an invitation, who can reach the database in the privacy section, and whom to ask about a deleted expense in Quick answers. Documents only, so the app version stays at 1.1.0.
- Also at the owner's request, removed the privacy line about the app owner being able to reach the database.
- The guide no longer suggests that deleted expenses can be recovered: the privacy section drops "kept in the database so it can be recovered", and the Quick answers entry now says a deleted expense can only be brought back with Undo, in the few seconds after deleting. The owner doesn't want recovery offered as a feature, since it would mean manual work for them.
- The "No subscription" card no longer names a competitor: "Popular budgeting apps such as YNAB charge a recurring fee" became "Many budgeting apps charge a recurring fee", at the owner's request.

---

## 09 November 2026 — User Guide: Real Screenshots

### What Was Done
- At the owner's request, replaced the user guide's drawn mockups with real screenshots of the app (repository copy, GitHub Pages and the artifact).
- To keep real spending out of the public guide, the screenshots come from a demo account in the local app only (`demo@example.com`, a reserved example address), filled with the sample data (`npm run sample`), three expenses dated today, budgets on five categories, one edited expense and one retired category. One demo expense was deleted and restored with Undo for the Undo screenshot.
- Eleven screenshots at phone size in light mode, in `guide-images/`: Log, review card, delete confirmation, Undo bar, History, History search, Summary with a burn-up chart, Summary further down (a new picture showing pace notes and the pie chart), Settings, sign-out confirmation, and Categories & budgets with the Retired row. The dev server's badge was hidden before each capture, and a capture artefact at the top of the scrolled Summary image was painted out.
- The Pages workflow now also publishes `guide-images/` and runs when it changes. Both READMEs mention the folder; `web/README.md` notes where the screenshots come from.
- Documents only, so the app version stays at 1.1.0. The owner's local account and data were not touched; the test browser was signed back in to it afterwards.

---

## 10 November 2026 — Version 1.1.1: CSV Through the iPhone Share Sheet

### What Was Done
- The owner found that in Hercules opened from the iPhone home screen, tapping **CSV** left the app stuck on a download screen; the only way back was to close and reopen the app. A full-screen home-screen app has no browser buttons, so the download's preview replaced the app's window with nothing to go back with. Earlier testing used a desktop browser, which doesn't behave this way.
- Two fixes were offered: open the download in a separate window with a Done button (simpler), or use the iPhone share sheet (more native). The owner chose the share sheet.
- When Hercules is opened from the iPhone home screen and the phone can share files, **CSV** now opens the share sheet with the month's file (Save to Files, AirDrop, Mail and so on); closing it returns to Summary. Because the share sheet must open the instant the button is tapped, the file for the month shown is fetched in advance when Summary opens and whenever the month or its expenses change; if it isn't ready yet, a message asks to try again in a moment. Safari, Android and computers keep the normal download.
- Version **1.1.1** (a fix), with a changelog entry. Updated the Specification (v0.38, Section 4.5), Architecture (v0.20, decision 35), Test Plan (v1.6, new phone test R-10) and the user guide.
- Tested locally by making the test browser report itself as the iPhone home-screen app, with a stand-in that records what would be shared: the normal download is unchanged elsewhere (no file fetched in advance); in home-screen mode this month's file is prepared on opening Summary and shared as `hercules-expenses-2026-11.csv` (CSV, 20 rows), last month's as `hercules-expenses-2026-10.csv` (106 rows); closing the sheet shows no error; tapping before the file is ready shows the "Preparing" message and shares nothing. The real share sheet can't be shown in the test browser, so the owner will confirm on their phone (test R-10). Type-check, lint and a production build passed; no data was changed.
