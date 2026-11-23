# Project Hercules — Work Log

```
Maintained by: Lionel Lam Song Poh, James Wong
Purpose: Record of work done, decisions made, challenges encountered, and assumptions held —
to serve as a lessons learned reference for current and future contributors.
Last updated: 23 November 2026
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
  *Clarified 10 November 2026: with this line removed and the Quick answers entry rewritten (below), only one mention remains: whom to ask for an invitation.*
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
- **Confirmed (10 November 2026):** after the deploy, the owner checked on their phone that **CSV** opens the share sheet in the home-screen app and no longer gets stuck.

---

## 10 November 2026 — Version 1.1.2: Fewer Background CSV Requests

### What Was Done
- The owner asked whether preparing the CSV in the background on every Summary visit had a performance or compute cost. Measured locally, each preparation was 1.8 KB (this month) to 9 KB (last month) and took 11–23 ms on the server, with no AI involved, and only in the iPhone home-screen app. The cost was negligible, but there was waste: two fetches on the first visit (the expense list loading looked like a change), a fresh fetch on every visit, and files prepared that were rarely used. Options were to leave it, keep prepared files and refresh only after changes (B), or build the file on the phone (C, rejected because the file's rules would live in two places). The owner chose B.
- The app's data cache now has a change counter that goes up with every save, edit, delete or category change made in the app. Summary keeps prepared files in memory, keyed by month and that counter (up to six), so each month is fetched once and again only after a change; a sign-out reloads the page, which clears them. A change made on another device is included once the app is reopened.
- While planning, the first idea (refresh when the month's totals change) was replaced: for last month Summary only has category totals, so a change to a merchant or remark wouldn't have been noticed.
- Version **1.1.2** (an improvement to an existing feature), with a changelog entry. Updated the Specification (v0.39, Section 4.5) and Architecture (v0.21, decision 35).
- Tested locally in simulated home-screen mode, counting file requests: first visit 1; leaving and returning twice, still 1; switching to October 2; back to November, still 2; tapping CSV shared November's file at once; after retiring a temporary category in the app, returning to Summary fetched November afresh (3); leaving and returning again, still 3. In a normal browser no file was fetched in advance. The temporary category was removed and local data confirmed identical to a snapshot. Type-check, lint and a production build passed.
- **Confirmed (10 November 2026):** after the deploy, the owner checked on their phone that the share sheet still works with 1.1.2.

---

## 10 November 2026 — Document Integrity Check After 1.1.2

### What Was Done
- At the owner's request, checked the documents against versions 1.1.1 and 1.1.2. Version histories, `CHANGELOG.md`, `web/package.json`, the Git tags (v1.0.0 to v1.1.2, local and on GitHub), both READMEs and the user guide agreed. Four problems were found and fixed:
  1. Architecture (v0.22): decision 35's original reason said a file from the server downloads reliably in the home-screen app, which 1.1.1 showed to be wrong on iPhone. That sentence is now struck through and marked as superseded.
  2. Test Plan (v1.7): new phone test R-11 checks that the file prepared for the share sheet is refreshed after a change (the 1.1.2 behaviour), so an out-of-date file would be caught.
  3. Test Plan: after-deploy check S-08 now covers the home-screen app, where **CSV** opens the share sheet.
  4. Work log: the 9 November "User Guide: Owner Not Named" entry read as if three mentions of "the app owner" remained in the guide; a note now says only the invitation mention remains.
- Documents only, so the app version stays at 1.1.2.
- **Confirmed (10 November 2026):** the owner ran the new test R-11 on their phone and it passed: after logging a test expense, the file shared from Summary included it.

---

## 12 November 2026 — Version 1.1.3: Summary Total Stays in Place

### What Was Done
- At the owner's request, Summary's total now stays at the top while scrolling. The section that already stayed in place (heading and month switcher) now also holds "Spent so far this month" (or "Spent in [month]"), the total, the **CSV** button and, for this month, the day line ("Day 12 of 30 · Thu, 12 Nov"). The thin line under it moved down accordingly.
- Before building, mockups of the real app (local demo account) were shown at phone upright and sideways, iPad upright and sideways, and desktop sizes. The owner chose to:
  - leave a phone held sideways as it was, with nothing staying in place (the existing rule for screens under 500 pixels tall);
  - keep it in place on an iPad held sideways, which is tall enough;
  - remove the "+$… vs October" comparison line everywhere, to keep the top compact.
- With the comparison gone, Summary no longer requests the totals for the month before the one shown (for example September, when viewing October), saving one request.
- On a phone held upright, the fixed section takes about 31% of the screen (253 of 812 points). Shrinking it while scrolling was mentioned as a later option, not built.
- Version **1.1.3** (a small change to an existing screen), with a changelog entry. Updated the Specification (v0.40, process flow step 8), Test Plan (v1.8: H-01 and H-02 without the comparison, new H-10, M-03 covers a phone held sideways) and the user guide (the Summary text, a caption and both Summary screenshots, retaken from the demo account).
- Tested locally at 375×812, 812×375, 768×1024, 1024×768 and 1280×800, in light and dark mode, on this month and last month: the block stays at the top when scrolled, except on a phone held sideways; the comparison line no longer appears; **CSV** still links to the month shown. Type-check, lint and a production build passed. The demo account was allowed on the local app only while the mockups and screenshots were taken, then removed; the temporary mockup page was deleted. No data was changed.
- **Confirmed (12 November 2026):** after the deploy, the owner checked on their phone that Summary's total stays in place while scrolling.

---

## 12 November 2026 — Version 1.1.4: Smaller Summary Total

### What Was Done
- At the owner's request, made Summary's total smaller to save space in the section that stays at the top. Mockups on the demo account compared today's 38px total and 24px gap above it with 34px and 32px, each with a 16px gap. Measured on a phone held upright (812 points tall), the fixed section was 254, 241 and 238 points (31%, 30% and 29% of the screen). Most of the saving came from the smaller gap. The owner chose 32px.
- The total is now 32px (the "Summary" heading is 28px), with a 16px gap above "Spent so far this month". The **CSV** button is unchanged.
- Version **1.1.4** (a small tweak), with a changelog entry. The Specification and Test Plan don't state text sizes, so they're unchanged. The user guide's two Summary screenshots were retaken from the demo account.
- Checked locally at phone size: the total shows at 32px and the fixed section is 238 points. Lint and a production build passed. The demo account was allowed on the local app only for the mockups and screenshots, then removed; the temporary mockup page was deleted. No data was changed.
- **Confirmed (12 November 2026):** after the deploy, the owner checked on their phone that the smaller total works with 1.1.4.

---

## 12 November 2026 — Version 1.1.5: One Total on Log; Guide Back to Mockups

### What Was Done
- The owner noticed that on Log, the **Today by category** heading showed a total that repeated **Spent today** under the text box. Both add up the same list (today's expenses), so they always matched. The heading's total was removed; **Spent today** stays, as it's in the section fixed at the top and always visible. Each category row keeps its count, total and bar. An unused style for the old two-part heading was removed.
- At the owner's request, the user guide no longer uses screenshots. Its eleven pictures are drawn mockups in the page itself again, so a guide change is a text edit, with no demo account, local server or screenshots needed. The mockups from before 9 November were restored and brought up to date: no total beside Today by category, Summary's total, **CSV** and day line in the fixed section with no "vs October" line, the total a little smaller in proportion, a second Summary mockup for "Further down" (pace notes and the pie chart), and the current version in Settings. The `guide-images/` folder was deleted, and the Pages workflow and both READMEs updated.
- Version **1.1.5** (a small tweak), with a changelog entry. Test Plan v1.9 (B-10 expects no total in the heading). The Specification already described Today by category as a breakdown, so it's unchanged.
- Tested locally on the demo account with two temporary `[TEST]` expenses dated today: **Spent today** showed $15.70, and **Today by category** listed Food & Dining 12.50 and Transport 3.20 with no total in the heading. The two test expenses were then deleted from the local database (none left) and the demo account removed from the local allow-list. The guide was checked in a browser: all eleven mockups draw correctly. Type-check, lint and a production build passed.
- **Commit slip:** the first 1.1.5 commit (`520945a`) held only the deleted `guide-images/` files, because `git add` was given the already-deleted folder and staged nothing else. It was pushed and tagged before this was noticed. The rest of the change followed in `f2f7ca8`, and with the owner's approval the `v1.1.5` tag was moved to `f2f7ca8`. The guide's publishing run for the incomplete commit failed, so the live guide was never broken. Lesson: stage deletions with `git rm` on their own, and check what's staged before committing.
- **Confirmed (12 November 2026):** after the deploy, the owner checked on their phone that Log shows a single total with 1.1.5.

---

## 12 November 2026 — User Guide: Version-Free Settings Mockup

### What Was Done
- A document integrity check after 1.1.5 found no problems. It noted that the guide's Settings mockup showed "Version 1.1.5", which would look out of date after the next release. At the owner's request it now shows a placeholder, "Version X.Y.Z (abc1234)" and "Last updated DD Mon YYYY, HH:MM", so it never needs updating for a release.
- Documents only, so the app version stays at 1.1.5.
- **Confirmed (12 November 2026):** the owner checked that the guide on GitHub Pages shows the placeholder.

---

## 13 November 2026 — Version 1.2.0: Default Currency

### What Was Done
- The owner found that Haiku sometimes returned USD instead of SGD, most likely for a plain "$". The prompt said "default to SGD", but nothing in the code checked it, and the review card showed the currency as plain text, so it couldn't be corrected before saving.
- After discussion and mockups (`design/currency-mockups.html`), the owner chose:
  - a **Currency** row in Settings, opening a page of 20 currencies (SGD first, then by region), saved with the account;
  - the code beside the amount on the review card as a small button opening the phone's own list (option A, over a separate row);
  - budget labels and the code shown in lists following the default.
- The language model now returns a currency only when the text names one. The server decides the rest (`web/lib/currencies.ts`): a plain `$` means the default if it's a dollar currency, otherwise USD; a plain `¥` means the default if it's JPY or CNY, otherwise JPY; anything else unnamed is the default; and USD is only accepted when the text mentions US dollars. New column `users.default_currency` (default `SGD`), new route `/api/settings`. Amounts are still never converted.
- Version **1.2.0** (a new feature), with a changelog entry. Updated the Specification (v0.41, new Section 4.6), Architecture (v0.23, decision 36; decision 19 updated), Project Charter (v0.12), Test Plan (v1.10, new Section T) and the user guide (What to type, Settings, and the review and Settings mockups).
- Tested locally:
  - The currency rules on their own: 14 of 14 cases.
  - Real parses with the default SGD: "$12" and "$18.50" gave SGD, "4.50" SGD, "450 baht" THB, "USD 120" USD, "30 pesos MXN" MXN, "¥900" JPY, "25 euros" EUR.
  - With the default MYR on the demo account: "12" gave MYR, "$5" USD, "RM8" MYR, "S$3" SGD.
  - Settings showed the Currency row and page; choosing MYR saved straight away. An invalid code was refused.
  - On the review card, changing MYR to JPY saved a JPY expense marked "edited", shown as "JPY 12.00", while an MYR expense showed "8.00". Categories & budgets read "in MYR".
  - Type-check, lint and a production build passed.
  - At the owner's request, the edit sheet too, on the demo account: a saved SGD test expense opened from Today showed "SGD ▾" with the 20 currencies. Changed to EUR and saved, it was stored as EUR, marked "edited" and shown as "EUR 15.00". The CSV row read `15.00,EUR` with Edited `Yes`. The test expense was then deleted.
- **Totals follow the default too.** After the live database change, the owner chose to switch the dollar sign on totals now rather than later. Totals and money in sentences use a shared helper (`useMoney` in `web/components/currency.tsx`): "$" when the default is a dollar currency (SGD, HKD, TWD, AUD, NZD, USD or CAD), otherwise the code. It covers Spent today, the Summary total, pace notes, the burn-up chart's labels and tooltip, the History search total, the pie chart's labels and the retire confirmation. Specification, Architecture decision 36, Test Plan (new T-12), changelog and guide updated to match.
  - Tested on the demo account with a `[TEST]` SGD expense of 20.00. With SGD as the default, the Summary total read "$2,202.73", the pace note "Budget used · $0.00 left", the pie label "Rent: $1,800.00 (82%)" and the search total "$20.00", as before. With MYR they read "MYR 2,202.73", "MYR 112.27 under pace · MYR 395.60 left, about MYR 23.27/day", "Rent: MYR 1,800.00 (82%)" and "MYR 20.00", Spent today "MYR 20.00", and the SGD expense showed as "SGD 20.00" in History. Longer pace notes wrap onto a second line on a phone. The test expense was deleted, the demo default set back to SGD and the demo account removed from the local allow-list; the test browser was signed back in to the owner's account.
- **Test slip:** the first eight test parses ran on the owner's local account, because the test browser had been signed in to it since the last session. They saved nothing and changed no settings, but added eight entries to that account's local daily parse count; exactly those eight were deleted. Testing then moved to the demo account. Lesson: check which account the test browser is signed in to before every test run.
- Clean-up: the two test expenses and the demo account's test parses were deleted, its default set back to SGD, and the demo account removed from the local allow-list. The test browser was signed back in to the owner's local account. No `[TEST]` rows remain.
- **Live database:** `db/schema.sql` adds a column, so it was added to Neon before pushing. The owner signed in to Vercel and opened the database through the project's Storage tab. Neon first asked them to verify the email on the Neon account that the Vercel integration had created. In Neon's SQL Editor (project hercules-db, branch main, database neondb), the owner ran the same `ALTER TABLE users ADD COLUMN IF NOT EXISTS default_currency ...` statement as the migration: "Statement executed successfully". A read-only check then showed both live accounts with `default_currency` SGD. No other data was touched, and no connection string was copied anywhere.

---

## 13 November 2026 — Version 1.2.1: Totals Count the Default Currency Only

### What Was Done
- Right after 1.2.0, the owner raised that the effect of changing the default currency on totals hadn't been thought through. On review:
  - switching the default relabelled the existing totals (for example "$2,202.73" became "MYR 2,202.73") without converting anything;
  - every currency was added together at face value, so "SGD 20 + USD 120" counted as 140 in totals, budgets and pace;
  - budget amounts were simply read as the new currency;
  - after a switch, an expense could show "SGD 20.00" while the total containing it said MYR.
- Four options were set out: count only the default currency (A), convert at the exchange rate when saving (B), separate a fixed home currency from the parsing default (C), or just warn before switching (D). The owner chose A with D's warning, and, after mockups (`design/currency-totals-mockups.html`), the "Not included" line in Summary's fixed section (option 1) over a separate section lower down.
- Totals, Today by category, category bars, pace notes, the burn-up chart, the pie chart and the History search total now count only expenses in the default currency. Spending in other currencies is still saved and listed, and shown under the total, largest first: "Not included: USD 120.00 · THB 450.00". This appears under Spent today on Log, under the day line in Summary's fixed section, and under a History search's result count, only when there is such spending. Last month's Summary is now grouped by currency on the server (`monthSummary` returns one row per category and currency). Today by category is hidden on days with no spending in the default currency.
- Switching the default now asks first, with a confirmation sheet ("Switch to MYR?") explaining what changes. The Currency page's note now reads "Totals and budgets count only this currency."
- Version **1.2.1** (a fix to 1.2.0), with a changelog entry. Updated the Specification (v0.42, Section 4.6), Architecture (v0.24, decision 36), Test Plan (v1.11: T-03 confirms the switch, T-12 rewritten, new T-13 and T-14) and the user guide's currency text.
- Tested locally on the demo account (confirmed as the signed-in account first), with `[TEST]` expenses of SGD 10.00 and USD 120.00 today and USD 50.00 in October:
  - **Default SGD:** Spent today $10.00 with "Not included: USD 120.00"; Today by category listed only Food & Dining. The November total was $2,192.73 (the sample data's $2,182.73 plus the SGD 10.00) with "Not included: USD 120.00", and no Travel bar. October was $1,702.30 with "Not included: USD 50.00". A History search for "[TEST]" gave 2 results, $10.00, with "Not included: USD 120.00".
  - **Switching:** tapping MYR opened "Switch to MYR?" and saved nothing. Cancel kept SGD; confirming switched to MYR.
  - **Default MYR:** every total was MYR 0.00, with "Not included: SGD 2,192.73 · USD 120.00" (November), "SGD 1,702.30 · USD 50.00" (October) and "USD 120.00 · SGD 10.00" (today). Nothing was relabelled. This test found that the Today by category heading showed with nothing under it; it is now hidden in that case.
  - **Back to SGD:** through the same sheet, every figure returned exactly ($10.00, $2,192.73, $1,702.30).
  - Type-check, lint and a production build passed.
- Clean-up: the three test expenses were deleted (no `[TEST]` rows remain), the demo default is SGD, the demo account was removed from the local allow-list, and the test browser was signed back in to the owner's local account.
- No database change is needed for 1.2.1.

---

## 13 November 2026 — Version 1.2.2: Explaining "Not Included"

### What Was Done
- At the owner's request, a small circled **?** now sits at the end of every "Not included" line (Log, Summary and History search). Tapping it opens a dark bubble just below the line, with an arrow pointing at the **?**, reading "Your default currency is SGD. Expenses in other currencies are not included." (with the person's default currency). Tapping the **?** again, or anywhere else, closes it; it doesn't close on its own. The **?** is drawn 16 pixels across but has a 28-pixel tap area, and is announced as "Why aren't these included?".
- The wording went through three rounds of mockups (`design/not-included-tooltip-mockups.html`): "Expenses in other currencies are not included.", then "Default currency selected is [default currency]. …", then the owner's final, shorter "Your default currency is [SGD]. Expenses in other currencies are not included." An earlier idea of a longer explanation was set aside.
- Version **1.2.2** (a small improvement), with a changelog entry. Updated the Specification (v0.43, Section 4.6), Test Plan (v1.12, new T-15) and the user guide's currency text.
- Tested locally on the demo account (confirmed first) with a `[TEST]` USD 120.00 expense today. On Log, the bubble opened with the SGD text, closed when the **?** was tapped again, and closed when an empty area was tapped. On Summary it opened over the categories without changing the fixed section's height (256 points before and after). In a History search it showed the same text. Type-check, lint and a production build passed. The test expense was deleted, the demo account removed from the local allow-list, and the test browser signed back in to the owner's local account.
- **Confirmed (13 November 2026):** after the deploy, the owner checked on their phone that the "?" tooltip beside "Not included" works with 1.2.2.

---

## 13 November 2026 — Document Integrity Check After 1.2.2

### What Was Done
- At the owner's request, checked the documents against versions 1.2.0 to 1.2.2. Version histories, `CHANGELOG.md`, `web/package.json` and the Git tags agreed, Specification Section 4.6 and Test Plan Section T matched the app, and Architecture decisions 19 and 36 were current. Four places still described 1.2.0's adding of every currency into the totals, and were fixed:
  1. Specification (v0.44): process step 1 (Spent today), process step 8 (Today by category), Section 4.1's pace rules and the `currency` field now say totals count only the default currency (Section 4.6), instead of "added without currency conversion".
  2. Project Charter (v0.13): the currency non-goal said amounts in different currencies "are added as they are"; it now says other currencies are shown separately, not added in.
  3. User guide: "What it doesn't do" said "Totals are in Singapore dollars"; it now says totals are in your default currency and other currencies are shown separately.
  4. Test Plan (v1.13): Section T's note listed only some of the tests that change the default; it now lists T-03, T-05, T-06, T-09, T-10 and T-13.
- Documents only, so the app version stays at 1.2.2.
- **Publishing:** the guide change was pushed before the owner asked to preview it; the preview was shown afterwards. The first Pages run for this change then failed on a temporary GitHub error ("No artifacts named github-pages were found"), so the guide wasn't updated at first, although an earlier line here wrongly recorded it as confirmed. The owner noticed; the run was re-run on 13 November 2026 and succeeded, and the live page was checked to contain the new wording.
- **Confirmed (13 November 2026):** the owner checked that the guide on GitHub Pages shows the new "What it doesn't do" wording.

---

## 14 November 2026 — Version 1.2.3: Version Line at the Bottom of Settings

### What Was Done
- At the owner's request, the version and last-updated line in Settings now sits at the bottom of the screen, just above the tab bar, instead of directly under Sign out. A one-line style change: the line takes up the remaining space above it, and keeps its 28-pixel gap from Sign out on short screens, where the page scrolls.
- Version **1.2.3** (a small tweak), with a changelog entry.
- Checked locally on a full-height window and a 375 × 600 phone-sized one. No database change is needed.
- **Confirmed (14 November 2026):** after the deploy, the owner checked on their phone that the version line sits at the bottom of Settings with 1.2.3.

---

## 14 November 2026 — CLAUDE.md: The Working Routine in the Repository

### What Was Done
- The owner started working on Hercules from a second computer and asked where Claude kept its routine (document integrity checks, testing and so on), so the same care is taken there.
- Until now, the routine lived only in Claude's memory notes on the first computer and in the working conversation; neither carries over to another machine. A few rules were already written down (Architecture decision 34 on versioning, the schema rule in `web/README.md`), but nothing told a new session to follow them.
- Added `CLAUDE.md` at the repository root, which Claude Code reads at the start of every session in this folder, on any machine. It covers:
  - the ground rules (commit and push only when asked, fetch first, stage deletions separately, no secrets, the owner does production database changes, honest reporting);
  - the order of a change (discuss, mockups, documents before code, code, version and changelog, tests, worklog, screenshot, ask to commit, tag, phone confirmation);
  - database changes, including the Neon SQL Editor route;
  - testing on the demo account only, after checking which account is signed in, with full clean-up;
  - the user guide's content rules, preview before committing, and checking the Pages run;
  - what a document integrity check covers.
- The owner reviewed the draft before it was committed. It contains no email addresses other than the placeholders `demo@example.com` and `you@gmail.com`.
- Claude's memory notes on the first computer were trimmed so they point to `CLAUDE.md` instead of repeating it, to stop the two drifting apart.
- Documents only, so the app version stays at 1.2.3.

---

## 14 November 2026 — Document Integrity Check After 1.2.3

### What Was Done
- At the owner's request, checked the documents after 1.2.3 (made from the owner's second computer) and the new `CLAUDE.md`. Version histories, `CHANGELOG.md`, `web/package.json` and the Git tags (to v1.2.3) agreed, the live guide matched the repository, and `CLAUDE.md` was tracked and free of email addresses. Four gaps were found and fixed:
  1. Specification (v0.45): Section 4.4 still placed the version line simply "below Account"; it now sits at the bottom of Settings, just above the tab bar, as built in 1.2.3. (1.2.3 had updated the code, changelog and worklog, but not the Specification or Test Plan.)
  2. Test Plan (v1.14): Q-08 and S-07 now look for the version line at the bottom of Settings, and Q-08 also checks a short window.
  3. Project Plan (v0.13): the features now include the default currency, in parsing, totals and Settings; this was found in the previous check and left open.
  4. README: the "Project documents" table now lists `CLAUDE.md`.
- Documents only, so the app version stays at 1.2.3.

---

## 14 November 2026 — Version 1.2.4: Timing Each Parse

### What Was Done
- The owner finds parsing slow. Rather than guess at a fix, each parse now measures how long its steps take: the sign-in check, the daily-limit check, loading categories, the Claude call, and the total (Architecture decision 37). The timings go in a `Server-Timing` header on the parse response, visible in a browser's developer tools, and in one `parse timing` line in the server log, with the model used and the input and output tokens. The log line never includes the expense text, the parsed details, an email address or a user ID. Nothing in the app looks different.
- Options discussed with the owner first: whether "performance" meant speed or accuracy (the owner chose speed), and measuring before changing anything. A timing table in the database was set aside, as the logs and header are enough for a short investigation and keep no new data about people.
- Version **1.2.4** (a small tweak), with a changelog entry. Updated the Architecture (v0.25, decision 37 and a follow-up in Known Gaps) and the Test Plan (v1.15, new O-05). The Specification is unchanged, as nothing visible changed.
- **Confirmed (14 November 2026):** after the deploy, the owner checked on their phone that Settings shows Version 1.2.4.

### Testing
- Locally, on the demo account (confirmed before each run), with an Anthropic key in `.env.local` so parses reached Claude Haiku. Three `[TEST]` parses, none saved:
  - `auth=8 limit=7 categories=2 model=1466 total=1483` ms (first after a restart), 1,349 tokens in, 70 out
  - `auth=6 limit=1 categories=0 model=1019 total=1026` ms, 1,344 in, 63 out
  - `auth=17 limit=9 categories=1 model=1161 total=1188` ms, 1,341 in, 60 out
- Early sign: the Claude call is about 97% of each parse, and each prompt is about 1,340 tokens for a reply of about 65. These are local timings over the owner's home connection, not the live app's, so they only point the way.
- Checked that no log line contains the expense text, an email address or a user ID. Type-check, lint (the one known warning in `web/lib/client.ts`) and a production build passed.

### Slips and Lessons
- The first version of the log line used `model=` twice, once for the step's time and once for the model's name, and the header and log worked out the total separately, 1 ms apart. Both were caught in testing and fixed before committing: the name is now `using=`, and the total is worked out once.
- An earlier, separate local test (one parse, also before this change) took 2.8 seconds, most likely including the dev server compiling the parse route for the first time.

### Clean-up
- Deleted the demo account's three parse records; no `[TEST]` expenses exist. Removed the demo account from the local allow-list and signed the test browser back in to the owner's local account.

### Next
- After the deploy, the owner parses 10–15 everyday expenses on their phone, then reads the `parse timing` lines in Vercel's logs to choose what to speed up.

---

## 14 November 2026 — Follow-up: Database SSL Mode

### What Was Done
- After 1.2.4 went live, the owner shared Vercel's logs. Alongside the first live `parse timing` line (`auth=99 limit=22 categories=3 model=1499 total=1622` ms, so the Claude call was about 92% of the parse), each server start logs a red warning from `pg-connection-string`: SSL modes `prefer`, `require` and `verify-ca` are treated as `verify-full` for now, but pg 9 will make them weaker, so `require` will no longer check the database's certificate.
- The connection is fully secure today, and `web/package.json` allows only pg 8, so nothing is urgent. Added a follow-up to the Architecture's Known Gaps (v0.26): change `sslmode=require` to `sslmode=verify-full` in the live `DATABASE_URL`, before any upgrade to pg 9. That is a change to Vercel's settings, so it is for Lionel to make.
- The logs also show `[tls-profile] applied 'commercial/2025' …` lines. That text is not in the app's code or any installed package, so they most likely come from Vercel's own system; not confirmed. No action taken.
- Documents only, so the app version is unchanged.

---

## 14 November 2026 — Version 1.3.0: Review Card in a Sheet

### What Was Done
- The owner found that the review card after Parse didn't always look like it needed an answer: it sat in the page below the text box, looking like one more section. It now opens in the same bottom sheet used to edit a saved expense, over the darkened Log screen (a centred dialog on wider screens) (Architecture decision 38).
- Options and the owner's choices (mockups in `design/review-card-mockups.html`):
  - Round 1 offered a stronger card in place (A), the same with the rest of the screen faded (B, recommended), and a bottom sheet (C). The owner chose C.
  - Round 2 followed the owner's direction: keep today's wording ("Review before saving", the typed text in quotes, "Discard"); no new heading, hint or "Not saved yet" tag; keep the "›" on each line; two full-width buttons, **Save expense** and **Discard**; tapping outside does the same as Discard; "Discard your edits?" without its explanation text, keeping its red Discard.
  - The owner asked whether the drag handle in the mockups worked. It didn't (the app's sheets can't be dragged), so it was removed rather than suggest a gesture that does nothing. No animation for now; a slide-up for sheets is a follow-up in the Architecture's Known Gaps.
  - "Save expense" and the "›" are on the review sheet only; the edit sheet keeps **Save** and is unchanged.
- Version **1.3.0** (a change people will notice), with a changelog entry. Updated the Specification (v0.46, step 5 and Section 4.2), Architecture (v0.27, decision 38 and a Known Gaps follow-up), Test Plan (v1.16: B-01, C-03, C-04 and S-03 updated; new C-07 to C-11) and the user guide (review drawing, steps and the "Changed your mind?" note).
- Code: `ReviewCard` gains an `afterParse` option for the "›" and the stacked buttons; the Log screen puts it in the existing `sheet-backdrop` and `sheet`, with Discard and tapping outside sharing one handler.
- **Confirmed (14 November 2026):** after the deploy, the owner checked on their phone that Settings shows Version 1.3.0, and that after Parse the review card opens as a sheet and tapping outside closes it.

### Testing
- Locally on the demo account (confirmed before testing), three `[TEST]` parses:
  - C-07: on a 390 × 760 window, the sheet opened over the darkened Log screen with "REVIEW BEFORE SAVING", the typed text in quotes, "›" on each line, and full-width **Save expense** and **Discard**.
  - C-09: changed the merchant, tapped outside: "Discard your edits?" appeared with no explanation and a red Discard. **Keep reviewing** returned to the sheet with the change kept.
  - B-01: **Save expense** saved it, closed the sheet and emptied the box; it appeared under Today with an **edited** tag.
  - C-11: opening it from Today showed the edit sheet unchanged (**Save**, Cancel and Delete in one row, no "›").
  - C-08: a new parse, then tapping outside closed the sheet straight away, kept the text in the box, and saved nothing.
  - C-10: on a 1,024 × 760 window the review was a centred dialog (272 pixels either side); tapping outside closed it.
- Type-check, lint (the one known warning in `web/lib/client.ts`) and a production build passed.

### Slips and Lessons
- The first type-check failed on 308 duplicate files named like `routes.d 2.ts`, all inside `web/.next` (the build cache). The Documents folder is synced to iCloud, which appears to make these "… 2" copies while a build rewrites files quickly. None were found in the code, `node_modules` or `.pglite`. The cache was deleted and rebuilt cleanly. It happened again before the final build, this time inside Next.js's own build cache (`.next/cache/turbopack`), where the copies' names broke the production build ("Failed to open database … invalid digit found in string"). Deleting `.next` again fixed it. Keeping the build cache out of iCloud would stop this for good; that is for the owner to decide.

### Clean-up
- Deleted the `[TEST]` expense and the demo account's three parse records; no `[TEST]` rows remain. Removed the demo account from the local allow-list and signed the test browser back in to the owner's local account.

---

## 14 November 2026 — Version 1.3.1: Pencil and Calendar Icons

### What Was Done
- At the owner's request, the review sheet's "›" is replaced by a pencil beside Category, Merchant and Remarks and a calendar beside Date, and the edit sheet gets the same icons, so both sheets match (Architecture decision 38, updated). The owner also reported that on iPhone the date didn't sit flush right.
- Options and the owner's choices (mockups in `design/field-icons-mockups.html`): no pencil on the amount; a pencil on Category rather than a ▾ like the currency's.
- The cause of the iPhone date: the date box was set to align right, but Safari ignores that for date boxes. A Safari-specific rule now aligns the date right. The browser's own date icon showed on computers but not in Safari on iPhone, so it is hidden and the app draws its own calendar; tapping the date or the calendar opens the date picker, and tapping a pencil puts the cursor in that field.
- Version **1.3.1** (an improvement and a fix), with a changelog entry. Updated the Specification (v0.47, step 5), Architecture (v0.28, decision 38), Test Plan (v1.17: C-07 and C-11 updated; new C-12, the date on iPhone) and the user guide (review drawing and step 3).
- **Confirmed (14 November 2026):** after the deploy, the owner checked on their phone that Settings shows Version 1.3.1; that after Parse the review sheet shows pencils beside Category, Merchant and Remarks and a calendar beside the date; that the date sits flush right and tapping it opens the date picker; and that a saved expense's edit sheet shows the same icons.

### Testing
- Locally on the demo account (confirmed before testing), on a 390 × 760 window, one `[TEST]` parse:
  - C-07: pencils on Category, Merchant and Remarks, a calendar on Date, none on the amount; all four icons 20 pixels from the sheet's right edge; the browser's own date icon gone.
  - Tapping the Merchant and Remarks pencils put the cursor in those fields. Tapping the calendar raised no errors, but whether the picker opened couldn't be seen, as screenshots don't show the browser's picker.
  - C-11: after **Save expense**, opening it from Today showed the edit sheet with the same icons, aligned the same way, and its Delete, Cancel and Save row.
  - Changing the date by typing couldn't be tested: the test tool's typing didn't change a plain, unstyled date box either, so this is a limit of the tool rather than of the change.
- **Not tested here:** C-12 (the date on iPhone), as the browser pane isn't Safari. To be checked by the owner on their phone.
- Type-check, lint (the one known warning in `web/lib/client.ts`) and a production build passed.

### Slips and Lessons
- In 1.3.0, the style rule added for the guide's review drawing ("›" with a 5-pixel margin) used the class name `chev`, which the guide's Settings drawing already used, so its two "›" marks moved 5 pixels on the published guide. Found while making this change; the rule is removed and the Settings drawing is as it was before 1.3.0. Lesson: check a new class name isn't already used in the page.
- iCloud's "… 2" copies in `web/.next` came back a third time (42 files) and broke type-checking; `.next` was deleted again.

---

## 14 November 2026 — Architecture Accuracy Review

### What Was Done
- The owner spotted that decision 38 still said the review sheet "adds a '›' to each line", which 1.3.1 replaced, and asked for the Architecture document to be reviewed for accuracy. Each claim was checked against the code, the database schema and `web/vercel.json`.
- Eight fixes, applied at the owner's request (Architecture v0.29):
  1. Decision 38: the "›" wording struck through and marked superseded by the 1.3.1 update; the edit sheet keeps **Save** and has the same icons.
  2. Decision 33: notes that Settings has a Currency row (since 1.2.0) and the version line sits at the bottom (since 1.2.3).
  3. Decision 30: the confirmation sheet is also used before switching the default currency.
  4. Decision 31: `pace.ts` is used by the screens only (it was listed as shared); `currencies.ts` and `csv.ts` added; the review card and currency picker added to the shared pieces.
  5. Decision 16: Categories now sits inside the Settings tab, rather than being its own tab.
  6. Decision 25: the reason "One tap on every main screen" struck through and marked superseded by decision 33.
  7. System overview: the database box lists every table, adding `allowed_emails` and `parse_events`.
  8. Decision 24: centred dialogs on wider screens apply to both sheets, not only editing.
- Checked and found correct: the Singapore region, the 100-parses-a-day limit, the 20 currencies and the US-dollar rule, the screen-width steps, the five-second Undo, the CSV route, what the app loads and reloads (decision 23), the model name and the parse-timing details. Not checkable from the code: the Haiku prices in decision 5, as recorded when that decision was made.
- Documents only, so the app version is unchanged.

### Slips and Lessons
- The decision 38 wording was left in place when 1.3.1 added its update note at the end, so the decision contradicted itself. Lesson: when a later update changes part of a decision, strike through the old part in the same edit, as the document's purpose asks.

---

## 14 November 2026 — Specification Accuracy Review

### What Was Done
- After the Architecture review, the owner asked for the same review of the Specification. Each claim was checked against the code and the database schema.
- Six fixes, applied at the owner's request (Specification v0.48):
  1. Section 4.2: confirmation sheets appear at the bottom of the screen; they don't slide up, as the app has no animations.
  2. Section 4.2: switching the default currency added to the table of confirmations.
  3. Step 4: when the name doesn't match, the application falls back to the category named "Other", not the `is_other` flag, matching Section 5.2 and the code.
  4. Section 6: the AI boundary lists remarks and the currency (only when the text names one) among the model's output.
  5. Step 8: the pie chart's "Everything else" slice shows a count, for example "Everything else (3)".
  6. Section 5.2: the `sort_order` column added to Category.
- Checked and found correct: the review and edit sheets (step 5), History search (4.3), Settings (4.4), the default-currency rules (4.6), the CSV file and its message (4.5), the date range, the 50-category limit with names compared regardless of capitals, the 100-parses-a-day limit, the 14 starter categories, the wording of the Delete, Retire, Discard changes and Sign out confirmations, the ±5% "On pace" band, and the User and Expense fields.
- Documents only, so the app version is unchanged.

---

## 14 November 2026 — Test Plan Accuracy Review

### What Was Done
- At the owner's request, the Test Plan was reviewed for accuracy, as the Architecture and Specification had been. Every on-screen message it quotes was checked against the code, along with its steps and figures.
- Three fixes, applied at the owner's request (Test Plan v1.18):
  1. M-04: sheets appear at the bottom of the screen (the app has no animations, so they don't slide up), and the review sheet is included.
  2. M-05: the review sheet is included among the centred dialogs on wider screens.
  3. C-12: tagged **[Phone]**, as it needs a real iPhone.
- Checked and found correct: every quoted message (sign-in, uninvited account, amount and date errors, empty month, search, budgets, category limits and names, retiring, offline, daily limit, stale screen, "Not signed in", Undo, Daily figures and the currency switch), Settings and the version line, the spending-pace worked example, the 90-day sign-in, the Retired group's Show/Hide, the note on Other, the month arrows, the CSV columns, and that `poc/TEST_PLAN.md` exists.
- Documents only, so the app version is unchanged.

---

## 14 November 2026 — Project Plan Accuracy Review

### What Was Done
- At the owner's request, the Project Plan was reviewed for accuracy, as the Architecture, Specification and Test Plan had been.
- Three fixes, applied at the owner's request (Project Plan v0.14):
  1. Phase 3 no longer says the monthly CSV download was delivered early. It is listed under Phase 4 only, matching the Architecture (v0.18 and Known Gaps) and the Project Charter (v0.10). The Phase 3 mention came in with the integrity check after 1.1.0.
  2. Phase 2's "inline confirmation card" keeps its wording, with a note that since 1.3.0 it is a sheet over the Log screen.
  3. The Settings feature lists appearance as System, Light or Dark, not just light or dark.
- The Invited Family Member persona's goal to "see at a glance how this month compares to last" was raised, as Summary doesn't compare the two months' totals (it shows each month on its own). The owner chose to leave it as it is: it describes a need, not a promise.
- Noted for the Project Charter's review: its Phase 3 line says category management was delivered early, while the Project Plan and Architecture place it under Phase 4.
- Checked and found correct: the features (sign-in and allow-list, parsing with the default currency, edits, soft delete with Undo, History search, totals in the default currency only, budgets and pace, retiring categories, the CSV, the PWA, Vercel and Neon), the cost limits, the risks, Phase 2's dates and the CLI personas.
- Documents only, so the app version is unchanged.

---

## 14 November 2026 — Project Charter Accuracy Review

### What Was Done
- At the owner's request, the Project Charter was reviewed for accuracy, the last of the project documents after the Architecture, Specification, Test Plan and Project Plan.
- Three fixes, applied at the owner's request (Project Charter v0.14):
  1. Milestones: Phase 3 had said category management was delivered early, though the Charter's own v0.6 row, the Project Plan and the Architecture place it under Phase 4. Phase 3 now lists monthly budgets, spending pace and History search as delivered early; Phase 4 lists category management (including retiring and restoring) and the monthly CSV download, matching the Charter's v0.8 and v0.10 rows.
  2. Data model: the User entry includes the default currency, delivered in 1.2.0 (the Charter's v0.12 row) but not added there.
  3. The header's Last Reviewed date updated to 14 November 2026.
- Checked and found correct: the overview and objectives, the goals and non-goals (including the currency wording and the CSV marked delivered early), the core user flow, the architecture summary, the Expense, Budget and Category entries, the success criteria, the risks, and Phases 1 and 2.
- Documents only, so the app version is unchanged.

---

## 14 November 2026 — User Guide Accuracy Review

### What Was Done
- At the owner's request, the user guide was reviewed for accuracy against the app, its text and all 11 drawings, and against its content rules.
- Four fixes, applied at the owner's request:
  1. Categories & budgets: budgets are set in the default currency (Singapore dollars unless changed), not always Singapore dollars.
  2. What to type: a plain "$" means the default only if it is a dollar currency (such as SGD or AUD), otherwise US dollars.
  3. Summary: the pie's smaller slices are grouped as "Everything else" with a count, such as "Everything else (3)", matching the app and the guide's own drawing.
  4. Your privacy: apart from keeping you signed in, the only thing saved on the device is the light or dark choice.
- The quick answer that the app is slow after a quiet spell because the database wakes up couldn't be confirmed from the code (it fits Neon's free tier pausing when idle, while parse timings so far point to the Claude call). The owner chose to keep it as it is.
- Checked and found correct: the content rules (the owner isn't named, no competitor apps, no hint of recovering deleted expenses beyond Undo, the Updated date), that the live page matched the repository before these fixes, and the text and drawings for sign-in, logging and the review sheet, the currency rules, editing and deleting, History search, Summary, spending pace, Settings, categories and privacy.
- The guide's Updated date was already 14 November 2026. Documents only, so the app version is unchanged.

---

## 15 November 2026 — Version 1.3.2: Sheets Slide Up and Down

### What Was Done
- The owner asked for the review and edit sheets to move when they appear and disappear, instead of appearing suddenly, as a cue to what needs attention, mainly on phones. This was already a follow-up in Architecture's Known Gaps.
- Proposed, and agreed after an animated mockup (`design/sheet-animation-mockups.html`, with Faster, Proposed and Slower speeds and a Reduce Motion option):
  - on phones, sheets slide up from the bottom in 0.3 seconds as the background fades in, easing to a stop, and slide back down in 0.2 seconds as it fades out, however they close;
  - on wider screens, the centred dialog fades in while growing from 97% to full size, and reverses on closing;
  - the same for every confirmation sheet ("Discard your edits?", "Delete this expense?", "Retire …?", "Sign out?", "Switch to …?"); the owner chose to include them;
  - with Reduce Motion on, sheets only fade.
- Built with CSS animations of movement and fading only. A small shared helper (`useLeave` in `web/components/confirm.tsx`) lets each sheet play its closing movement before it is removed; the review sheet, the expense and category edit sheets and the confirmation sheet use it. A confirmation now removes itself after confirming, so the currency switch no longer closes it directly.
- Version **1.3.2** (a small tweak), with a changelog entry. Updated the Specification (v0.49, step 5 and Section 4.2), Architecture (v0.30, decision 38; the Known Gaps item marked done) and Test Plan (v1.19: C-07 and M-04 updated; new C-13 to C-16).
- Tested locally on the demo account (confirmed first), at phone size unless stated:
  - **Edit sheet:** 80 ms after opening it was partway up (267 pixels below its resting place) with the background at 18%, and settled fully by 0.4 seconds. Cancel slid it down (64 pixels down after 80 ms, background fading, taps blocked), and it was removed after about 0.2 seconds.
  - **Delete:** "Delete this expense?" slid up over the edit sheet; after **Delete expense**, both started sliding down together about 30 ms later and were gone by about 0.25 seconds, then the Undo bar appeared; Undo restored the expense.
  - **Discard changes:** after changing the merchant, tapping outside slid "Discard changes?" up while the edit sheet stayed still; **Keep editing** slid only the confirmation away and kept the change; **Save** slid the edit sheet away and the change was saved.
  - **Review sheet:** after a real parse of `[TEST] lunch 5.50` it slid up; **Discard** slid it down, kept the typed text and re-enabled Parse.
  - **Wider window (1,024 pixels):** the sign-out confirmation grew in from 97% while fading in, and shrank out on **Cancel**, without signing out.
  - **Reduce Motion:** the rule is in place, but the test browser can't switch that setting on; test C-16 is for the owner's phone.
  - Type-check, lint and a production build passed.
- Clean-up: the test expense and the test parse were deleted (no `[TEST]` rows remain), the demo account was removed from the local allow-list, and the test browser was signed back in to the owner's local account.
- **Confirmed (15 November 2026):** after the deploy, the owner checked on their phone that the sheets slide up and down with 1.3.2, and that with Reduce Motion on they only fade (test C-16).

---

## 15 November 2026 — Version 1.3.3: CSV Button Outlined

### What Was Done
- The owner asked for better contrast on Summary's **CSV** button. Its label was already easy to read (about 16:1); the weak part was the button itself, whose pale grey fill stood out from the page by only 1.1:1 in light appearance and 1.19:1 in dark, against the 3:1 guideline for a control's edge.
- Options were shown in a mockup (`design/csv-contrast-mockups.html`), each in light and dark: A, the current pale fill; B, an outline with no fill (3.25:1 light, 3.67:1 dark); C, a darker fill (1.27:1 and 1.7:1, still under 3:1); D, a solid dark button like Parse and Save (17.7:1, but it competed with the total and made downloading look like the main action). The owner chose **B**.
- Slip: the first version of the mockup drew its phone frames with a script, which the preview doesn't run, so the owner saw an empty page. It was rewritten as plain HTML. Lesson: write mockups as static HTML.
- Built with a new `--edge` colour token (`#8e8e96` light, `#71717a` dark) and a 1.5-pixel inset outline on `.csv-button`; nothing else on the screen moves. The user guide's Summary drawing now shows the outlined button too (its Updated date is now 15 November 2026).
- Version **1.3.3** (a small tweak), with a changelog entry. Updated the Specification (v0.50, Section 4.5), Architecture (v0.31, decision 35 update) and Test Plan (v1.20, R-01 checks the outline in light and dark).
- Tested locally on the demo account (confirmed first): on Summary the button had no fill and its outline was `#71717a` in dark and `#8e8e96` in light, with the label in the text colour; **CSV** still returned the month's file (CSV, 18 lines); Settings showed Version 1.3.3. The guide's Summary drawing was checked in a local preview. Type-check, lint (the one known warning) and a production build passed.
- Clean-up: no test data was created (no `[TEST]` rows exist); the demo account was removed from the local allow-list, and the test browser was signed back in to the owner's local account.
- **Confirmed (15 November 2026):** after the deploy, the owner checked on their phone that the CSV button on Summary shows its outline with 1.3.3.

