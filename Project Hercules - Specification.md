# Project Hercules — Specification Sheet: "Log an Expense" Flow

```
Version 0.2 · Draft 
Last Reviewed: 05 July 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-03 | James Wong, Lionel Lam | Initial draft specification sheet for the "Log an Expense" flow |

---

## 1. Purpose

Define, at an implementation-ready level of detail, how a user logs an expense via natural language — from text input through to a saved, structured record — including the data model, the boundary of AI involvement, and open questions still to be resolved.

This spec exists to align the team before the process flow diagram (UPN) and feature breakdown/backlog are produced.

---

## 2. Design Principles

**Human-in-the-loop.** No parsed data is saved without the user seeing and having the opportunity to edit it first. The confirmation screen is not optional in this phase.

**Cognitive scope discipline (CPMAI-aligned).** The SLM (Phi-4-mini) is used *only* for the cognitive task of interpreting free text into structured fields. It is not used for storage, validation, retrieval, editing, or any task that deterministic application code already handles well. This keeps the AI surface area small, auditable, and technically grounded.

**Audit-friendly by default.** The original natural language input is preserved verbatim alongside the structured output it produced — not just for the record, but to support troubleshooting, diagnostics, and future review of parsing quality.

**Private by profile, not by deployment.** The app supports multiple independent user profiles on a single self-hosted deployment (e.g. family members), but there is no shared or collaborative visibility between profiles. Each profile's data is private to that profile.

---

## 3. Actors

| Actor | Role |
|---|---|
| **User** | Enters expense text, reviews parsed output, edits fields directly if needed, confirms/saves |
| **SLM (Phi-4-mini via Ollama)** | Cognitive component only — parses raw text into structured fields |
| **Application (backend/database)** | All non-cognitive logic — validation, storage, retrieval, profile and configuration |

---

## 4. Process Flow (Narrative)

1. **User enters expense** — free text, e.g. *"spent $12 on lunch at McDonald's yesterday"*
2. **SLM parses input** — the sole AI step. Produces structured fields (amount, category, merchant, date, etc.) from the raw text.
3. **Confirmation screen is presented** — parsed fields shown as editable form elements (not a static summary).
4. **User reviews and optionally edits fields directly** — this is the human-in-the-loop step. No re-prompting of the model occurs; corrections are direct field edits.
5. **User confirms/saves** — the system writes the structured record, the original raw text, and a flag indicating whether any edit occurred.
6. **Record is available for viewing/export** — out of detailed scope for this spec, noted for completeness.

**Note:** an earlier draft of this flow included a "Looks correct?" decision branch looping back to re-parsing. This has been removed — editing is not a fork to a separate path, it's simply part of interacting with the confirmation screen.

---

## 5. Data Model (Draft)

### 5.1 `Expense`

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Primary key |
| `user_id` | identifier (FK → `User`) | Scopes the record to a profile |
| `raw_input` | string | Original natural language text, stored verbatim |
| `amount` | number | Parsed or user-edited |
| `currency` | string | Defaulted; not asked of the user each time |
| `category_id` | identifier (FK → `Category`) | References a category from the user's own list, not a raw string |
| `merchant` | string (optional) | Free text; autocomplete-suggested from the user's prior entries, not constrained to a list |
| `date` | date | Parsed or defaulted to today |
| `remarks` | string (optional) | Freeform, **user-authored** notes — distinct from `raw_input`, which is model input |
| `was_edited` | boolean | Flags whether the user modified any parsed field before saving — a proxy signal for parsing accuracy over time |
| `created_at` | timestamp | System-generated |
| `updated_at` | timestamp | For future support of post-save edits |

### 5.2 `Category`

Per-user and extensible — this is a **user preference**, not a global constant.

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Primary key |
| `user_id` | identifier (FK → `User`) | Each profile has its own category list |
| `name` | string | e.g. "Food", "Transport", or a user-added custom category |
| `is_default` | boolean | Distinguishes preset/seeded categories from user-added ones |
| `is_active` | boolean | Allows retiring a category without deleting historical records that reference it |

**Preset behavior:** new profiles are seeded with a starter list of common categories (exact list TBD by the team) plus an **"Other"** catch-all. Users can rename, add, or retire categories from there.

### 5.3 `Merchant` — no dedicated table (for now)

Merchant is handled as autocomplete-over-free-text, not a constrained/enum list. Suggestions are derived from the user's own prior entries (e.g. distinct prior `merchant` values for that `user_id`), rather than stored as a separate managed list.

*Flagged as a possible future refinement:* a dedicated `Merchant` table would become worthwhile if richer metadata is ever needed (e.g. a default category per merchant, merchant aliases/name normalization) — not required for this phase.

### 5.4 `User` (minimal, referenced but not detailed here)

Referenced by `Expense.user_id` and `Category.user_id`. Full shape (auth model, profile switching UX, etc.) is an open question — see Section 7.

---

## 6. Boundary of AI Involvement

To keep this explicit and reviewable:

| In scope for the SLM | Out of scope for the SLM |
|---|---|
| Parsing free text → structured fields (amount, category guess, merchant guess, date) | Validating the parsed output |
| — | Saving/storing data |
| — | Retrieving or querying past expenses |
| — | Handling user edits |
| — | Any category/merchant list management |

This table exists to make the CPMAI-aligned scoping decision auditable at a glance, and to prevent scope creep where the model gets pulled into tasks better handled by deterministic code.

---

## 7. Open Questions

Carried forward, not yet resolved:

- **Multi-item entries** — how should input like *"coffee $4 and lunch $12"* be handled? Single record, or split into two?
- **Low-confidence parsing** — should the confirmation screen indicate when the model was uncertain about a specific field (e.g. no date mentioned, so it defaulted to today)? Deferred to a later phase, or in scope now?
- **`raw_input` storage shape** — single table (structured fields + raw text together, as currently drafted), or a separate related/audit table?
- **Category "Other" handling** — does selecting "Other" need a follow-up freeform sub-label, or does the existing `remarks` field cover that need?
- **User/profile model** — how lightweight should profiles be? (e.g. a simple profile picker with no password, relying on the home network itself for access control, vs. something more formal with authentication)
- **`was_edited` granularity** — currently a single boolean. A likely future refinement is tracking *which* fields were edited (e.g. `edited_fields: [category, amount]`) for richer parsing-quality signal — not required now.

---

## 8. Explicitly Out of Scope (This Spec)

- Budget definitions and tracking logic
- Query/export functionality
- Shared or collaborative visibility between user profiles
- Receipt photo / OCR capture
- Bank/account sync or import

---

## 9. Next Steps

1. Review and resolve (or explicitly defer) the open questions in Section 7
2. Redraw the UPN process flow diagram to reflect this spec (single bounded AI activity box, no re-parse loop, edit happens inline at confirmation)
3. Break this spec down into a feature breakdown structure → initial backlog → user story map
