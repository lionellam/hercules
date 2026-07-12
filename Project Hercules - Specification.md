# Project Hercules — Specification Sheet: "Log an Expense" Flow

```
Version 0.6 · Draft 
Last Reviewed: 12 July 2026
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

---

## 1. Purpose

Define, at an implementation-ready level of detail, how a user logs an expense via natural language — from text input through to a saved, structured record — including the data model, the boundary of AI involvement, and open questions still to be resolved.

This spec exists to align the team before the process flow diagram (UPN) and feature breakdown/backlog are produced.

---

## 2. Design Principles

**Human-in-the-loop.** No parsed data is saved without the user seeing and having the opportunity to edit it first. The confirmation screen is not optional in this phase.

**Cognitive scope discipline (CPMAI-aligned).** The local model (Phi-4) is used *only* for the cognitive task of interpreting free text into structured fields. It is not used for storage, validation, retrieval, editing, or any task that deterministic application code already handles well. This keeps the AI surface area small, auditable, and technically grounded.

**Audit-friendly by default.** The original natural language input is preserved verbatim alongside the structured output it produced — not just for the record, but to support troubleshooting, diagnostics, and future review of parsing quality.

**Private by profile, not by deployment.** The app supports multiple independent user profiles on a single self-hosted deployment (e.g. family members), but there is no shared or collaborative visibility between profiles. Each profile's data is private to that profile.

---

## 3. Actors

| Actor | Role |
|---|---|
| **User** | Enters expense text, reviews parsed output, edits fields directly if needed, confirms/saves |
| **Local model (Phi-4 via Ollama)** | Cognitive component only — parses raw text into structured fields |
| **Application (backend/database)** | All non-cognitive logic — validation, storage, retrieval, profile and configuration |

---

## 4. Process Flow (Narrative)

1. **User enters expense** — free text, e.g. *"spent $12 on lunch at McDonald's yesterday"*
2. **Application fetches active categories** — before calling the local model, the application queries the Category table for the user's active categories and injects the list into the prompt. This is an application-side step; no AI is involved.
3. **Local model parses input** — the AI step. Produces structured fields (amount, category, merchant, date, etc.) from the raw text. For category, the local model is instructed to return exactly one name from the injected category list, or "Other" if nothing fits. No free-text category invention.
4. **Application resolves `category_id`** — the returned category name is matched via exact lookup against the Category table. "Other" maps to the row where `is_other = true`. No fuzzy matching required.
5. **Confirmation screen is presented** — parsed fields shown as editable form elements (not a static summary).
6. **User reviews and optionally edits fields directly** — this is the human-in-the-loop step. No re-prompting of the model occurs; corrections are direct field edits.
7. **User confirms/saves** — the system writes the structured record, the original raw text, and a flag indicating whether any edit occurred.
8. **Record is available for viewing/export** — out of detailed scope for this spec, noted for completeness.

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
| `other_sub_label` | string (optional) | Only populated when the selected category has `is_other = true`; captures specificity (e.g. "gift", "charity") without overloading `remarks` |
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
| `is_other` | boolean | Flags the built-in "Other" catch-all; ensures only one such category exists per profile. When `true`, the expense entry will prompt for an `other_sub_label` to capture specificity |

**Preset behavior:** new profiles are seeded with a starter list of common categories (exact list TBD by the team) plus an **"Other"** catch-all. Users can rename, add, or retire categories from there.

### 5.3 `Merchant` — no dedicated table (for now)

Merchant is handled as autocomplete-over-free-text, not a constrained/enum list. Suggestions are derived from the user's own prior entries (e.g. distinct prior `merchant` values for that `user_id`), rather than stored as a separate managed list.

*Flagged as a possible future refinement:* a dedicated `Merchant` table would become worthwhile if richer metadata is ever needed (e.g. a default category per merchant, merchant aliases/name normalization) — not required for this phase.

### 5.4 `User`

| Field | Type | Notes |
|---|---|---|
| `id` | identifier | Primary key |
| `display_name` | string | Human-readable name shown in the profile picker (e.g. "Lionel", "James") |
| `is_active` | boolean | Allows disabling a profile without deleting its data |
| `created_at` | timestamp | System-generated |

**Profile model — phased approach:**

- **Phase 1 (prototype):** Profiles are hardcoded in configuration. No passwords, no login screen — users select their profile from a simple picker. Access control is delegated to the home network (i.e. the app is not publicly exposed). The priority is to get a working prototype out quickly and validate functionality.
- **Future phase:** The `User` table is designed to accommodate a proper authentication layer (e.g. password hash, session tokens) without structural changes to `Expense` or `Category`. Migration from hardcoded to auth-backed profiles should be straightforward.

**Design intent:** profile data is private and non-shared. Each profile operates as an independent silo within the same deployment.

---

## 6. Boundary of AI Involvement

To keep this explicit and reviewable:

| In scope for the local model | Out of scope for the local model |
|---|---|
| Parsing free text → structured fields (amount, merchant guess, date) | Validating the parsed output |
| Category suggestion — selecting the best match from the user's active category list (injected into the prompt by the application); returns a name from the list or the sentinel "Other" | Fetching the category list (application responsibility) |
| — | Resolving the returned category name to a `category_id` (application responsibility — exact match lookup) |
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
- ~~**Category "Other" handling**~~ — *Resolved in v0.3: `is_other` flag added to `Category`; `other_sub_label` field added to `Expense` for specificity. `remarks` remains a general-purpose notes field.*
- ~~**User/profile model**~~ — *Resolved in v0.3: lightweight hardcoded profiles for the prototype (profile picker, no auth); designed to scale to proper authentication in a future phase. See Section 5.4.*
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
