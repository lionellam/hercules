**Natural Language Expense & Budget Tracker**

> Version 0.1 · Draft

## Team / Collaborators

- James Wong
- Lionel Lam

## 1. Project Overview and Objectives

A self-hosted, mobile-first, web-based expense tracker that utilizes a Small Language Model (SLM) as a Natural Language Interface.

The objective of this project is to explore the feasibility of deploying a SLM as part of a cognitive project, and to validate the feasibility of the CPMAI framework, as well as address a personal need to manage and track  individual expenses and budget.

## 2. Problem Statement

Friction of maintaining an up-to-date expense and budget log can be due to the fiddly and cumbersome nature of some expense tracker apps. This POC aims to reduce this friction by employing a Natural Language Interface. For personal and home use – this project aims to deliver a working solution without the expense of recurring subscriptions that is pervasive of the competing alternatives (i.e. YNAB, etc.) available on the market.

## 3. Goals / Non-Goals

**Goals**

- Natural language expense entry, parsed into structured data
- Confirmation screen to review/edit before saving (i.e. human-in-the-loop)
- Budget/expenses tracking by category (i.e. food, rent, shopping etc.)
- Downloadable/exportable list of expenses in lieu of reports / dashboards
- Runs fully on-premises (i.e. self-hosted, on a home server)

**Non-Goals (Not in POC scope)**

- Multi-user support
- Multi-currency / multi-locale support
- Bank/account sync or import
- Receipt photo / OCR capture
- Dashboard for expenses and budget visualization
- Native mobile app / app store distribution

## 4. Core User Flow

1. User enters a natural language expense (text only) on their phone
2. Local model (Phi-4-mini) parses the input into structured fields
3. App displays a confirmation screen with editable fields
4. User reviews, corrects if needed, and saves
5. Data is saved to a remote database

## 5. Architecture Overview (Proposed)

> The below is a recommendation by Claude - further review required

- **Model:** Phi-4-mini via Ollama (local inference)
- **Backend:** FastAPI (Python)
- **Database:** SQLite
- **Frontend:** Mobile-friendly web UI
- **Hosting:** Home server — containerization TBD (see Open Questions)

## 6. Data Model (High-Level, Proposed)

- **Expense —** amount, category, date and time, merchant, notes, payment method
- **Budget —** category, monthly limit, period
- **Category —** fixed taxonomy (e.g. Food, Transport, Groceries, Utilities, Other)

*Full field-level schema maintained separately (see project repo / design doc).*

## 7. Success Criteria

- Can log a day's expenses via natural language in under 30 seconds
- Parsing requires manual correction less than 10% of the time
- No cloud dependency — fully functional offline/on-premises

## 8. Open Questions / Risks

- Containerize the app, or run natively on the home server?
- Always show confirmation screen, or auto-save high-confidence entries?
- How to handle multi-item entries in a single input?
- Finalize the fixed category taxonomy
- Security risks - how do we sandbox adequately?

## 9. Milestones (Draft - To be reviewed)

> The below is a recommendation by Claude - further review required. 

- **Phase 1 —** CLI/API parsing + manual DB insert
- **Phase 2 —** Confirmation UI
- **Phase 3 —** Budgets & queries
- **Phase 4 —** Polish & hosting setup
