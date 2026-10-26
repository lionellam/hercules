# Project Hercules — Specification Sheet: "Log an Expense" Flow

```
Version 0.7 · Draft 
Last Reviewed: 26 October 2026
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

1. **User enters expense** — free text, e.g. *"spent $12 on lunch at McDonald's yesterday"*
2. **Application fetches active categories** — before calling the language model, the application queries the Category table for the user's active categories and injects the list into the prompt. This is an application-side step; no AI is involved.
3. **Language model parses input** — the AI step. Produces structured fields (amount, category, merchant, date, etc.) from the raw text, returned via structured outputs so the response is always valid JSON in the expected shape. For category, the language model is instructed to return exactly one name from the injected category list, or "Other" if nothing fits. No free-text category invention.
4. **Application resolves `category_id`** — the returned category name is matched via exact lookup against the Category table. "Other" maps to the row where `is_other = true`. No fuzzy matching required.
5. **Confirmation screen is presented** — parsed fields shown as editable form elements (not a static summary).
6. **User reviews and optionally edits fields directly** — this is the human-in-the-loop step. No re-prompting of the model occurs; corrections are direct field edits.
7. **User confirms/saves** — the system writes the structured record, the original raw text, and a flag indicating whether any edit occurred.
8. **Record is available for viewing** — in History and Summary. A saved record can be reopened from History in the same editable card to be edited or deleted (soft delete, with confirmation). Export is deferred beyond the first version.

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
| `merchant` | string (optional) | Free text; autocomplete-suggested from the user's prior entries, not constrained to a list |
| `date` | date | Parsed or defaulted to today |
| `other_sub_label` | string (optional) | Only populated when the selected category has `is_other = true`; captures specificity (e.g. "gift", "charity") without overloading `remarks` |
| `remarks` | string (optional) | Freeform, **user-authored** notes — distinct from `raw_input`, which is model input |
| `was_edited` | boolean | Flags whether the user modified any parsed field before saving — a proxy signal for parsing accuracy over time |
| `created_at` | timestamp | System-generated |
| `updated_at` | timestamp | Set when a saved record is edited from History |
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
| `is_other` | boolean | Flags the built-in "Other" catch-all; ensures only one such category exists per user. When `true`, the expense entry will prompt for an `other_sub_label` to capture specificity |

**Preset behavior:** each new user is seeded with their own copy of the starter list — Food & Dining, Transport, Groceries, Entertainment, Utilities, Health & Medical, Household, Shopping, Rent, Clothes, Education, Professional Development, Travel — plus an **"Other"** catch-all. In the first version there is no category management screen; changes (rename, add, retire) are made directly in the database.

### 5.3 `Merchant` — no dedicated table (for now)

Merchant is handled as autocomplete-over-free-text, not a constrained/enum list. Suggestions are derived from the user's own prior entries (e.g. distinct prior `merchant` values for that `user_id`), rather than stored as a separate managed list.

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
- **Allow-list.** Only invited email addresses may sign in. Anyone else who signs in with Google is refused. In the first version, the allow-list is managed directly in configuration or the database; an administration screen is deferred.
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

- Budget definitions and tracking logic
- Query/export functionality
- Shared or collaborative visibility between user accounts
- Receipt photo / OCR capture
- Bank/account sync or import
- Offline expense logging (the app shows an offline message and keeps the typed text)
- Multi-currency conversion
- Category management screen
- Allow-list administration screen

---

## 9. Next Steps

1. Review and resolve (or explicitly defer) the open questions in Section 7
2. Redraw the UPN process flow diagram to reflect this spec (single bounded AI activity box, no re-parse loop, edit happens inline at confirmation)
3. Break this spec down into a feature breakdown structure → initial backlog → user story map
