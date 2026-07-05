# Project Hercules — Feature Breakdown Structure
*Organised by delivery phase · Based on Specification v0.4 and Project Plan v0.3*

---

## Phase 1 — Foundation

### NL Parsing Engine
- Phi-4-mini via Ollama integration
- Parse amount, merchant, date from free text
- Category suggestion from user's active list
- Return structured fields to application

### Data Model & Storage
- Expense, Category, User table schema
- User profile seeding (hardcoded)
- Category list seeding (starter taxonomy)
- Manual DB insertion (CLI/API level)

### Text Input (API)
- Accept free-text expense entry via API
- Capture raw_input verbatim

---

## Phase 2 — Confirmation UI

### Web Interface
- Mobile-friendly web UI
- Natural language text input field
- Profile picker (hardcoded profiles)

### Confirmation Screen
- Display parsed fields as editable form
- Inline field editing (no re-parse)
- Other sub-label field (when applicable)
- Confirm & save action
- Capture was_edited flag on save

### Expense Log View
- Basic list of logged expenses

---

## Phase 3 — Budgets & Queries

### Budget Tracking
- Define budget per category
- Track spending vs budget
- Budget period (monthly)

### Queries & Views
- Natural language expense queries
- Simple filtered expense views
- Spending summary by category

### Export / Download
- Export expenses as downloadable file
- In lieu of built-in dashboard

---

## Phase 4 — Polish & Hosting

### Category Management
- Add / rename / retire categories via UI
- Configurable backend for categories

### Authentication
- Migrate from hardcoded to auth-backed profiles
- Password / session management

### Hosting & Deployment
- Containerization (Docker / Compose)
- Self-hosting documentation
- Environment configuration

### UX Polish
- Merchant autocomplete from prior entries
- General UX refinements
