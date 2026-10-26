**Natural Language Expense & Budget Tracker**

```
Version 0.5 · Draft
Last Reviewed: 26 October 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-03 | James Wong, Lionel Lam | Initial draft charter |
| 0.2 | 2026-07-05 | James Wong, Lionel Lam | Updated category taxonomy from fixed to per-user extensible; resolved fixed taxonomy open question |
| 0.3 | 2026-07-12 | James Wong, Lionel Lam | Updated model reference from Phi-4-mini to Phi-4 |
| 0.4 | 2026-07-12 | James Wong, Lionel Lam | Replaced "SLM" / "Small Language Model" terminology with "local model" / "locally-hosted language model" |
| 0.5 | 2026-10-26 | Lionel Lam | Reframed as a hosted, invite-only web app using a cloud language model (Claude Haiku 5.5); self-hosting moved to non-goals; architecture, goals, success criteria and risks updated accordingly. See Architecture document v0.1 |

---

## Team / Collaborators

- James Wong
- Lionel Lam

## 1. Project Overview and Objectives

A hosted, mobile-first web app for logging and tracking personal expenses in plain language. Access is invite-only, for family members and close friends, with each person's data private to their own account. A cloud-hosted language model acts as the Natural Language Interface.

The objectives of this project are to address a personal need to manage and track individual expenses and budgets, and to validate the feasibility of the CPMAI framework in a real cognitive project. The Phase 1 proof of concept (a Python CLI using a locally-hosted model, Phi-4 via Ollama) validated the natural language parsing approach; the web app moves inference to a cloud model for reliability, speed, and ease of hosting.

## 2. Problem Statement

Friction of maintaining an up-to-date expense and budget log can be due to the fiddly and cumbersome nature of some expense tracker apps. This project aims to reduce this friction by employing a Natural Language Interface. For personal and home use – this project aims to deliver a working solution without the expense of recurring subscriptions that is pervasive of the competing alternatives (i.e. YNAB, etc.) available on the market. Running costs are kept minimal (model usage capped at US$5 per month; hosting on free tiers).

## 3. Goals / Non-Goals

**Goals**

- Natural language expense entry, parsed into structured data
- Confirmation screen to review/edit before saving (i.e. human-in-the-loop)
- Budget/expenses tracking by category (i.e. food, rent, shopping etc.)
- Invite-only access via Google sign-in, restricted to an allow-list of family members and close friends
- Private data per account — no shared visibility between users
- Installable on the phone's home screen as a Progressive Web App (PWA)

**Non-Goals (Not in current scope)**

- Shared or collaborative budgets between users
- Multi-currency support (SGD only for now)
- Bank/account sync or import
- Receipt photo / OCR capture
- Dashboard for expenses and budget visualization beyond the monthly summary
- Native mobile app / app store distribution
- Self-hosting / on-premises deployment (possible future option)
- Offline expense logging
- Downloadable/exportable list of expenses (deferred beyond the first version)

## 4. Core User Flow

1. User signs in with Google (allow-listed accounts only)
2. User enters a natural language expense (text only) on their phone
3. Language model (Claude Haiku 5.5) parses the input into structured fields
4. App displays a confirmation screen with editable fields
5. User reviews, corrects if needed, and saves
6. Data is saved to a cloud-hosted database, scoped to the user's account

## 5. Architecture Overview

> Full decision record maintained in the Architecture document.

- **Model:** Claude Haiku 5.5 via the Anthropic API
- **Application:** Next.js (TypeScript), frontend and backend
- **Database:** Neon (hosted Postgres)
- **Authentication:** Google sign-in with an allow-list
- **Hosting:** Vercel (free Vercel address for now)
- **Proof of concept:** the Python CLI (Phi-4 via Ollama, SQLite) remains as a separate, local, experimental tool

## 6. Data Model (High-Level, Proposed)

- **User —** Google account, email, allow-listed
- **Expense —** amount, category, date and time, merchant, notes, payment method
- **Budget —** category, monthly limit, period
- **Category —** per-user, extensible taxonomy; new users are seeded with a starter list (e.g. Food & Dining, Transport, Groceries, Utilities, Other); changes are made directly in the database until a management screen is built

*Full field-level schema maintained separately (see project repo / design doc).*

## 7. Success Criteria

- Can log a day's expenses via natural language in under 30 seconds
- Parsing requires manual correction less than 10% of the time
- Model usage costs stay under US$5 per month

## 8. Open Questions / Risks

- How to handle multi-item entries in a single input?
- ~~Finalize the fixed category taxonomy~~ — *Resolved: categories are per-user and extensible; new users are seeded with a starter list. See spec for details.*
- ~~Containerize the app, or run natively on the home server?~~ — *Resolved: hosted on Vercel; self-hosting is a non-goal for now.*
- Expense text is sent to a cloud model provider (Anthropic) for parsing — accepted, on the basis that API data is not used for training
- Dependency on third-party services (Anthropic, Vercel, Neon, Google)
- Users need a Google account to sign in
- Security risks — how do we protect user data and API keys adequately?

## 9. Milestones (Draft - To be reviewed)

- **Phase 1 —** CLI parsing + local database (complete — proof of concept)
- **Phase 2 —** Web App v1: sign-in, log with confirmation, history, summary, edit/delete, CLI data import
- **Phase 3 —** Budgets & queries
- **Phase 4 —** Polish (export, category management, allow-list administration)