---

## 15 November 2026 — Document Integrity Check After 1.3.3

### What Was Done
- At the owner's request, checked the documents after 1.3.2 (sheet animation) and 1.3.3 (outlined CSV button). No problems were found:
  1. Each document's version header matches the last row of its Version History: Specification 0.50, Architecture 0.31, Test Plan 1.20, Charter 0.14, Project Plan 0.14; Last Reviewed dates are current.
  2. `web/package.json` (1.3.3), `CHANGELOG.md` and the Git tags agree; every changelog version has a tag, and the local and GitHub tags match.
  3. No wording from before the sheet animation remains (Architecture's "no animation" is struck through with its update note). The outlined CSV button is in Specification 4.5, Architecture decision 35 and Test Plan R-01. The Charter and Project Plan don't go to that level of detail, so they needed no change.
  4. The user guide follows its content rules, is dated 15 November 2026, and the live Pages copy is identical to the repository.
  5. Both READMEs are accurate, and this worklog is dated.
- Noted, not a fault: the Go-Live Checklist (last updated 2 November 2026) still has three open items for the owner: reporting anything odd, inviting family and friends, and an optional review of Architecture's decisions.
- Documents only, so the app version stays at 1.3.3.

---

## 16 November 2026 — Version 1.4.0: Experimental Features Page

### What Was Done
- The owner asked for a page in Settings listing experimental features with switches, to try features in the real app without rebuilding and redeploying each time they're turned on or off.
- Mockups (`design/experimental-features-mockups.html`): A, an "Experimental" section in Settings, or B, a row hidden until the version line is tapped five times; C, the page with one row and switch per feature (with a "New" label and **Turn all off**), and D, the page with nothing to try. The owner chose **A** and **D**, with the page shown to **everyone** signed in (owner-only was recommended) and switches remembered **on the device** (on the account was recommended).
- Built as chosen: the Experimental section between Appearance and Account, with a row reading "None right now" (or, once features are listed, "1 of 3 on" and so on), opening a page with "‹ Settings", a note that features may change or be removed and that switches apply on this device only, and either one row with a switch per feature or "Nothing to try right now". The list of features lives in `web/lib/experiments.ts` and starts empty; a feature's code checks `useExperiment("its-id")`. Switches are saved in local storage (`hercules-experiments`); every feature is off until switched on, and a saved switch for a feature no longer listed is ignored. The "New" label and **Turn all off** from mockup C weren't built, as only D was chosen for the page; they can be added later.
- Documents: Specification v0.51 (Section 4.4 and new Section 4.7), Architecture v0.32 (new decision 39; decision 33 noted), Test Plan v1.21 (Q-02 updated; new Q-09, and Q-10 for when a feature is listed), Project Plan v0.15 (Settings feature). The user guide describes the page, its Settings drawings show the new section, and its privacy line now says experimental switches are also saved on the device (Updated 16 November 2026).
- Version **1.4.0** (a new feature), with a changelog entry. No database change.
- Tested locally on the demo account (confirmed first), at phone size:
  - With a temporary `zz-test` feature added to the list (not committed): the Settings row read "0 of 1 on"; switching it on saved `{"zz-test":true}` on the device; after a reload the row read "1 of 1 on" and the switch was still on; switching it off cleared the saved value. The switch was checked in dark and light (off: light grey; on: the app's main colour).
  - With the list empty again, as shipped: the row reads "None right now", the page shows "Nothing to try right now", "‹ Settings" returns to the list, and leaving for Log and coming back to Settings shows the list. Settings showed Version 1.4.0.
  - The user guide's Settings section and drawings were checked in a local preview.
  - Type-check, lint (the one known warning) and a production build passed.
- Clean-up: no expenses or parses were created; the temporary test feature was removed (the list is empty); the demo account was removed from the local allow-list, and the test browser was signed out, as it was before the test.
- **Confirmed (16 November 2026):** after the deploy, the owner checked on their phone that Settings shows the Experimental section and the Experimental features page works with 1.4.0 ("Nothing to try right now").

---

## 16 November 2026 — Version 1.4.1: Loading Placeholders

### What Was Done
- The owner noticed that after a quiet spell the Log screen's list takes a while to appear, and asked for a loading indicator. While loading, Log showed "Nothing logged yet today." even when expenses were on their way, History showed "Loading…", and Summary showed a total of $0.00.
- Mockups (`design/log-loading-mockups.html`): A, placeholder rows with a shimmer; B, a spinner with "Loading today's expenses…"; C, a thin moving line; and an add-on note when loading is slow. The owner chose **A with the slow-start note**, and to include **History and Summary**, whose placeholders were then mocked up and approved.
- Built: shared placeholders in `web/components/loading.tsx`. Log shows three placeholder rows and a short bar for "Spent today"; History, two placeholder day headings with rows (also when moving to a month not yet loaded); Summary, a bar for the total and four placeholder category bars. Empty messages and totals appear only once the data has arrived. After 3 seconds, "Taking a little longer than usual. Hercules is starting up after a quiet spell." appears under the placeholders. The shimmer stops with Reduce Motion. Later refreshes keep showing the current data, as before.
- Documents: Specification v0.52 (process flow step 8), Architecture v0.33 (decision 23 update), Test Plan v1.22 (new M-07 and M-08). The user guide's quick answer on the app being slow after a while now mentions the placeholders and note.
- Version **1.4.1** (an improvement), with a changelog entry. No database change.
- Tested locally on the demo account (confirmed first), at phone size, with a temporary 5-second delay added to the expenses and summary routes (removed afterwards; the routes are unchanged):
  - **Log:** placeholders showed straight away, the note appeared after about 3 seconds, and when the data arrived the placeholders were replaced; "Nothing logged yet today." appeared only then (the demo account had nothing today).
  - **Summary:** a bar in place of the total and four placeholder category bars, then the real total ($2,182.73) and 7 category bars, with no placeholders left.
  - **History:** moving to October showed two placeholder day headings with four rows, and no "Loading…".
  - Checked in dark and light. Without the delay, Settings showed Version 1.4.1 and the data loaded as before.
  - Type-check, lint (the one known warning) and a production build passed.
- Clean-up: no expenses or parses were created; the temporary delay was removed; the demo account was removed from the local allow-list, and the test browser was signed out, as it was before the test.
- **Confirmed (16 November 2026):** after the deploy, the owner checked on their phone that the loading placeholders work with 1.4.1.

---

## 16 November 2026 — Document Integrity Check After 1.4.1

### What Was Done
- At the owner's request, checked the documents after 1.4.0 (experimental features page) and 1.4.1 (loading placeholders). Version histories, `CHANGELOG.md`, `web/package.json` and the Git tags (to v1.4.1) agreed; both changes were in the Specification, Architecture, Test Plan and (for 1.4.0) the Project Plan; no document still described the old loading states; the user guide followed its content rules and the live copy matched the repository. Two gaps were found and fixed:
  1. Architecture (v0.34): decision 23 said "Nothing is stored on the device", meaning expense data, though the appearance choice (decision 33) and experimental switches (decision 39) are kept there. It now says no expenses or other account data are stored on the device, and names the two exceptions.
  2. `web/README.md`: a new "Experimental features" section explains how to add a feature behind a switch and remove it later; the steps were only in a code comment.
- Documents only, so the app version stays at 1.4.1.

---

## 16 November 2026 — User Guide Edited by the Owner

### What Was Done
- The owner hand-edited the user guide and asked for their wording to be kept as written:
  - The title and heading now read "How Hercules smart expense tracker works", with a new opening paragraph describing Hercules as an expense tracker that uses a large language model to read expenses typed in everyday language.
  - "Why it exists" is now "Unique selling points", with three cards (Logging your expenses should be easy; No subscription; Budgets you can act on). The "Who it's for" line and the "You stay in control", "Private by design" and "A test of a method" cards were removed.
  - The Summary section's introduction and list were rewritten more briefly.
- Checked against the guide's content rules before committing (no names, no other apps, nothing on recovering deleted expenses). Documents only, so the app version stays at 1.4.1.
- **Further owner edits (16 November 2026):** the owner then reworded the opening paragraph, the "What it is, and why" introduction, the three cards ("No subscription" became "Negligible cost", "Budgets you can act on" became "Actionable budgets"), Getting started and the first steps of logging an expense, removed "What it doesn't do", and added a footnote that another language model can be used for parsing. A typo ("constrast") was fixed at the owner's request. Noted to the owner, and left as written: the Negligible cost card and the footnote speak to someone running their own copy of Hercules, and the tip for "This account hasn't been invited" was removed.
- **More owner edits (16 November 2026):** the owner shortened Getting started (no "link you were sent"; the paragraph on staying signed in, the four tabs and wider screens removed), renamed "Logging an expense" to "How to record an expense", rewrote the Log and review captions (the review caption is now "Human in the loop"), and removed the six tips after the logging steps (saving, Discard, clearing the box, Spent today, offline, the 100-a-day limit). Kept as written; "Human in the loop" was noted to the owner as a possibly technical term for a general reader.
- **Owner edits and drawing heights (16 November 2026):** the owner renamed "What it is, and why" to "What Hercules is, and what makes it different" and reworded the first logging step, the "What to type" introduction and the Categories and Remarks notes. At the owner's request, each pair of phone drawings was made the same height (Delete and Undo, History and Searching, the two Summary drawings, Settings and Signing out, matching the taller of each), and the Contents list was updated to match the renamed headings. Noted to the owner and left as written: the first logging step refers to a "Log your expense" text box, while the screen's heading is "Log an expense".
- **Privacy section removed (17 November 2026):** at the owner's request, the user guide's "Your privacy" section and its Contents line were removed. It had covered who can see expenses, that typed text goes to Claude (Anthropic) and isn't used for training, what Google shares at sign-in, and what's kept on the device. The owner was told this was the only place in the guide covering these points, and chose to remove it as it was; no other document or link depended on it.

---

## 20 November 2026 — Version 1.5.0: Intelligent Merchant Selection (Experimental)

### What Was Done
- The owner asked for parsing to "learn" the merchant names used in the current month, so variants such as "ntuc", "NTUC" or "fairprice" come back as "NTUC FairPrice". Added as the first experimental feature, **Intelligent Merchant Selection** ("Infer merchant names from current month's expenses."), off until switched on, on each device.
- How it works (Architecture decision 40): with the switch on, the Log screen's parse request carries `knownMerchants: true`; the server reads the distinct merchants on the person's expenses dated in the current month and adds them to the prompt, with the rule to return a listed name exactly when the text clearly refers to it, and otherwise the merchant as written. Parse timing adds a `merchants` step and logs `merchants_sent` (a count, never the names).
- Documents: Specification v0.53 (step 3, Sections 4.7, 5.1, 5.3 and 6), Architecture v0.35 (new decision 40; decision 39 updated), Test Plan v1.23 (new B-15 to B-17; Q-09 applies only when no feature is listed). The Charter and Project Plan are unchanged, as the feature is experimental. Mockups: `design/known-merchants-mockups.html`.

### Options and the Owner's Choices
- Names differing only in capitals or spaces count as one, keeping the spelling used most (chosen over a plain "select distinct", which would offer a badly typed name back as valid).
- At most the 50 most-used merchants.
- No visible change on the review sheet (chosen over a note saying a name was matched).
- The owner renamed the switch from the proposed "Remember this month's merchants" to "Intelligent Merchant Selection", with their own description.
- Only the current month is used, as the owner specified; early in a month there may be nothing to match.

### Tests (local, demo account)
- Added four `[TEST]` Groceries expenses dated 20 November: "NTUC FairPrice" twice, "ntuc  fairprice" and "Cold Storage". The merchant query returned 12 names for the month (including the sample data's), with "NTUC FairPrice" as one name with 3 uses: the grouping worked.
- With the switch on: "[TEST] ntuc 45.20" and "[TEST] fairprice 12" both came back as "NTUC FairPrice"; "[TEST] don don donki 18.90" came back as "Don Don Donki". With it off: "[TEST] ntuc 45.20" came back as "NTUC" (B-15 to B-17).
- "[TEST] sheng siong 18.90" came back as "Sheng Siong", but that name is already in the demo's sample data, so it wasn't a test of a new merchant; "Don Don Donki" was used instead.
- The server log showed `merchants=17ms … merchants_sent=12` with the switch on and no merchants step with it off; no names were logged. About 210 more input tokens per parse with 12 names (1,540 against 1,327).
- In the app on a phone-sized screen: the Experimental features page lists the switch; switched on, Parse of "[TEST] ntuc 45.20" showed Merchant "NTUC FairPrice" on an otherwise unchanged review sheet (discarded, not saved).
- Type-check and lint (the one known warning) passed. The production build passed, after a first run stopped on Next.js's security-advisory reminder (the same command passed on the next run, and the build before the change passed too).

### Slips and Lessons
- The mockup showed a "New" tag and a "Turn all off" button on the Experimental features page, copied from an earlier mockup option that wasn't chosen for 1.4.0. The real page has neither. The mockup now matches the app, with a note saying so. Lesson: mock up from the app as built, not from earlier mockups.

### Clean-up
- Deleted the 4 `[TEST]` expenses and the 6 parse entries the tests created; no `[TEST]` rows remain in any account. Reset the experimental switch in the test browser, removed the demo account from the local allow-list, and signed the test browser back in to the owner's account, as it was before.
- **Confirmed (20 November 2026):** after the deploy, the owner checked on their phone that Intelligent Merchant Selection works with 1.5.0.

---

## 20 November 2026 — Document Integrity Check After 1.5.0

### What Was Done
- At the owner's request, checked the documents after 1.5.0 (Intelligent Merchant Selection) and the user guide edits since 16 November. Version headers matched their last Version History rows; `web/package.json`, `CHANGELOG.md` and the Git tags (to v1.5.0, local and on GitHub) agreed; the worklog was dated. The user guide was unchanged since the privacy section's removal, its last Pages run succeeded and the live copy matched the repository. The owner decided the guide doesn't need to mention the experimental feature. The Charter and Project Plan were still accurate.
- Four fixes, applied at the owner's request:
  1. Architecture (v0.36), decision 37: notes the `merchants` timing step and the `merchants_sent` count added in 1.5.0, and that names are never logged.
  2. Architecture, decision 4: notes that with Intelligent Merchant Selection on, this month's merchant names are sent to the model with each entry too (decision 40).
  3. Test Plan (v1.24), Q-10: no longer marked "[when a feature is listed]", now that one always is; it uses Intelligent Merchant Selection, with "1 of 1 on" and "0 of 1 on", and checks merchants come back as typed when it's off.
  4. `web/README.md`: the experimental features steps now say how to tell the server a switch is on (a flag in the request only when it's on, as with `knownMerchants`).
- Documents only, so the app version stays at 1.5.0.

---

## 20 November 2026 — Experimental Features Code: Revisit Later

### What Was Done
- The owner asked whether the experimental features code needs refactoring to stay easy to find and maintain. With one feature touching about six places, it doesn't yet. Two small improvements were proposed: type-checked feature ids (so a mistyped id, or a check left behind after a feature is removed, fails the type check) and one searchable comment at every place a feature touches. The owner chose to revisit this later, so it's recorded in the Architecture's Known Gaps and Follow-ups (v0.37), with when to revisit it: several experiments at once, or one needing its own screens or several server routes.
- Documents only, so the app version stays at 1.5.0.

---

## 20 November 2026 — Security Review, and Version 1.5.1: Security Headers and Next.js 16.4.6

### What Was Done
- At the owner's request, reviewed the whole app for security problems. Sound: every API route checks the signed-in person and re-checks the allow-list on each request; every query is limited to that person's rows, with values passed as parameters; request bodies are validated; no unsafe HTML (the one inline script is the fixed theme snippet); CSV cells that could run as formulas are neutralised; the dev sign-in is off in production builds; no secrets in the repository or its history; the parse log holds timings and counts only. On the live app, signed-out requests to list expenses, download a CSV, delete an expense and parse were all refused (401).
- Four findings were reported. The owner chose to fix the first two:
  1. Next.js 16.4.3 had a moderate advisory (seven issues; most in features Hercules doesn't use). Updated `next` and `eslint-config-next` to 16.4.6, pinned exactly. `npm audit` for the app's runtime packages now reports none.
  2. Apart from HSTS (added by Vercel), no security headers were sent. Added `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin` to every response, in `web/next.config.ts`.
  - Set aside by the owner: the daily parse limit's count and record are two steps, so simultaneous requests could slightly exceed it; Google sign-in doesn't check `email_verified`. Both are recorded in Architecture decision 41.
- Documents: Architecture v0.38 (new decision 41), Test Plan v1.25 (new A-11 and S-09). Version 1.5.1 (a patch).

### Tests (local)
- The sign-in page and a signed-out API route (`/api/settings`, 401) both carried the four headers.
- A page on another local address that tried to show Hercules in a frame got an empty frame.
- On the demo account: Log, History, Summary and Settings all loaded, Settings showed "Version 1.5.1", and there were no console errors. The sign-in page's theme script still ran.
- Type-check and lint (the one known warning) passed. The production build passed first time, without the Next.js security reminder that 1.5.0's build showed.
- Noted, not changed: `npm audit` still reports moderate advisories in the lint tools' `@typescript-eslint` packages. They are development tools only and aren't part of the deployed app.

### Clean-up
- No expenses or parses were created. Removed the demo account from the local allow-list and signed the test browser back in to the owner's account, as it was before.
- **After the deploy (20 November 2026):** the live sign-in page sent all four new headers, as well as HSTS, about 50 seconds after the push (S-09).
- **Confirmed (20 November 2026):** after the deploy, the owner checked on their phone that the app works as before with 1.5.1.

---

## 20 November 2026 — Document Integrity Check After 1.5.1

### What Was Done
- At the owner's request, checked the documents after the Known Gaps follow-up and 1.5.1. Version headers matched their last Version History rows; `web/package.json`, `CHANGELOG.md` and the Git tags (to v1.5.1, local and on GitHub) agreed; the worklog was dated. No document mentioned the old Next.js version or the missing headers. The user guide was unchanged and the live copy matched the repository; 1.5.1 changes nothing a reader sees, so the guide needs no update.
- One fix, applied at the owner's request: Project Charter (v0.15), section 8, marks "Security risks — how do we protect user data and API keys adequately?" as addressed by the security review and 1.5.1 (Architecture decision 41), and the line on sending expense text to Anthropic now also mentions the merchant names sent while Intelligent Merchant Selection is on.
- Documents only, so the app version stays at 1.5.1.

---

## 21 November 2026 — Version 1.5.2: Code Tidy-up

### What Was Done
- The owner asked whether the code needs refactoring to stay readable and maintainable. It doesn't broadly (about 3,200 lines, consistently laid out). Four small tidy-ups were proposed; the owner chose these three, with no change in behaviour:
  1. One shared id check, `routeId` in `web/lib/route-id.ts`, used by the four routes with an id in the address (an expense or a category, and their restore routes), replacing two helpers and two inline copies.
  2. The parse timing helper moved from the parse route to `web/lib/timing.ts`, so the route reads as its steps (90 lines down to 53).
  3. The screens' `api()` helper kept only its own `Content-Type` header and dropped any headers a caller passed; it now keeps them (nothing passed headers, so nothing changed for users).
  - Not chosen: splitting `web/lib/expenses.ts` (still easy to find things in at about 220 lines). The experimental features tidy-up stays in Known Gaps.
- Documents: Architecture v0.39 (decision 37 notes the timing helper's new file). No Specification or Test Plan change, as nothing behaves differently. Version 1.5.2 (a patch).

### Tests (local, demo account)
- Expense routes: edit, delete, restore and delete again all succeeded. Bad ids (`abc`, `0`, `-1`, `1.5`, and one that doesn't exist) gave the same answers as before: 400 for an edit with an invalid id, otherwise 404.
- Category routes: a `zz-test-` category was added, renamed with a budget, retired, restored and retired again. Bad ids (`abc`, `0`, `1.5`) gave 400, as before.
- Parsed and saved "[TEST] kopi at Ya Kun 2.40" through the app: saved as Ya Kun, SGD 2.40, Food & Dining. The server's parse timing line had the same format as before.
- Type-check and lint (the one known warning) passed; the production build passed.

### Clean-up
- Deleted the 2 `[TEST]` expenses, the `zz-test-` category and the 1 parse entry the tests created; none remain in any account. Removed the demo account from the local allow-list and signed the test browser back in to the owner's account, as it was before.
- **Confirmed (21 November 2026):** after the deploy, the owner checked on their phone that the app works as before with 1.5.2.

---

## 21 November 2026 — Screens at a Glance

### What Was Done
- The owner asked for a page of drawn mockups (not screenshots), like the user guide's, showing every screen in Hercules with a short caption on what's happening. It's for giving people a feel for the app, taking screenshots to share, and as material for promotion or other documents. It doesn't replace the user guide.
- Added `Project Hercules - Screens at a Glance.html`: 32 screens in nine sections (signing in, logging an expense, fixing and deleting, History, Summary, Settings, Categories & budgets, Currency, Experimental features). Each screen is numbered (for example 2.4) so it can be referred to. Two switches at the top redraw every screen in light or dark and hide the captions for clean screenshots. It uses the guide's styles, and its wording was checked against the app's code (for example the confirmation sheets, the currency list order and the empty states).
- Published beside the guide at `screens.html` (the owner's choice, over a private claude.ai link or keeping it local): `.github/workflows/guide-pages.yml` now copies it into the site and runs when it changes. README and CLAUDE.md mention it; the document integrity check now covers it.
- Follows the guide's content rules: the owner isn't named, no competitor apps, nothing on recovering deleted expenses beyond Undo, and only the placeholder `you@gmail.com`.
- Documents only, so the app version stays at 1.5.2.

### Checks
- Previewed in the browser pane at desktop width (three screens to a row), in dark and at phone width (one to a row, no sideways scrolling). No errors from the page itself.

### Slips
- The first draft had three details the app doesn't show, caught while previewing and fixed before showing the owner: a highlight on a newly saved row, the currency list in the wrong order, and text left in the Log box after saving a foreign-currency expense. Lesson: check each drawing against the code, not memory.

---

## 21 November 2026 — GitHub Pages Home Page

### What Was Done
- The owner asked for the user guide to have its own page, `userguide.html`, at the same level as `screens.html`. Options set out: a small home page at `/hercules/` linking to both (recommended), a redirect from `/hercules/` to the guide, or nothing there (old links would break). The owner chose the home page, mockup first.
- Mockup `design/pages-home-mockups.html`: the name Hercules, one line on what it does, and two cards with small drawings of the app, "User guide" and "Screens at a glance". The owner's changes: no link to the app itself (it's invite-only), and no footer line, as it added nothing for the reader.
- Added `Project Hercules - Home Page.html` (the approved mockup without its light/dark preview switch). It follows the device's light or dark setting.
- `.github/workflows/guide-pages.yml` now publishes the home page as `index.html`, the guide as `userguide.html` and the screens as `screens.html`. Links updated in both READMEs and in the Screens page's footer; CLAUDE.md describes the three pages. Old links to `/hercules/` now reach the home page, one tap from the guide.
- Documents: Test Plan v1.26 (S-06 now checks the home page and its two cards). Documents only, so the app version stays at 1.5.2.
- **Follow-up (21 November 2026):** at the owner's request, the home page's opening line was replaced with the user guide's opening paragraph ("Hercules is an intelligent expense tracker…"), as more appealing to new readers.

### Checks
- The mockup was previewed in the browser pane on a wide screen, in dark and at phone width, with no sideways scrolling. Two fixes after the first look: the guide card's drawing moved up so the review card shows, and the Screens card's drawings were moved in on phones so neither is cut off.

---

## 21 November 2026 — Version 1.5.3: Log Text Kept Across Tabs

### What Was Done
- The owner noticed that text typed on the Log screen was lost on switching to another tab and back, and that the offline message ("Your text is kept — parse it when you're back online.") promised more than the app did.
- Options set out: hold the text in the app's memory (A), in session storage (B, unreliable in the iPhone home-screen app once closed), in local storage (C, also survives reopening the app), or in a cookie (not recommended: sent to the server with every request). Local storage was recommended as the fullest fix. The owner chose A, to keep what is retained to a minimum; surviving a closed app isn't needed for a small quality-of-life change.
- The typed text is now held by the app rather than the Log screen (`web/components/hercules-app.tsx`, passed to `web/components/screens/log.tsx`), so it's still there after switching tabs, online or offline. It clears with the ×, after saving, on closing or reloading the app, and on signing out (which reloads the page). Nothing is written to the device.
- The offline message is now the owner's wording: "You're offline. Parsing of expenses is not available. Please try again later." It explains that Parse needs the internet, as it sends the text to the cloud model.
- The owner agreed to skip the mockup, as the only visible change was wording they gave exactly.
- Documents: Specification v0.54 (step 1 and Section 8), Architecture v0.40 (decision 23 update), Test Plan v1.27 (new B-18; O-01 updated). Screens at a Glance screen 2.8 redrawn with the new message and caption. The user guide doesn't mention the offline message, so it's unchanged. Version 1.5.3 (patch) with a CHANGELOG entry.

### Checks
- Tested locally on the demo account (confirmed first). B-18: `[TEST] kopi 1.80` typed without parsing was still in the box after History → Log; after ×, the box stayed empty after switching tabs; after a reload, the box was empty. O-01 (offline simulated in the browser): the new message showed, the text was still there after History → Log, and Parse was dimmed; back online, the message went and Parse worked again. The browser's local storage held only the theme choice, and session storage was empty.
- Type-check, lint (the one known warning) and a production build passed.
- Not tested: an actual airplane-mode check on a phone.

### Slips
- While updating the Test Plan, the new Version History row was first placed after test S-06 (its wording matched the anchor used), and was moved into the Version History table before testing. Lesson: anchor on a line that appears only once.

### Clean-up
- No expenses were saved and nothing was parsed, so there were no `[TEST]` rows or parse entries to delete. The demo account was removed from the local allow-list, and the test browser was signed back in to the owner's local account.
- **Confirmed (21 November 2026):** after the deploy, the owner checked on their phone that typed text on the Log screen stays when switching tabs and back with 1.5.3, and that the new offline message shows.

---

## 21 November 2026 — Document Integrity Check After 1.5.3

### What Was Done
- At the owner's request, checked the documents after 1.5.2, Screens at a Glance, the GitHub Pages home page, 1.5.3 and the owner's wording in Architecture decision 23. No fixes were needed.
- Version headers matched their last Version History rows (Specification 0.54, Architecture 0.40, Test Plan 1.27, Charter 0.15, Project Plan 0.15; the Go-Live Checklist has only a "Last updated" date and is unchanged). `web/package.json`, `CHANGELOG.md` and the Git tags (to v1.5.3, local and on GitHub) agreed.
- No wording was left from before 1.5.3: the old offline message appears only in the worklog and mockups, and decision 15 and the Specification's out-of-scope list match the app. No document links to the guide's old address.
- The home page, user guide and Screens at a Glance follow the content rules (the owner's GitHub username appears only in the guide's web address), and the live copies of all three matched the repository. The guide doesn't mention the offline message or switching tabs, so 1.5.3 needs no guide update.
- Both READMEs link to `userguide.html` and `screens.html`; the worklog is dated.
- Documents only, so the app version stays at 1.5.3.

---

## 21 November 2026 — Screens at a Glance: Background Switch

### What Was Done
- At the owner's request, Screens at a Glance has a third switch, **Background** (Light or Dark), beside **Screens** and **Captions**, so screenshots can show a light or dark phone on either a light or dark page. It starts as the device's own light or dark setting. Documents only, so the app version stays at 1.5.3.

### Checks
- Previewed in the browser pane: a dark page with light screens and a light page with dark screens both drew correctly, the switch showed which option was on, and the page didn't scroll sideways at a narrow width.

---

## 21 November 2026 — Screens at a Glance: Owner's Captions

### What Was Done
- The owner rewrote all 32 captions in a Word document (column "Proposed Rewrite"), and asked for them to replace the page's captions. The bold follows the document: each caption's first sentence, and the names of sections and controls shown in the drawing (for example **Parse**, **Review before saving** and **CSV**), which the owner bolded to point readers to them in the picture. CLAUDE.md now records this, so later captions follow it; 2.7's note on currency conversion is on its own line. The owner's wording is kept; only curly apostrophes were made straight to match the rest of the page, and one double space removed. Documents only, so the app version stays at 1.5.3.

### Checks
- All 32 captions were replaced, one each. Previewed in the browser pane at desktop width: the longer captions fit under their phones, and the page doesn't scroll sideways.

### Slips
- The first pass bolded only each caption's first sentence and missed the other bold words in the document (2.1, 2.2, 2.4, 2.5, 2.6, 5.1 and 5.4). The owner spotted it; the captions were reapplied using the document's own bold. Lesson: carry over a document's formatting as well as its words.

---

## 21 November 2026 — Home Page: Source Code Card

### What Was Done
- The owner asked for the GitHub Pages home page to link to the GitHub repository as well. Mockup `design/pages-home-github-mockups.html` showed two layouts: a third card the same size as the other two, with a drawing of the repository's files (A), or a slimmer card across the width under the two (B, recommended to keep the guide and screens in front). The owner chose A.
- `Project Hercules - Home Page.html` now has three cards in a row on wide screens: User guide, Screens at a glance, and **Source code** ("How Hercules is built: the app's code, with its specification, design decisions and test plan." → View on GitHub). The cards are a little shorter, and the Screens card's drawings moved in to fit. On tablets the first two sit side by side with the third across the width beneath; on phones they stack.
- Documents: Test Plan v1.28 (S-06 checks the third card). README and CLAUDE.md describe the third card. Documents only, so the app version stays at 1.5.3.

### Checks
- Previewed in the browser pane at desktop width (three in a row), tablet width (768 pixels) and phone width (375 pixels), in dark, with no sideways scrolling. At tablet width the third card first sat alone beside an empty space; it now spans the row.

---

## 21 November 2026 — GitHub Pages: Owner's Wording, and "App Screens"

### What Was Done
- The owner shortened the wording on two GitHub Pages files: the home page's three card descriptions ("How to use Hercules.", "Every screen in Hercules.", "Application source code and documentation.") and Screens at a Glance's title, heading, intro and the Settings, Currency and Experimental features section intros. The page is now titled "Hercules Smart Expense Tracker — App Screens".
- Reviewed with the owner before committing; their choices:
  1. The small label above the screens page heading reads "HERCULES · APP SCREENS", to match the new heading (it still said "SCREENS AT A GLANCE").
  2. The home page card is titled "App screens", so the card and the page it opens share a name.
  3. An em dash in the new title and heading ("Tracker — App Screens"), the style used elsewhere, instead of a hyphen.
  4. The user guide's tab title and heading are fully capitalised, "How Hercules Smart Expense Tracker Works", to match the screens page. This reverses the 16 November change to a lowercase "works", at the owner's request. The guide's Updated date is now 21 November 2026.
  5. The README names the page "App screens" / "App Screens" in its three mentions.
- Left as they are: the file name `Project Hercules - Screens at a Glance.html` and its published address `screens.html` (renaming would break links and the Pages workflow), and internal records (CLAUDE.md, the worklog, design mockups).
- Pages and documents only, so the app version stays at 1.5.3.

### Checks
- Previewed the home page, App Screens and the user guide locally: the card titles and descriptions, the screens page's tab title, label, heading and intro, and the guide's tab title, heading and Updated date all read as intended.

### Follow-up
- The Test Plan's S-06 still says the second card opens "Screens at a Glance"; update it to "App Screens" at the next document integrity check.

---

## 21 November 2026 — GitHub Pages Home Page: Links Line Up at the Bottom of Each Card

### What Was Done
- At the owner's request, the green link in each of the home page's three cards ("Read the guide", "See the screens", "View on GitHub") now sits at the bottom of its card. Before, each link followed its description, so the Source code card's two-line description put its link lower than the others. The text area now fills the card and the link is pushed to its bottom, with the same 12-pixel minimum gap above it as before.
- A small visible change: the local preview was reviewed with the owner in place of a separate mockup page.
- Pages only, so the app version stays at 1.5.3.

### Checks
- Locally, each link ends 23 pixels from the bottom of its card at 1,280 pixels wide (all three level), 800 pixels (two cards in a row, then the third across the row) and 390 pixels (one per row), with no sideways scrolling and no errors.

---

## 21 November 2026 — Version 1.5.4: Intelligent Merchant Selection Keeps New Merchants

### What Was Done
- The owner found that, with the experimental **Intelligent Merchant Selection** switched on, "Groceries from Sheng Siong at $7" came back with no merchant. Sheng Siong was a new merchant, not on the month's list.
- Reproduced by calling the app's parser and the language model directly from a script in Claude's scratch folder (nothing saved, no account used), with made-up lists of known merchants. With 4 to 15 known merchants, Sheng Siong was always kept; with 20 it was dropped in 4 of 6 runs; with 30 or 50, in every run. "Lunch at Fish Soup Stall $6" was mostly kept, so the wording of the text matters as well as the list's length. B-16 didn't catch it because only one merchant was saved when it was run.
- Cause: the rule told the model to use a listed name when the text matches, "otherwise follow the merchant instruction below as usual". With a long list, the model treated the list as the only merchants allowed and returned none.
- The fix, in `merchantRule` in `web/lib/parser.ts` only: the list is introduced as not complete and for matching spellings only; a merchant not on the list is named as it would be without the list; and the model must never return no merchant just because it isn't listed.
- Documents: Architecture 0.41 (decision 40 updated; a Known Gaps follow-up for shared words) and Test Plan 1.29 (new B-19). The Specification already describes this behaviour ("returns the merchant as written, or none, as when the switch is off"), so it is unchanged.
- CLAUDE.md has a new **Experimental features** section, at the owner's request: changes to an experimental feature stay inside that feature's own code, the switch-off path is proved unchanged before committing, and tests use realistic sizes.
- Version 1.5.4 (a fix), with a CHANGELOG entry.

### Options Considered
1. **Return a new merchant exactly as typed.** Fixed the bug, but lost the tidying the model does with the switch off ("dintaifung" stayed "dintaifung"). The owner set it aside.
2. **Hybrid (chosen by the owner):** keep "not a complete list" and "never no merchant", and name a new merchant as without the list, so it is tidied ("Din Tai Fung").
3. A version that first found the merchant as typed and then checked the list was tried and dropped: it made matching worse ("yakun" stayed "yakun" in up to all 20 runs).
4. Widening the list to last month's merchants was discussed and set aside by the owner before the bug was found.

### Tests
- Hybrid against the earlier rule, 10 runs per case with 20 and 50 known merchants: new merchants (Sheng Siong in two wordings, Prime Supermarket, Fish Soup Stall) were kept in every run, against as few as 0 of 10 before; untidy new merchants were tidied ("dintaifung" → "Din Tai Fung", "sheng siong" → "Sheng Siong") in every run; known names (ntuc, fairprice, yakun, toastbox, oldchangkee) matched in every run, as before; "Bus fare $2" had no merchant in every run.
- B-19 on the final code, 10 runs each: with 50 known merchants, Sheng Siong, Prime Supermarket and Din Tai Fung kept every time, "ntuc" → "NTUC FairPrice", "Bus fare" no merchant. With the switch off, the same as before ("ntuc" → "NTUC").
- **Switch-off path unchanged:** the full prompt with the switch off, built from the code before and after the change, is identical character for character (5 inputs). The only lines changed are the two inside `merchantRule`, which is added only when the switch is on and there are merchants this month. The parse route is the only caller of the parser.
- `npx tsc --noEmit` passed, `npx eslint .` passed with the one known warning, and `npm run build` passed.
- Not run: an end-to-end parse in the app on the demo account. The parse route and Log screen are unchanged; only the prompt text changed, and that was tested directly against the model.

### Known Gap
- A different business that shares a word with a listed merchant can still be given the listed name: "ntuc health dental 80" came back as "NTUC FairPrice" in every run with both the earlier and the new rule, and "cold stone ice cream" as "Cold Storage" in 1 of 10 runs with the new rule. Left as a separate follow-up at the owner's request (Architecture Known Gaps).

### Slips
- In one round, "dintaifung" was counted as a failure for the new rule with 20 known merchants, but Din Tai Fung wasn't on that list, so returning it as typed was what that rule asked for. Spotted before reporting; later rounds left Din Tai Fung off the list on purpose. Lesson: check each expected answer against the list actually used.

### Clean-up
- The test scripts and trial copies of the parser are in Claude's scratch folder only; nothing was added to the repository and no data was saved.
- **Confirmed (21 November 2026):** after the deploy, the owner checked on their phone that, with Intelligent Merchant Selection switched on, a new merchant such as "Groceries from Sheng Siong at $7" now comes back in the review sheet with 1.5.4.

---

## 22 November 2026 — Expense Flow Diagram, Published, and a Way Home From Every Page

### What Was Done
- **A swimlane diagram of logging an expense**, made with the owner over several rounds, now published to GitHub Pages as `flow.html` from `Project Hercules - Expense Flow.html`. Five lanes: Person, the app's client side (in the phone's browser) and server side (on Vercel), grouped as "Hercules app", and the database and Claude, grouped as "Services Hercules uses". Fourteen steps in two bands, Parse and Save; every request from the server side to the database or Claude is drawn with its reply and the number of queries; amber notes show where the flow can stop and purple dashed notes show what Intelligent Merchant Selection adds; a "What can go wrong" table under the diagram gives each stopping point and its exact message.
- **The home page has a fourth card, Expense flow** ("Follow one expense through Hercules, step by step."), with a small drawn swimlane. The four cards are two by two on computers and tablets and one column on phones.
- **Every published page now starts with "← Hercules home"**, linking back to the home page: the user guide (its Updated date is now 22 November 2026), App Screens and Expense flow.
- The Pages workflow publishes the fourth page. Architecture 0.42 links the diagram from Section 2; Test Plan 1.30 updates S-06 (four cards, the home links, and the "App Screens" name noted as a follow-up on 21 November); README and CLAUDE.md list the page, and the document integrity check now covers it.
- CLAUDE.md records that this page is deliberately technical, so the general-reader rule doesn't apply to it while the other content rules do, and that it must be updated when the logging flow changes.
- Pages and documents only, so the app version stays at 1.5.4.

### The Owner's Choices
- **Wording:** the owner preferred the original, technical version to a plainer "Version B" (deleted), with ambiguous lines rewritten: the daily-limit step, the categories step, and the introduction, which now describes the diagram itself.
- **Client and server sides:** the owner pointed out that "Hercules app" and "Hercules server" were both the app; the lanes became Client side and Server side under one "Hercules app" heading (option A of three).
- **Requests and replies:** the owner pointed out that the database doesn't start anything; the server-side steps now show each request and its reply.
- **Clutter:** after an integrity review found 4 inaccuracies and 5 missing cases, the owner chose to keep the main notes on the cards and add the detail as a table; they undid a change that shortened the notes to one line, to keep them readable with their context.
- **Experimental feature:** steps 6 and 7 separate what happens with Intelligent Merchant Selection on from the normal flow.
- **Where to file it:** published, linked from a new home page card, rather than kept in the repository only. Two by two (option A) chosen over four across; mockup in `design/pages-home-flow-mockups.html`.

### Checks
- Every step, query count and message in the diagram was checked against the code (the parse and expense routes, `currentUser`, `claimParse`, `getCategories`, `monthMerchants`, `createExpense`, the Log screen and review sheet).
- Previewed locally: the home page at 1,280 pixels (two by two, each card's link 23 pixels from its bottom edge) and 390 pixels (one column, no sideways scrolling); the "← Hercules home" link at the top of the guide, App Screens and Expense flow, in the accent colour, pointing to the site's home (`./`).
- Not yet checked: the live pages, which follow the push.

---

## 22 November 2026 — User Guide on Narrow Screens: Contents Below the Heading

### What Was Done
- At the owner's request, on narrow screens (960 pixels wide or less) the user guide's Contents box now comes after the heading area, below the "Works on / Updated" line, instead of above everything. The horizontal rule that separated the heading from the guide now sits below Contents, so it separates Contents from the guide.
- How: the heading area (home link, label, title, introduction, "Works on / Updated") moved from inside `<main>` to just before the Contents `<nav>`, and grid placement puts Contents in the left column beside the heading and guide on wide screens, and stacks heading, Contents, guide on narrow ones. On narrow screens the heading's bottom border is removed and the guide gets a top border instead. Screen readers now meet the title before the contents. No text changed.
- A small visible change: reviewed with the owner in the local preview in place of a separate mockup page. Pages only, so the app version stays at 1.5.4.

### Checks
- Wide (1,280 pixels): every measured position matches the page before the change (heading and Contents at y=40, first section at y=482, page height 10,952 pixels), and Contents still stays in view while scrolling. Removing the heading's bottom margin on wide screens was needed for this: as a separate grid item its 8-pixel margin no longer merged with the first section heading's.
- Narrow (800 and 390 pixels): heading, then Contents 28 pixels below "Works on / Updated", then the rule 28 pixels below Contents, then the guide. No sideways scrolling and no errors.

---

## 22 November 2026 — GitHub Pages: One Light / Dark Switch on All Four Pages

### What Was Done
- The owner noticed the four GitHub Pages handled light and dark differently: the home page and user guide had no switch (they only followed the device), App Screens had a "Background" control in its bar, and Expense Flow had a switch beside its legend. All four now have the same **Light / Dark** switch, working like Expense Flow's.
- Options discussed with the owner, and their choices (mockups in `design/theme-switch-mockups.html`):
  - Placement, desktop and phone: the right of the top row, beside "← Hercules home" (option A), rather than inside each page's heading area or a floating button. On the home page, which has no way home, it sits alone at the top right. On the user guide's wide layout the row sits in the reading column, clear of Contents.
  - The choice is remembered: Expense Flow's switch reset on every reload, which would feel broken with a switch on every page. A choice is now kept in the browser under `hercules-pages-theme` and applied before the page is drawn, so it carries across all four pages; with none saved, the device's setting applies. Only the light or dark choice is stored.
  - App Screens' drawing control, which switches the drawings between the app's light and dark themes, is renamed from "Screens" to **App theme**, so it isn't confused with the page switch. Its "Background" control is removed. Captions stays.
- One look for the switch, Expense Flow's (selected option in the soft accent colour), with the same markup and script on each page. Expense Flow's old switch, its styles and script are removed.
- Documents: Test Plan v1.31 (new S-10). CLAUDE.md records the standard switch so new pages get it. Pages only, so the app version stays at 1.5.4.

### Checks
- Locally: with nothing saved, the switch shows the device's setting (dark here) and stores nothing. Choosing Light on the home page was remembered; the user guide, App Screens and Expense Flow opened in Light with the switch on the same row as "← Hercules home"; Light held after reloading Expense Flow; choosing Dark there carried back to the home page. On App Screens, **App theme** changed only the drawings, not the page or the saved choice.
- At 360 pixels wide, the top row fits on all four pages with no sideways scrolling. No errors.
- Clean-up: the saved choice was removed from the test browser.

---

## 22 November 2026 — Expense Flow: Owner's Wording in the Parse Steps, and "Allow-List" Throughout

### What Was Done
- The owner reworded the first steps of "1 · Parse" on the Expense Flow page: "Type out your expense in natural language" (tap the **Parse** button), the client sending "the typed-out text", a shorter "Check the sign-in" ("Reads the sign-in sent with the request."), "Check the account" querying whether the email is on the allow-list, and "Check the input text and the daily limit".
- Reviewed with the owner before committing; their choices:
  1. The client step's title is "Send the text input to the server side", an instruction like the other step titles (it had become "Sends…").
  2. One term, "allow-list" (hyphenated, as in Architecture decision 2 and the Specification), instead of "whitelisted" alongside "allow list". The page's other mentions of "invited" (the "What can go wrong" table's rows 4 and 12, and the account check when saving) also say "on the allow-list" now.
  3. The sign-in check keeps the owner's shorter text, without the line on why it needs no database (it's protected by the app's secret key).
- Pages only, so the app version stays at 1.5.4.

### Checks
- Locally, the diagram draws with no errors; the page says "allow-list" six times and no longer says "whitelist" or "invited".

---

## 22 November 2026 — Expense Flow: "Queries" for the Database Throughout

### What Was Done
- The owner asked whether "asks the database" should become "requests", balancing everyday language against technical terms. Discussed first: "request" already means two other things on the page (what the phone sends to the server, and the call to Claude, labelled "1 request"), so "requests from the database" would overload it, while "queries" is the precise word, matches step 4 ("Queries the database…") and the "1 query" / "2 queries" labels beside each database box, and suits the one deliberately technical page. The owner chose "queries" for all four database mentions:
  - Step 5: "Then queries the database for how many times this person has tapped Parse…"
  - Step 6: "Queries the database for the person's expense categories…"
  - Step 6's experimental note: "Also queries the merchant names on this month's expenses…"
  - Save the expense: "Queries the database to check whether the chosen category belongs to the person…"
- "Ask Claude to read the expense" keeps "ask": Claude is a language model you put a question to, and its box already says "1 request".
- Pages only, so the app version stays at 1.5.4.

### Checks
- Locally, the diagram draws with no errors; "queries the database" appears four times and "asks the database" no longer does.

---

## 22 November 2026 — Expense Flow: Step 8 Says What It Checks

### What Was Done
- The owner found step 8, "Fill in and check the result", ambiguous: fill in what, where the default currency comes from, and what process it is. Checked against the code and explained: it is the server's own code checking and completing Claude's answer before replying (no AI, no database query). The currency comes from `resolveCurrency` (a plain "$" counts as the default if that's a dollar currency, otherwise US dollars; USD is only kept if the text says US dollars); the default currency is the `users.default_currency` column, already read with the account in step 4; an impossible date becomes today; the category is matched by name to the categories read in step 6, otherwise Other. The merchant, amount and remarks pass through unchanged: with Intelligent Merchant Selection on, the merchant's spelling is settled by Claude in step 7, not checked by the server.
- Rewritten with the owner, who chose the first sentence and to keep it simple (no "$" detail, no separate "Then replies" ending): title **"Check and complete Claude's answer"**; text "The server-side application checks Claude's answer before responding to the client. Currency: … Date: … Category: … The merchant, amount and remarks are passed on as Claude gave them."
- Pages only, so the app version stays at 1.5.4.

### Checks
- Locally, the diagram draws with no errors, step 8 shows the new title and text, and its "step 4" and "step 6" references are "Check the account" and "Read the categories". Nothing else used the old title.

---

## 22 November 2026 — User Guide and App Screens: Owner's Wording

### What Was Done
- The owner rewrote parts of the user guide (How Hercules Works) directly in the page:
  - Sections renamed: "What to type" → **"Natural language inputs"**, "Fixing and deleting" → **"Editing and deleting expense records"** (Contents updated to match).
  - Recording, editing, deleting, History, Summary and Spending pace text reworded to name the screens, cards, buttons and the notification toast; several captions rewritten.
  - Removed: the note about the app asking before discarding unsaved changes, the detail on how History search narrows and clears, and the list of spreadsheet apps that open the CSV.
- On App Screens, the owner renamed "Signing in" → **"Signing in to Hercules"** and "Fixing and deleting" → **"Editing and deleting expense records"**, and rewrote the intros for sections 1–3 (sign-in now explains the allow-list).
- Pages only, so the app version stays at 1.5.4.

### Checks
- No email addresses in the changes; the guide's "Updated" date is 22 November 2026.

---

## 22 November 2026 — User Guide and App Screens: Wording Fixes

### What Was Done
- User guide, deleting: "dialog will asks you to confirm the deletion" → "dialog asks you to confirm by tapping **Delete expense**". This names the dialog's confirm button (`expense-sheet.tsx` `confirmLabel="Delete expense"`), so it matches the Undo caption; the card's own button stays **Delete** (`review-card.tsx`).
- App Screens, sign-in intro: "whitelisted beforehand, i.e., added to an allow-list" → "added to an allow-list beforehand", matching "allow-list" on Expense Flow.
- Pages only, so the app version stays at 1.5.4.

---

## 22 November 2026 — GitHub Pages: Owner's Wording, and "Application Screens"

### What Was Done
- The owner edited three GitHub Pages files:
  - **Home page:** heading "Hercules" → **"Project Hercules"**; the intro says "powered by AI" instead of "a large language model" (the user guide's intro too).
  - **User guide:** the deleting paragraph walks through each tap; the early-payment callout, and the Searching, Summary, Settings and sign-out captions are reworded; the quick answer "Claude picked the wrong category or date" → "The AI returned the wrong category or date" (tense fixed with the owner).
  - **App Screens → Application Screens:** label and heading renamed; the footer drops "Drawings of Hercules, not screenshots".
- At the owner's request, the rename was carried everywhere the page is named: its tab title, the home page card ("Application screens") and comment, the README (three mentions), CLAUDE.md (two), and the Test Plan's S-06 and S-10 (Test Plan 1.32). Past worklog entries, earlier version-history rows and the design mockups keep the old name, as records. The guide's "History and Summary app screens" means the app's screens, not this page, so it stays.
- Pages only, so the app version stays at 1.5.4.

### Checks
- No email addresses in the changes; outside past records, "App Screens" no longer appears.

---

## 22 November 2026 — User Guide: Quick Answers Removed

### What Was Done
- At the owner's request, the user guide's **Quick answers** section is deleted: its heading, all its questions and answers, its Contents entry, and the three `dl.faq` style rules only it used. (The owner first commented it out, then chose to delete it, since commented-out text still shows in the public page source.) The guide now ends after "Categories & budgets".
- Nothing else linked to `#faq`. Pages only, so the app version stays at 1.5.4.

---

## 22 November 2026 — 1.5.5: Vercel Builds Only When the App Changes

### What Was Done
- The owner asked whether the app's "Last updated" date matched the changelog. It didn't: the changelog's newest version, 1.5.4, is dated 21 November, but Settings showed about 4:13 pm on 22 November with the short code `141efc8` (removing the guide's Quick answers), not the 1.5.4 commit `e2aea21`. "Last updated" is the build time (`NEXT_PUBLIC_APP_BUILT_AT` in `web/next.config.ts`), and Vercel was rebuilding on every push to `main`: each of the day's GitHub Pages pushes (`75d2b04`, `c8b44d8`, `141efc8` and others) shows a successful Vercel deploy of the unchanged app. Worked out from GitHub's commit statuses; the live app itself wasn't opened.
- Options set out: (1) skip builds when nothing under `web/` changed (recommended); (2) show the release date instead of the build time; (3) leave it. **The owner chose 1.**
- `web/vercel.json` gets an ignored build step: `git diff --quiet ${VERCEL_GIT_PREVIOUS_SHA:-HEAD^} HEAD -- .` (run in `web/`, comparing with the last successful deploy, or the previous commit if Vercel gives none). No change under `web/` → skipped; a change, or a comparison that can't be made → builds.
- Documents: Architecture 0.43 (new decision 42), Specification 0.55 ("Last updated" doesn't change for document updates), Test Plan 1.33 (new S-11).
- A patch release, **1.5.5** (`npm version patch`), with a changelog entry. This commit changes `web/`, so it builds, and Settings will then show 1.5.5 dated 22 November, matching the changelog.

### Checks
- The rule, run locally in `web/` against real commits: 1.5.4 → `141efc8` (documents only) exit 0, skip; `75d2b04` → `c8b44d8` exit 0, skip; the 1.5.4 release commit against its parent exit 1, build; an unknown commit exit 128, build.
- `npx tsc --noEmit` passed, `npx eslint .` gave the one known warning, `npm run build` passed.
- Not tested: Vercel's own run of the step, which can only be seen after pushing (S-11 at the next documents-only push). No screenshot, as nothing on screen changes apart from the version line.

### Slip
- The first local build failed: the local `node_modules` still had Next.js 16.4.3, although `package.json` pins 16.4.6 since 1.5.1 (probably installed on another machine), and Next's security reminder ended the build with an error. `npm ci` brought it to 16.4.6 and the build passed. Lesson: after pulling a dependency change, run `npm ci` in `web/`.
- **Confirmed (22 November 2026):** after the deploy, the owner checked on their phone that Settings shows version **1.5.5**, short code **368d6aa** and "Last updated" at the 1.5.5 release time on 22 Nov 2026. After the documents-only push `6853273`, which Vercel reported as "Canceled by Ignored Build Step", all three were unchanged, so S-07 and S-11 passed.

---

## 22 November 2026 — Document Integrity Check After 1.5.5

### What Was Done
- At the owner's request, checked the documents after everything since the last check (1.5.3): Screens at a Glance's switch and captions, the home page cards, 1.5.4, the Expense Flow diagram and its wording, the shared Light / Dark switch, the owner's guide and Application Screens wording, the rename to Application Screens, the removal of Quick answers, and 1.5.5.
- Version headers matched their last Version History rows (Specification 0.55, Architecture 0.43, Test Plan 1.33, Charter 0.15, Project Plan 0.15; the Go-Live Checklist has only a "Last updated" date and is unchanged). `web/package.json` (1.5.5), `CHANGELOG.md` (24 entries) and the Git tags (24, local and on GitHub; v1.5.4 and v1.5.5 on the same commits in both) agreed. 1.5.5 appears in Architecture decision 42, the Specification's Settings section and Test Plan S-11.
- No old wording left in current documents ("Fixing and deleting", "What to type", "Quick answers", "whitelist", "App Screens" appear only in past records). The note in the 21 November entry, that S-06 still said "Screens at a Glance", is resolved.
- The guide, Application Screens and Expense Flow follow the content rules (the owner's GitHub username appears only in web addresses; no competitor apps; deleted expenses come back only with Undo; only the `you@gmail.com` placeholder). The guide's "Updated" date is 22 November 2026. The live home page, guide, screens and flow pages matched the repository. The README links all three pages; the worklog is dated.
- Fixes, approved by the owner:
  1. CLAUDE.md, integrity check step 5: "Screens at a Glance" → "Application Screens" (the two mentions of the file name stay).
  2. Expense Flow: label and code comment "1.5.4" → "1.5.5" (the flow itself didn't change in 1.5.5).
  3. User guide: the style comment no longer mentions quick answers.
  4. CLAUDE.md (Database changes): "every push to `main` deploys" → "every push to `main` that changes `web/` deploys", since 1.5.5. The same fix to `web/README.md` (Schema changes) is made but held locally, by the owner's choice: it's inside `web/`, so pushing it would rebuild the unchanged app and move Settings' "Last updated" and short code again. It goes out with the next app release.
- Documents only, so the app version stays at 1.5.5. Nothing under `web/` is pushed, so this push is the first check of S-11: Vercel should skip the build.

---

## 22 November 2026 — User Guide: Pictures of Editing an Expense

### What Was Done
- The owner asked for pictures after the first paragraph of "Editing and deleting expense records", so readers can see the **Edit expense** card. Mockup `design/guide-edit-expense-mockups.html` showed the guide with two options: one picture of the Edit expense card (A), or two side by side, History with the tapped expense outlined, then the Edit expense card (B, recommended, as it follows the paragraph's steps and matches the delete pictures below). The owner chose B.
- The Edit expense card is drawn from the app's own card (`review-card.tsx`, `expense-sheet.tsx`): the original text, the amount with the currency picker, Category, Merchant, Date and Remarks, and **Delete**, **Cancel** and **Save**.
- Captions are the owner's: "**Tap an expense item** in the **Log** or **History** screens to open it in the **Edit expense** card. Expenses you've changed show an **edited** tag." and "**Edit expense.** Change any field, then tap on the **Save** button. Tap on the **Delete** button to delete the expense item." (the full stop bold, at the owner's request, as in the guide's other captions).
- Three style rules added for the pictures (the red Delete button, the gap before Cancel and Save, and the outline on the tapped expense). The guide's "Updated" date was already 22 November 2026.
- Documents only, so the app version stays at 1.5.5. The held `web/README.md` fix stays out of this commit, so Vercel shouldn't rebuild.

### Checks
- Previewed locally at 1,280 pixels (side by side) and 375 pixels (stacked), in dark, with no sideways scrolling.

---

## 22 November 2026 — Home Page and User Guide: Intro Paragraphs Use the Full Width

### What Was Done
- The owner asked why the home page's intro paragraph ("Hercules is an intelligent…") didn't use the width of the content area. It was capped at about 54 characters per line (`.lede { max-width: 54ch; }`), a reading-length rule from when the page was built. Options: use the full width (recommended, as it's only a few lines and would line up with the cards), match Application Screens' 64 characters, or leave it. **The owner chose the full width**; the cap is removed.
- The owner asked for the same on the user guide. There the intro fell under the cap on every paragraph and list item (`p, li { max-width: 68ch; }`). Options: the intro only (recommended), or every paragraph (body text would then run to about 110 characters a line). **The owner chose the intro only**: `.lede` gets `max-width: none`; body text keeps its 68-character cap.
- Documents only, so the app version stays at 1.5.5. The held `web/README.md` fix stays out of this commit, so Vercel shouldn't rebuild.

### Checks
- At 1,280 pixels: the home page intro spans exactly the cards' width (two lines instead of four); the guide's intro spans exactly the reading column beside Contents (three lines instead of four), and body paragraphs are unchanged. At 375 pixels neither page changes or scrolls sideways.

---

## 22 November 2026 — 1.5.6: Intelligent Merchant Selection Uses Last Month Too

### What Was Done
- The owner revisited a follow-up: widening Intelligent Merchant Selection's list to last month's merchants (discussed and set aside during 1.5.4). Reason: early in a month the list is short or empty, so on 1 December "ntuc" would no longer match "NTUC FairPrice".
- Options set out: (1) this month and last month by calendar (recommended), or the last 60 days; (2) the 50 used most across both months (recommended), or this month's names first. **The owner chose both recommendations**, and the Settings description "Infer merchant names from this month's and last month's expenses."
- Mockup `design/merchant-two-months-mockups.html` (Settings → Experimental features, now and proposed), approved by the owner.
- Documents: Specification 0.56 (step 3, Sections 4.7, 5.1 and 6), Architecture 0.44 (decision 40 updated), Test Plan 1.34 (new B-20), Charter 0.16 (the privacy constraint), Expense Flow (three mentions, and its label now 1.5.6), and Application Screens' drawing of the description.
- Code, inside the feature's own code: `monthMerchants` in `web/lib/expenses.ts` now reads from the first day of last month to the end of this month (same grouping, ranking and cap of 50; `shiftDays` added to that file's imports); the list's heading in `merchantRule` says "used this month or last month"; the description in `web/lib/experiments.ts`. The parse route is unchanged.
- Version **1.5.6** (patch), with a changelog entry. The `web/README.md` wording fix held from the integrity check goes out with it.

### Tests
- **Switch-off path unchanged:** the full prompt with the switch off, built from the code before and after, is identical character for character (5 inputs). With the switch on, the only line that differs is the list's heading.
- **The query**, on the local database with labelled rows on the demo account: for November it returned this month's and October's merchants, with "ZzTest Mart" from October and "zztest   mart " from November grouped as one, and left out September, a deleted expense and December; for October it included September; for January 2027 it included December 2026 (the turn of the year).
- **Against the language model**, 50 known merchants, 5 runs each: "ntuc" → NTUC FairPrice and "yakun" → Ya Kun every time; Sheng Siong and Din Tai Fung (not listed) kept every time; "Bus fare $2" no merchant every time. "swensens" (not listed) came back as "Swensen's"; with the switch off it came back as "Swensens" 4 times and "Swensen's" once, so that's the usual tidying, not a forced match. B-20's expected result allows either spelling. The known gap is unchanged: "ntuc health dental 80" → NTUC FairPrice in 5 of 5, as in 1.5.4.
- **B-20 in the local app**, signed in as demo@example.com (confirmed through `/api/auth/session` first): with "NTUC FairPrice" saved in October and "Swensens" in September, parsing "ntuc 45.20" on 22 November returned NTUC FairPrice and "swensens 9" returned "Swensen's"; the parse timing log showed `merchants_sent=1` (September not sent). The Experimental features page shows the new description, on two lines.
- `npx tsc --noEmit` passed, `npx eslint .` gave the one known warning, `npm run build` passed.

### Clean-up
- Deleted the 2 test expenses and 2 parse entries the tests created; no `[TEST]` rows remain; the demo account's default currency is unchanged (SGD); removed demo@example.com from the local allow-list; signed the test browser out (it was signed out before); stopped the local database and dev server. The test scripts were temporary files, deleted after each run.
- **Confirmed (22 November 2026):** after the deploy, the owner checked on their phone that Settings shows version **1.5.6**, short code **1898ab9** and "Last updated" on 22 Nov 2026; that Experimental features reads "Infer merchant names from this month's and last month's expenses."; and, with Intelligent Merchant Selection on, that a merchant used in October but not yet in November came back in the review card with its listed name, discarded without saving (B-20 on real data).

---

## 23 November 2026 — Application Screens: White Screenshot View

### What Was Done
- At the owner's request, every drawing on Application Screens can open in a **white screenshot view**: the phone alone on a pure white background (`#FFFFFF`), sized to the window, with no caption or shadow, in the current **App theme**. It's for screenshots of app screens on white for presentation decks and other promotional documents.
- Each phone has an expand button at its top right: shown on hover on a computer, always on touch screens. The view has a close button, next/previous arrows and the screen number; all three, and the mouse pointer, fade after 2 seconds without movement and come back when the mouse moves. Esc closes (focus returns to the button), and the arrow keys step through all 32 screens. On screens 600px wide or less, the arrows sit below the phone instead of beside it.
- The phone is the page's own drawing, copied into the view and scaled to fit, so it stays sharp at any size. A new drawing gets the button automatically.
- Documents: CLAUDE.md (Application Screens) and Test Plan 1.35 (new S-12). Pages only, so the app version stays at 1.5.6.

### Options Considered
- The owner chose the recommended option in each case: an expand button rather than clicking the phone itself; controls that fade rather than always showing; fitted to the window rather than actual size; next/previous rather than one screen at a time; no shadow. After the mockup (`design/screens-white-view-mockups.html`), the owner asked for the arrows to sit below the phone on narrow screens, as they overlapped its edges.

### Checks
- Previewed locally: 32 expand buttons; the view's background is white with the page in light and in dark; after 2 seconds the controls and pointer are hidden; → and Esc work; a dark phone on white with App theme Dark; at 390px wide the button shows without hovering and the arrows sit below the phone, with no sideways scrolling; no console errors.
- **Confirmed (23 November 2026):** after the deploy, the owner checked on their phone that Application Screens' white screenshot view opens each drawing alone on white, with the arrows below the phone.

---

## 23 November 2026 — Application Screens: Every Phone the Same Size

### What Was Done
- The owner noticed that the phones changed size when stepping through the white screenshot view. The drawings were all 300 pixels wide but 562 to 603 pixels tall (21 at 562; 4.1–4.3 at 566; 2.4–2.6, 5.1–5.3 and 6.1–6.2 at 599–603), and the view fits each one to the window's height, so the shorter ones were enlarged up to about 7% more.
- Every phone now has the same height, the tallest drawing's 603 pixels (`min-height` on `.phone`). The extra space goes to the screen's content, and the tab bar stays at the bottom, so the screens look like one device on the page and come out the same size in the white view.
- Documents: CLAUDE.md (the height, and to raise it if a drawing grows taller) and Test Plan 1.36 (S-12: the same size as you step through). Pages only; the app version stays at 1.5.6.

### Options Considered
1. One zoom level for every screen in the white view only: the same width in screenshots, but the shorter phones still shorter. Set aside.
2. Every phone the same height, on the page and in the view (chosen by the owner, recommended). Tried first in the browser on the live page, without changing it: every tab bar stayed at the bottom.

### Checks
- Previewed locally at 1,280 pixels: all 32 phones 300 × 603; no tab bar away from the bottom of its phone; the white view's zoom identical for screens 1.1, 2.4, 5.1 and 6.1 (1.343 at 1,280 × 900).
- At 390 pixels wide, 31 phones are 358 × 603. 5.1 (Summary with the pace chart) is 636 tall there, because its chart grows with the drawing's width; this was already so before the change, and the white view always draws it at 300 wide, so it matches the others there.

---

## 23 November 2026 — User Guide: Every Phone the Same Size

### What Was Done
- After Application Screens' phones were made one height, the owner asked whether the user guide matched. It didn't: its 13 drawings were all 300 pixels wide but 488 to 601 pixels tall (each side-by-side pair already matched; the pairs and the single Categories & budgets drawing differed).
- At the owner's choice (option B, over leaving the guide as it was), every guide phone now has the same 603-pixel height as Application Screens (`min-height` on `.phone`, which is now a column so its screen takes the extra space; the pair-only rule that did this was folded in). Only the height changes: no wording, items or captions. The guide's Updated date is 23 November 2026.
- CLAUDE.md (the user guide section) records that both pages' phones share the height. Pages only; the app version stays at 1.5.6.

### Checks
- Compared the guide before and after, locally at 1,280 pixels: all 13 phones went to 603 tall (488, 515, 542, 553, 565, 575 and 601 before); every phone's text is identical; in each phone, every text item stayed at the same distance from the top, apart from those fixed to the bottom (the review sheet and other bottom sheets), which moved down with it; every tab bar sits at the bottom of its phone.
- At 390 pixels wide, all 13 are 358 × 603, with no sideways scrolling.

---

## 23 November 2026 — User Guide: Pictures Copied From Application Screens

### What Was Done
- The owner noticed the guide's pictures were missing details, such as the tab bar. Compared with Application Screens: 5 of the guide's 13 drawings had no tab bar where the app shows one (History, Searching, Summary, Share of spend, Categories & budgets), and one had only the History tab. The guide's drawings were simplified sketches drawn separately, early on.
- At the owner's choice (option A, over loading the drawings live from `screens.html`), every guide picture is now a copy of the matching Application Screens drawing: Log 2.2, Review before saving 2.4, Tap an expense item 4.1, Edit expense 3.1, Delete confirmation 3.3, Undo toast 3.4, History 4.1, Searching 4.2, Summary 5.1, Share of spend 5.3, Settings 6.1, Sign out 6.2, Categories & budgets 7.1. The guide takes Application Screens' drawing styles, icons and tab-bar script in place of its own; each phone carries `data-screen` naming its source. The guide's text and captions are unchanged.
- CLAUDE.md: the guide's pictures are copies of Application Screens drawings (update the copy when the source changes; new guide pictures are drawn on Application Screens first), and the document integrity check now compares each `data-screen` picture with its source. Mockup: `design/guide-app-drawings-mockups.html`. Pages only; the app version stays at 1.5.6.

### Differences From the Old Pictures
- "Tap an expense item" and "History" now show the same picture (4.1); the old one marked a tapped expense.
- Settings shows Experimental features "1 of 1 on" (6.1) instead of "None right now"; no caption refers to it.

### Checks
- Locally at 1,280 pixels: each of the 13 pictures identical to its Application Screens drawing (every text item's position, size and colour inside the phone); all 300 × 603; the 9 screens with a tab bar show all four tabs with the right one highlighted, and the 4 with a sheet or confirmation have none, as on Application Screens.
- The guide's text and captions outside the pictures are identical to before, character for character. The page's Light / Dark switch, the way home and Contents still work; no console errors.
- At 390 pixels wide: 12 pictures 358 × 603 and Summary (5.1) 358 × 636, as on Application Screens; no sideways scrolling.
