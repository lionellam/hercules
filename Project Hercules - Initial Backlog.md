# Project Hercules — Initial Backlog

```
Version 0.1 · Draft
Last Reviewed: 05 July 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-05 | James Wong, Lionel Lam | Initial backlog derived from user story map |

---

## Backlog conventions

- **ID format:** `HRC-XXX`
- **Phase** maps to the delivery phase in the Feature Breakdown Structure and Project Plan
- **Acceptance criteria** are indicative — to be refined before development begins
- Stories are listed in priority order within each phase

---

## Phase 1 — Foundation

### HRC-001 · Profile selection (hardcoded)
**As a user, I want to select my profile from a hardcoded list so the app knows whose data to use.**

| Field | Detail |
|---|---|
| Phase | 1 |
| Priority | Must Have |

**Acceptance Criteria**
- A list of hardcoded user profiles is available at the API/CLI level
- Selecting a profile scopes all subsequent operations to that `user_id`
- No authentication is required at this stage

---

### HRC-002 · Natural language expense submission (API)
**As a user, I want to submit a natural language expense via API so I can test the parsing loop.**

| Field | Detail |
|---|---|
| Phase | 1 |
| Priority | Must Have |

**Acceptance Criteria**
- An API endpoint accepts a free-text string and a `user_id`
- The raw input is passed to the SLM for parsing
- The structured output is returned in the API response

---

### HRC-003 · View parsed expense fields
**As a user, I want to see the structured fields the model parsed from my input.**

| Field | Detail |
|---|---|
| Phase | 1 |
| Priority | Must Have |

**Acceptance Criteria**
- The API response includes: amount, currency, category (name), merchant, date
- The original `raw_input` is included in the response
- Fields the model could not determine are returned as null

---

### HRC-004 · Profile and category seeding
**As a user, I want to have my profile seeded with a default category list on first use.**

| Field | Detail |
|---|---|
| Phase | 1 |
| Priority | Must Have |

**Acceptance Criteria**
- On first use of a profile, the Category table is populated with the agreed starter list
- The "Other" catch-all category is included, with `is_other = true`
- All seeded categories have `is_default = true` and `is_active = true`

---

### HRC-005 · Raw input preservation
**As a user, I want to have my raw input stored verbatim alongside the parsed output.**

| Field | Detail |
|---|---|
| Phase | 1 |
| Priority | Must Have |

**Acceptance Criteria**
- `Expense.raw_input` stores the original natural language text exactly as submitted
- The field is never modified after the record is created

---

### HRC-006 · Category suggestion from user's active list
**As a user, I want to see the category suggestion the model selected from my active list.**

| Field | Detail |
|---|---|
| Phase | 1 |
| Priority | Must Have |

**Acceptance Criteria**
- Before calling the SLM, the application fetches the user's active categories from the database
- The category list is injected into the SLM prompt
- The SLM returns exactly one category name from the list, or "Other"
- The application resolves the returned name to a `category_id` via exact match lookup

---

## Phase 2 — Confirmation UI

### HRC-007 · Profile picker (web UI)
**As a user, I want to see a profile picker on the home screen so I can switch between profiles.**

| Field | Detail |
|---|---|
| Phase | 2 |
| Priority | Must Have |

**Acceptance Criteria**
- The home screen displays a list of available profiles
- Selecting a profile sets the active session context
- The selected profile name is visible throughout the session

---

### HRC-008 · Natural language text input (web UI)
**As a user, I want to type my expense into a mobile-friendly text field and submit it.**

| Field | Detail |
|---|---|
| Phase | 2 |
| Priority | Must Have |

**Acceptance Criteria**
- A text input field is displayed prominently on the main screen
- The UI is responsive and usable on a mobile viewport
- Submitting the form triggers the parsing flow and navigates to the confirmation screen

---

### HRC-009 · Confirmation screen with editable fields
**As a user, I want to see parsed fields as an editable form on a confirmation screen.**

| Field | Detail |
|---|---|
| Phase | 2 |
| Priority | Must Have |

**Acceptance Criteria**
- The confirmation screen displays all parsed fields as editable form elements (not static text)
- Fields displayed: amount, currency, category, merchant, date, remarks
- The screen is presented before any data is written to the database

---

### HRC-010 · Inline field editing
**As a user, I want to edit any parsed field directly before saving, without re-invoking the model.**

| Field | Detail |
|---|---|
| Phase | 2 |
| Priority | Must Have |

**Acceptance Criteria**
- All fields on the confirmation screen are directly editable
- Editing a field does not trigger a re-parse
- The `was_edited` flag is set to `true` on save if any field was modified from the parsed value

---

### HRC-011 · Other sub-label field
**As a user, I want to enter an "Other" sub-label when I select the Other category.**

| Field | Detail |
|---|---|
| Phase | 2 |
| Priority | Should Have |

**Acceptance Criteria**
- When the "Other" category is selected, an additional optional text field appears for a sub-label
- The sub-label value is saved to `Expense.other_sub_label`
- The field is hidden when any other category is selected

---

### HRC-012 · Confirm and save expense
**As a user, I want to confirm and save the expense so the record is written to the database.**

| Field | Detail |
|---|---|
| Phase | 2 |
| Priority | Must Have |

**Acceptance Criteria**
- A confirm/save action is available on the confirmation screen
- On confirmation, the Expense record is written with all fields including `raw_input` and `was_edited`
- The user receives feedback that the record was saved successfully

---

### HRC-013 · Basic expense log view
**As a user, I want to see a basic list of my logged expenses.**

| Field | Detail |
|---|---|
| Phase | 2 |
| Priority | Should Have |

**Acceptance Criteria**
- A list view displays the user's logged expenses in reverse chronological order
- Each entry shows at minimum: date, amount, category, merchant
- The list is scoped to the active profile's `user_id`

---

## Phase 3 — Budgets & Queries

### HRC-014 · Define category budget
**As a user, I want to define a monthly budget for each category so I can track my spending limits.**

| Field | Detail |
|---|---|
| Phase | 3 |
| Priority | Must Have |

**Acceptance Criteria**
- The user can set a monthly spending limit per category
- Budget periods are monthly
- A budget can be updated or removed

---

### HRC-015 · Budget vs spending summary
**As a user, I want to see a summary of spending vs budget per category for the current month.**

| Field | Detail |
|---|---|
| Phase | 3 |
| Priority | Must Have |

**Acceptance Criteria**
- A summary view shows each category with its budget, total spent, and remaining amount for the current month
- Categories without a defined budget are shown separately
- The view is scoped to the active profile

---

### HRC-016 · Filter expenses
**As a user, I want to filter my expenses by category, date range, or merchant.**

| Field | Detail |
|---|---|
| Phase | 3 |
| Priority | Should Have |

**Acceptance Criteria**
- The expense list can be filtered by one or more of: category, date range, merchant
- Filters can be combined
- Filtered results are displayed in the same list view as HRC-013

---

### HRC-017 · Natural language expense query
**As a user, I want to ask a natural language question about my expenses and get a useful response.**

| Field | Detail |
|---|---|
| Phase | 3 |
| Priority | Could Have |

**Acceptance Criteria**
- The user can enter a natural language query (e.g. "how much did I spend on food last month?")
- The application returns a relevant, human-readable response
- The SLM is used only for query interpretation; data retrieval is handled by application code

---

### HRC-018 · Export expense list
**As a user, I want to export my expense list as a downloadable file for my own records.**

| Field | Detail |
|---|---|
| Phase | 3 |
| Priority | Should Have |

**Acceptance Criteria**
- The user can trigger a download of their expense records
- The export includes all fields relevant for personal record-keeping
- Export format TBD (CSV or similar)

---

## Phase 4 — Polish & Hosting

### HRC-019 · Password-based authentication
**As a user, I want to log in with a password so my profile data is protected from other users of the app.**

| Field | Detail |
|---|---|
| Phase | 4 |
| Priority | Should Have |

**Acceptance Criteria**
- Each profile is protected by a password
- A login screen replaces the hardcoded profile picker
- Sessions are managed securely
- Migration from hardcoded profiles to auth-backed profiles does not require schema changes to Expense or Category tables

---

### HRC-020 · Merchant autocomplete
**As a user, I want to see merchant autocomplete suggestions based on my prior entries.**

| Field | Detail |
|---|---|
| Phase | 4 |
| Priority | Could Have |

**Acceptance Criteria**
- The merchant field on the confirmation screen offers autocomplete suggestions
- Suggestions are derived from the user's prior `Expense.merchant` values for that profile
- No dedicated Merchant table is required at this stage

---

### HRC-021 · Add category via UI
**As a user, I want to add a new category to my list without needing to edit the database manually.**

| Field | Detail |
|---|---|
| Phase | 4 |
| Priority | Should Have |

**Acceptance Criteria**
- A category management screen allows the user to add a new category
- New categories are saved with `is_default = false` and `is_active = true`
- The new category is immediately available for selection when logging an expense

---

### HRC-022 · Rename or retire a category
**As a user, I want to rename or retire a category without losing historical expense records.**

| Field | Detail |
|---|---|
| Phase | 4 |
| Priority | Should Have |

**Acceptance Criteria**
- The user can rename an existing category; historical records retain the updated name via the FK relationship
- The user can retire a category by setting `is_active = false`; it no longer appears in the active list but historical records referencing it are preserved

---

### HRC-023 · Docker Compose deployment
**As a developer, I want to deploy the app via Docker Compose on my home server with minimal configuration.**

| Field | Detail |
|---|---|
| Phase | 4 |
| Priority | Must Have |

**Acceptance Criteria**
- A `docker-compose.yml` is provided that brings up the full stack (backend, database, Ollama)
- Configuration is managed via environment variables
- Documentation covers the setup steps for a home server deployment
