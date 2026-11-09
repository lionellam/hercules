# Project Hercules — Specification Sheet: "Log an Expense" Flow

```
Version 0.34 · Draft 
Last Reviewed: 9 November 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-03 | James Wong, Lionel Lam | Initial draft specification sheet for the "Log an Expense" flow |
| 0.2 | 2026-07-05 | James Wong, Lionel Lam | Updated taxonomy and user-specific expense categories |
| 0.3 | 2026-07-05 | James Wong, Lionel Lam | Resolved open questions: user/profile model and "Other" category handling; updated data model accordingly |
| 0.4 | 2026-07-05 | James Wong, Lionel Lam | Extended SLM role to include category suggestion from the user's active category list; updated process flow and AI boundary accordingly |
| 0.5 | 2026-07-12 | James Wong, Lionel Lam | Updated SLM actor reference from Phi-4-mini to Phi-4 |
| 0.6 | 2026-07-12 | James Wong, Lionel Lam | Replaced "SLM" terminology with "local model" throughout |
| 0.7 | 2026-10-26 | Lionel Lam | Updated for the hosted web app: language model changed to Claude Haiku 5.5 with structured outputs; Google sign-in with allow-list replaces hardcoded profiles; soft delete and edits added to Expense; first-version scope and out-of-scope items updated |
| 0.8 | 2026-11-02 | Lionel Lam | Expenses in the Log screen's "Today" list can be opened to edit or delete them, as in History |
| 0.9 | 2026-11-02 | Lionel Lam | Log screen shows today's total spend by category below the "Today" list |
| 0.10 | 2026-11-02 | Lionel Lam | Screens show the last-loaded data straight away and refresh it in the background |
| 0.11 | 2026-11-02 | Lionel Lam | Summary shows a pie chart of the month's spend by category below the category list |
| 0.12 | 2026-11-02 | Lionel Lam | Log screen keeps its heading and text input fixed at the top while the content below scrolls |
| 0.13 | 2026-11-02 | Lionel Lam | Log screen shows today's total spend below the text input, in the fixed top section |
| 0.14 | 2026-11-02 | Lionel Lam | Summary's pie chart shows for any month with expenses, including a month with one category |
| 0.15 | 2026-11-02 | Lionel Lam | Categories screen to add and rename categories and set an optional monthly budget; Summary shows spend against budget for the current month |
| 0.16 | 2026-11-02 | Lionel Lam | Summary's bars show spend against budget for budgeted categories in the current month |
| 0.17 | 2026-11-02 | Lionel Lam | Over-budget bars in Summary turn red |
| 0.18 | 2026-11-02 | Lionel Lam | History keeps its heading and month switcher fixed at the top while the list scrolls |
| 0.19 | 2026-11-02 | Lionel Lam | Summary keeps its heading and month selector fixed at the top while the content scrolls |
| 0.20 | 2026-11-02 | Lionel Lam | Categories screen keeps its heading and add button fixed at the top while the list scrolls |
| 0.21 | 2026-11-07 | Lionel Lam | Summary shows spending pace against budget for the current month: an expected-by-today marker and note on each budgeted category, and a burn-up chart on tap |
| 0.22 | 2026-11-07 | Lionel Lam | Summary no longer lists budgeted categories with no spending yet |
| 0.23 | 2026-11-07 | Lionel Lam | Added Section 4.1, the spending pace rules with a worked example |
| 0.24 | 2026-11-07 | Lionel Lam | Corrected the v0.10 entry and moved the History and Summary pinned-header note into process flow step 8, where it was intended in v0.18 and v0.19 |
| 0.25 | 2026-11-07 | Lionel Lam | Marked merchant suggestions and the "Other" sub-label prompt as not yet built in the web app |
| 0.26 | 2026-11-07 | Lionel Lam | Allow-list storage and `updated_at` wording brought up to date; the July 2026 diagrams noted as historical |
| 0.27 | 2026-11-07 | Lionel Lam | Burn-up chart made larger: no y-axis labels and smaller side margins, runs to the edges of the open category, and its labels move to stay clear of each other (Section 4.1) |
| 0.28 | 2026-11-07 | Lionel Lam | Corrected the v0.27 entry's wording on side margins, and stated exactly when the "Today" label aligns to the chart's edges |
| 0.29 | 2026-11-08 | Lionel Lam | Dates must be real calendar dates in the years 2000 to 2099; a parsed date that isn't falls back to today |
| 0.30 | 2026-11-08 | Lionel Lam | Categories can be retired and restored in the app; retired categories are kept, so past expenses still show them |
| 0.31 | 2026-11-08 | Lionel Lam | In-app confirmation sheets replace the phone's prompts; Undo after deleting an expense or retiring a category; a check before discarding unsaved changes (Section 4.2) |
| 0.32 | 2026-11-09 | Lionel Lam | Search on History, for the month selected (Section 4.3) |
| 0.33 | 2026-11-09 | Lionel Lam | An "×" button clears the Log screen's text box |
| 0.34 | 2026-11-09 | Lionel Lam | Settings tab replaces the Categories tab; Categories becomes "Categories & budgets" inside Settings; Appearance and Sign out move into Settings; the app version and last update are shown (Section 4.4) |

---

## 1. Purpose

Define, at an implementation-ready level of detail, how a user logs an expense via natural language — from text input through to a saved, structured record — including the data model, the boundary of AI involvement, and open questions still to be resolved.

This spec exists to align the team before the process flow diagram (UPN) and feature breakdown/backlog are produced.

---

## 2. Design Principles

**Human-in-the-loop.** No parsed data is saved without the user seeing and having the opportunity to edit it first. The confirmation screen is not optional in this phase.

**Cognitive scope discipline (CPMAI-aligned).** The language model (Claude Haiku 5.5) is used *only* for the cognitive task of interpreting free text into structured fields. It is not used for storage, validation, retrieval, editing, or any task that deterministic application code already handles well. This keeps the AI surface area small, auditable, and technically grounded.

**Audit-friendly by default.** The original natural language input is preserved verbatim alongside the structured output it produced — not just for the record, but to support troubleshooting, diagnostics, and future review of parsing quality.

**Private by account.** The app supports multiple invited users (e.g. family members and close friends) on a single hosted deployment, but there is no shared or collaborative visibility between accounts. Each user's data is private to their own account.

---

## 3. Actors

| Actor | Role |
|---|---|
| **User** | Signs in with Google, enters expense text, reviews parsed output, edits fields directly if needed, confirms/saves |
| **Language model (Claude Haiku 5.5 via the Anthropic API)** | Cognitive component only — parses raw text into structured fields |
| **Application (backend/database)** | All non-cognitive logic — authentication and allow-list, validation, storage, retrieval, usage limits and configuration |

*The Phase 1 CLI proof of concept follows the same flow using a locally-hosted model (Phi-4 via Ollama) and is maintained separately.*

---

## 4. Process Flow (Narrative)

1. **User enters expense** — free text, e.g. *"spent $12 on lunch at McDonald's yesterday"*. The heading and text input stay fixed at the top of the Log screen while the content below scrolls, so a new expense can be entered from anywhere in the list. Once there is text in the box, an "×" button at its top right clears it in one tap, without asking. Directly below the input, this section also shows today's total spend (amounts are added without currency conversion, as in Summary)
2. **Application fetches active categories** — before calling the language model, the application queries the Category table for the user's active categories and injects the list into the prompt. This is an application-side step; no AI is involved.
3. **Language model parses input** — the AI step. Produces structured fields (amount, category, merchant, date, etc.) from the raw text, returned via structured outputs so the response is always valid JSON in the expected shape. For category, the language model is instructed to return exactly one name from the injected category list, or "Other" if nothing fits. No free-text category invention.
4. **Application resolves `category_id`** — the returned category name is matched via exact lookup against the Category table. "Other" maps to the row where `is_other = true`. No fuzzy matching required.
5. **Confirmation screen is presented** — parsed fields shown as editable form elements (not a static summary).
6. **User reviews and optionally edits fields directly** — this is the human-in-the-loop step. No re-prompting of the model occurs; corrections are direct field edits.
7. **User confirms/saves** — the system checks the fields, then writes the structured record, the original raw text, and a flag indicating whether any edit occurred. The date must be a real calendar date in the years 2000 to 2099 (so not, for example, 31 February); otherwise the save is refused with a message to check the fields.
8. **Record is available for viewing** — in History and Summary, and in the "Today" list on the Log screen for expenses dated today. A saved record can be reopened from History or from the Today list in the same editable card to be edited or deleted (soft delete, after a confirmation, with Undo; see Section 4.2). Below the Today list, the Log screen shows today's total spend broken down by category (amounts are added without currency conversion, as in Summary). For the current month, a category with a budget shows its spend as "x of budget", with its bar showing the share of the budget used (full at or above 100%, and red once spend is over the budget). Each budgeted bar also has a marker at the amount expected by today (budget × day of month ÷ days in month, counting today), and a note: "Over budget by $X" (red), "Budget used", "On pace" (within 5% of the budget either side of the expected amount), or "$X over/under pace", followed by the amount left and about how much a day remains (see Section 4.1 for the exact rules). Tapping a budgeted category opens a burn-up chart of its running total against the budget spread evenly over the month, with a "Daily figures" table. Categories with no spending in the month are not listed, whether or not they have a budget. The previous month is shown without pace. Other bars show the category's spend relative to the month's largest category. Below its category list, Summary shows a pie chart of the month's spend by category for any month with expenses: up to six slices, with any beyond the largest five grouped as "Everything else". History and Summary keep their heading and month control fixed at the top while the content below scrolls; on History, a search field sits below the month control (Section 4.3). Screens show the last-loaded data straight away and refresh it in the background; saving, editing or deleting a record reloads it. Export is deferred beyond the first version.

### 4.1 Spending Pace Rules (Summary, Current Month)

Applies to each category that has a monthly budget and spending in the current month. The previous month shows no pace.

**Expected by today** = budget × today's day of the month ÷ days in the month. Today counts as a full day, so on the last day the expected amount equals the budget. The day is taken from the device's local date. The marker on the bar sits at this amount.

The note under the bar uses the **first** rule that matches:

| Order | Rule | Note shows |
|---|---|---|
| 1 | Spent is more than the budget | "Over budget by $X" in red with a warning icon, where X = spent − budget |
| 2 | Spent equals the budget | "Budget used · $0.00 left" |
| 3 | Spent is within 5% of the **full monthly budget** either side of expected | "On pace" |
| 4 | Spent is above that band | "$X over pace", where X = spent − expected |
| 5 | Spent is below that band | "$X under pace", where X = expected − spent |

For rules 3–5, the note continues with "$Y left, about $Z/day", where Y = budget − spent and Z = Y ÷ the days remaining after today. On the last day of the month it reads "$Y left today" instead.

Notes:
- Order matters: a one-off payment of the whole budget (such as rent on day 1) shows "Budget used" rather than "over pace".
- Red is used only for over budget. Spending early is not overspending, so "over pace" stays in the normal colour.
- There is no "too early to tell" period: early in the month, a single expense can show as over pace.
- Amounts are compared in whole cents and added without currency conversion, as elsewhere in Summary.

**Worked example** — 7 November, day 7 of 30:

| Category | Budget | Expected by today | On-pace band | Spent | Note |
|---|---|---|---|---|---|
| Food & Dining | $500 | $500 × 7 ÷ 30 = $116.67 | $91.67 – $141.67 (±$25) | $210.00 | $93.33 over pace · $290.00 left, about $12.61/day |
| Transport | $150 | $35.00 | $27.50 – $42.50 (±$7.50) | $30.00 | On pace · $120.00 left, about $5.22/day |
| Groceries | $400 | $93.33 | $73.33 – $113.33 (±$20) | $45.00 | $48.33 under pace · $355.00 left, about $15.43/day |
| Entertainment | $100 | $23.33 | — | $128.00 | Over budget by $28.00 (red) |
| Rent | $2,000 | $466.67 | — | $2,000.00 | Budget used · $0.00 left |

**Burn-up chart layout.** The chart spans the full width of the open category, with no y-axis labels and only small side margins, so the plot uses most of the screen. It shows the running total (solid, red once over budget), the budget spread evenly over the month (dashed), the budget line with a "Budget X" label, today's line with a "Today" label, and today's amount beside today's dot. Labels move to stay clear of each other:
- **Today's amount** sits above and to the right of the dot, and moves to the dot's left when it would run past the right edge.
- **"Budget X"** sits at the right end of the budget line, and moves to the left end late in the month once spending reaches 80% of the budget, where the line and dot would otherwise reach it.
- **"Today"** is centred on today's line, and aligned to the chart's left edge on the first day and its right edge on the last two days of the month.
- **Dates** run along the bottom, with the first day aligned to the left edge and the last day to the right edge.

### 4.2 Confirmations, Undo and Unsaved Changes

Confirmations are shown in the app's own confirmation sheet, which slides up over the open screen (a centred dialog on wider screens), rather than the phone's or browser's built-in prompt. The main action is on top and the way back underneath; tapping outside the sheet counts as the way back. Routine actions (saving, restoring, adding a category, changing a budget, signing out) don't ask.

| Action | Confirmation | Afterwards |
|---|---|---|
| Delete an expense | "Delete this expense?", showing the expense's merchant (or typed text), category, date and amount; red "Delete expense" button | "Expense deleted" bar with **Undo** for about five seconds; Undo brings the expense back |
| Retire a category | "Retire *name*?", explaining that it won't be offered for new expenses and past expenses keep it; a second paragraph when it has a budget; red "Retire category" button | "*name* retired" bar with **Undo** for about five seconds; Undo restores it |
| Close Edit expense, Edit category or Add category with unsaved changes (Cancel, or tapping outside) | "Discard changes?", with "Discard changes" and "Keep editing" | Nothing is saved |
| Discard on the Log screen's review card after changing any parsed detail | "Discard your edits?", with "Discard" and "Keep reviewing" | The typed text stays in the box |

A sheet with no changes closes straight away, and Discard on an unchanged review card works straight away, since the typed text is still there to parse again. Only the most recent Undo is offered; a new one replaces it.

### 4.3 Searching History

History has a search field below its month control, in the section fixed at the top. It searches only the month selected.

- **As you type:** the list is filtered with each keystroke, keeping the grouping by day. Matching text is highlighted.
- **What matches:** each word typed must appear, in any order and regardless of capitals, in the expense's merchant, original typed text, category, remarks or amount (for example "14.20").
- **Results line:** above the list, the number of matching expenses and their total ("3 results", "$52.80").
- **No matches:** "No search results", with a line naming the month and the search text.
- **Clearing:** an "×" button at the right of the field appears once there is text, and clears it. Changing the month and leaving History also clear the search.

The month's expenses are already loaded on the device, so searching needs no server request.

### 4.4 Settings

Settings is the fourth tab, with a gear icon, after Log, History and Summary. It replaces the Categories tab and lists:

- **Spending:** **Categories & budgets**, with the number of categories in use and how many have a budget (for example "14 categories · 5 with a budget"). Tapping it opens the Categories & budgets page, which works exactly as the Categories tab did (see the Category notes in Section 5), with "‹ Settings" at the top to go back.
- **Appearance:** System, Light or Dark. System follows the device's setting. The choice is saved on that device only. This replaces the sun or moon icon that was at the top of every screen.
- **Account:** the email address signed in with, and **Sign out**, which moves here from the bottom of Summary.
- **Below Account:** the app's version number and the date and time it was last updated, meaning when the version running was built and deployed.

Opening the Settings tab always shows the Settings list, even if Categories & budgets was open when you left it.

---

## 5. Data Model (Draft)

### 5.1 `Expense`

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Primary key |
| `user_id` | identifier (FK → `User`) | Scopes the record to a user account |
| `raw_input` | string | Original natural language text, stored verbatim |
| `amount` | number | Parsed or user-edited |
| `currency` | string | Defaulted to SGD; not asked of the user each time. SGD only in the first version — summaries do not convert other currencies |
| `category_id` | identifier (FK → `Category`) | References a category from the user's own list, not a raw string |
| `merchant` | string (optional) | Free text; autocomplete-suggested from the user's prior entries, not constrained to a list. *Suggestions not yet built in the web app* |
| `date` | date | Parsed or defaulted to today. Must be a real calendar date in the years 2000 to 2099; a parsed date that isn't falls back to today |
| `other_sub_label` | string (optional) | Only populated when the selected category has `is_other = true`; captures specificity (e.g. "gift", "charity") without overloading `remarks`. *Not yet built in the web app: the column exists, but the review card doesn't ask for it, so it is currently always empty* |
| `remarks` | string (optional) | Freeform, **user-authored** notes — distinct from `raw_input`, which is model input |
| `was_edited` | boolean | Flags whether the user modified any parsed field before saving — a proxy signal for parsing accuracy over time |
| `created_at` | timestamp | System-generated |
| `updated_at` | timestamp | Set when a saved record is edited (from History or the Log screen's Today list) |
| `deleted_at` | timestamp (optional) | Set when a record is deleted (soft delete). Deleted records are hidden from History and Summary but remain recoverable, in line with the audit-friendly principle |
| `source_ref` | string (optional) | Origin of imported records (e.g. `cli:42` for a CLI record); empty for entries made in the app. Makes the one-off CLI import safe to re-run |

### 5.2 `Category`

Per-user and extensible — this is a **user preference**, not a global constant.

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Primary key |
| `user_id` | identifier (FK → `User`) | Each user has their own category list |
| `name` | string | e.g. "Food", "Transport", or a user-added custom category |
| `is_default` | boolean | Distinguishes preset/seeded categories from user-added ones |
| `is_active` | boolean | Allows retiring a category without deleting historical records that reference it |
| `is_other` | boolean | Flags the built-in "Other" catch-all; ensures only one such category exists per user. When `true`, the expense entry will prompt for an `other_sub_label` to capture specificity (*prompt not yet built in the web app*) |
| `monthly_budget` | number (optional) | The category's current monthly budget in SGD; empty means no budget. Only the current amount is kept, so past months' budgets are not recorded |

**Preset behavior:** each new user is seeded with their own copy of the starter list — Food & Dining, Transport, Groceries, Entertainment, Utilities, Health & Medical, Household, Shopping, Rent, Clothes, Education, Professional Development, Travel — plus an **"Other"** catch-all. The Categories & budgets page, opened from Settings (Section 4.4), adds and renames categories and sets their monthly budgets; its heading and add button stay fixed at the top while the list scrolls. Names must be unique for the user regardless of capitalisation, with a limit of 50 active categories per user. "Other" cannot be renamed or retired and stays last in the list, because the application falls back to it by name.

**Retiring a category:** any category except "Other" can be retired from its edit sheet, after a confirmation. A retired category is never deleted from the database. It is no longer offered for new expenses or to the language model, but past expenses keep it and show its name in History, the Today list and Summary. Its budget is kept but not tracked while it is retired, so any spending in it this month shows as a plain bar without a pace note. An existing expense in a retired category can still be opened and saved; the edit sheet shows the category as "*name* (retired)" and also offers the active categories, but a retired category can't be chosen for any other expense. Retired categories are listed in a collapsed "Retired" group at the bottom of the Categories & budgets page, each with a Restore button that brings it back with its budget. They can't be renamed until restored. Adding a category whose name matches a retired one (regardless of capitalisation) restores that category, with the budget entered, instead of creating a new one. Restoring counts towards the 50-category limit.

### 5.3 `Merchant` — no dedicated table (for now)

Merchant is handled as autocomplete-over-free-text, not a constrained/enum list. Suggestions are derived from the user's own prior entries (e.g. distinct prior `merchant` values for that `user_id`), rather than stored as a separate managed list. *Not yet built in the web app: the merchant field is currently plain free text with no suggestions.*

*Flagged as a possible future refinement:* a dedicated `Merchant` table would become worthwhile if richer metadata is ever needed (e.g. a default category per merchant, merchant aliases/name normalization) — not required for this phase.

### 5.4 `User`

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Primary key |
| `email` | string | Google account email; must match an allow-list entry to sign in |
| `google_id` | string | Google account identifier, used to recognise the user on later sign-ins |
| `display_name` | string | Human-readable name taken from the Google account (e.g. "Lionel") |
| `is_active` | boolean | Allows disabling a user without deleting their data |
| `created_at` | timestamp | System-generated |

**Authentication and access:**

- **Google sign-in only.** Users sign in with their Google account; there are no app-specific passwords.
- **Allow-list.** Only invited email addresses may sign in. Anyone else who signs in with Google is refused. In the first version, the allow-list is an `allowed_emails` database table, managed with `npm run allow`; an administration screen is deferred.
- **First sign-in.** When an allow-listed user signs in for the first time, a `User` record is created and seeded with the starter category list.
- **Usage limits.** Each user may parse up to 100 expenses per day, as a safeguard on model costs.

**Design intent:** user data is private and non-shared. Each account operates as an independent silo within the same deployment.

---

## 6. Boundary of AI Involvement

To keep this explicit and reviewable:

| In scope for the language model | Out of scope for the language model |
|---|---|
| Parsing free text → structured fields (amount, merchant guess, date) | Validating the parsed output |
| Category suggestion — selecting the best match from the user's active category list (injected into the prompt by the application); returns a name from the list or the sentinel "Other" | Fetching the category list (application responsibility) |
| — | Resolving the returned category name to a `category_id` (application responsibility — exact match lookup) |
| — | Saving/storing data |
| — | Retrieving or querying past expenses |
| — | Handling user edits |
| — | Any category/merchant list management |
| — | Authentication, allow-list checks, and usage/spend limits |

This table exists to make the CPMAI-aligned scoping decision auditable at a glance, and to prevent scope creep where the model gets pulled into tasks better handled by deterministic code.

---

## 7. Open Questions

Carried forward, not yet resolved:

- **Multi-item entries** — how should input like *"coffee $4 and lunch $12"* be handled? Single record, or split into two?
- **Low-confidence parsing** — should the confirmation screen indicate when the model was uncertain about a specific field (e.g. no date mentioned, so it defaulted to today)? Deferred to a later phase, or in scope now?
- **`raw_input` storage shape** — single table (structured fields + raw text together, as currently drafted), or a separate related/audit table?
- ~~**Category "Other" handling**~~ — *Resolved in v0.3: `is_other` flag added to `Category`; `other_sub_label` field added to `Expense` for specificity. `remarks` remains a general-purpose notes field.*
- ~~**User/profile model**~~ — *Resolved in v0.3: lightweight hardcoded profiles for the prototype (profile picker, no auth); designed to scale to proper authentication in a future phase. Superseded in v0.7: Google sign-in with an allow-list. See Section 5.4.*
- **`was_edited` granularity** — currently a single boolean. A likely future refinement is tracking *which* fields were edited (e.g. `edited_fields: [category, amount]`) for richer parsing-quality signal — not required now.

---

## 8. Explicitly Out of Scope (This Spec)

- Budget tracking beyond showing the current month's spend against each category's budget (alerts, budget history, rollover)
- Query/export functionality
- Shared or collaborative visibility between user accounts
- Receipt photo / OCR capture
- Bank/account sync or import
- Offline expense logging (the app shows an offline message and keeps the typed text)
- Multi-currency conversion
- Permanently deleting categories (retired categories are kept)
- Allow-list administration screen

---

## 9. Next Steps

1. Review and resolve (or explicitly defer) the open questions in Section 7
2. Redraw the UPN process flow diagram to reflect this spec (single bounded AI activity box, no re-parse loop, edit happens inline at confirmation). The flow diagram, Entity Relationship Diagram and Application Wireframes in the repository date from July 2026 and still show the proof-of-concept design (profile picker, local model); treat them as historical until they are redrawn
3. Break this spec down into a feature breakdown structure → initial backlog → user story map
