# Project Hercules — Project Plan

```
Version 0.6 · Draft 
Last Reviewed: 26 October 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-07-03 | James Wong, Lionel Lam | Initial draft project plan |
| 0.2 | 2026-07-05 | James Wong, Lionel Lam | Reordered plan sections; updated milestones format; aligned with spec |
| 0.3 | 2026-07-05 | James Wong, Lionel Lam | Updated NL Parsing Engine feature to reflect category suggestion capability |
| 0.4 | 2026-07-12 | James Wong, Lionel Lam | Updated NL Parsing Engine model reference from Phi-4-mini to Phi-4 |
| 0.5 | 2026-07-12 | James Wong, Lionel Lam | Replaced "SLM" / "Small Language Model" terminology with "local model" / "locally-hosted language model" |
| 0.6 | 2026-10-26 | Lionel Lam | Reframed as a hosted, invite-only web app using a cloud language model; rewrote overview, objectives, vision, features, milestones and risks; added Invited Family Member persona; moved self-hosting personas to future scope |

---

## 1. Overview

Project Hercules is a hosted, open source expense and budget tracker with a natural language interface, powered by a cloud-hosted language model, to remove the friction of manual expense entry. It is a mobile-first web app, invite-only for family members and close friends, with each person's data private to their own account. This plan translates the project charter into a working plan — covering the product vision, objectives, features, phases, and risks.

The Phase 1 proof of concept — a Python CLI using a locally-hosted model (Phi-4 via Ollama) — validated the parsing approach and remains in the repository as a separate, local, experimental tool.

## 2. Problem Statement

Friction of maintaining an up-to-date expense and budget log can be due to the fiddly and cumbersome nature of some expense tracker apps. This project aims to reduce this friction by employing a natural language interface. For personal and home use, this project aims to deliver a working solution without the expense of recurring subscriptions that is pervasive of the competing alternatives (i.e. YNAB, etc.) available on the market.

## 3. Project Objectives

- Enable natural language expense entry that is parsed into structured, storable data
- Provide a human-in-the-loop confirmation step before any data is saved
- Support budget and expense tracking by category
- Provide private, per-account data for a small group of invited users
- Keep running costs minimal (model usage under US$5 per month; hosting on free tiers)
- Achieve reliable parsing (target: less than 10% of entries require manual correction)
- To demonstrate the viability of the CPMAI framework in conceiving of and developing cognitive projects.

## 4. Product Vision

**Elevator Statement**

> For people who want to track spending without the hassle of manual data entry or recurring subscription costs, Project Hercules is an expense tracker that lets you log expenses in plain language from your phone. Unlike commercial tools like YNAB, Project Hercules is free to use, open source, and keeps each person's data private to their own account.

**Vision Box**

- Log an expense the way you'd tell a friend — *"spent $12 on lunch"* — no forms, no dropdowns, no friction.
- Your expenses are private to your account — no one else, not even other invited users, can see them.
- No subscriptions, no ads.
- Installs on your phone's home screen and opens like an app.
- Confirm before it's saved — you're always in control of what gets recorded.

## 5. Feature Breakdown

> Feature priorities are grounded in the target personas — see [Appendix A: Personas](#appendix-a-personas).

A high-level look at the functional pieces of the system. These will be broken down further into individual backlog items as the project progresses. 

- **Authentication** — Google sign-in, restricted to an allow-list of invited users
- **Natural Language Input** — free-form text entry for logging an expense
- **NL Parsing Engine** — cloud language model (Claude Haiku 5.5 via the Anthropic API) that parses input into structured fields and suggests the best-matching expense category from the user's active category list
- **Confirmation Screen** — editable review step before data is committed to the database
- **Expense Storage** — structured, queryable storage of logged expenses, scoped per user; edits and soft deletes supported
- **History & Summary** — month-by-month list of expenses, and category totals for the current and previous month
- **Budget Tracking** — category-based budgets and tracking against them
- **Category Taxonomy** — a per-user, extensible set of expense categories; new users are seeded with a starter list
- **Export / Download** — ability to export a list of expenses (deferred beyond the first version)
- **Hosting & Deployment** — Vercel, with a Neon Postgres database; installable as a Progressive Web App (PWA)

## 6. Milestones & Deliverables (Subject to Revision)

Phased and iterative, as follows:

- **Phase 1 — Foundation (complete)**
Python CLI with natural language parsing working end-to-end via a local model (Phi-4 via Ollama), with a confirmation step, local SQLite storage, history and summary views. Proved out the core parsing approach.
- **Phase 2 — Web App v1**
Google sign-in with allow-list; Log screen with inline confirmation card; History (month-by-month, with edit and soft delete); Summary (current and previous month). Installable as a PWA. One-off import of existing CLI data.
- **Phase 3 — Budgets & Queries**
Budget definitions by category, and the ability to query/report on spending via natural language or simple views.
- **Phase 4 — Polish**
Export, category management screen, allow-list administration, and other refinements based on use.

## 7. Risks, Dependencies and Open Questions

- How should multi-item entries in a single input be handled (e.g. "coffee $4 and lunch $12")?
- Parsing reliability is dependent on the chosen language model's performance on free-form, informal text
- Expense text is sent to a cloud model provider (Anthropic) for parsing — accepted, on the basis that API data is not used for training
- Dependency on third-party services: Anthropic (model), Vercel (hosting), Neon (database), Google (sign-in)
- Model usage costs — mitigated by a US$5 monthly spend limit on the Anthropic account and a limit of 100 parses per user per day
- Users need a Google account to sign in
- The allow-list is managed manually (config or database) until an administration screen is built
- Vercel's free Hobby plan is intended for personal, non-commercial use — terms to be checked on sign-up

## 8. Review Checkpoints

This plan is a living document. It should be revisited:

- At the end of each phase, to confirm scope for the next
- Whenever a significant open question (see Risks & Dependencies) is resolved
- As new users are invited and priorities evolve

---

## Appendix A: Personas

A set of representative users the project is designed for. These help ground feature decisions and prioritization in real needs.

### The Busy / Mobile-First Logger

**Jordan, 26, Nurse**
*"I'm not typing into six fields while I'm still holding my coffee."*

- **Goals:** Log expenses in the moment — while walking, in a queue, between tasks — with minimal friction; trust that a quick, casual sentence gets recorded accurately.
- **Frustrations:** Abandons expense tracking within a week or two because manual entry feels like a chore; screen-constrained mobile forms (dropdowns, date pickers) feel disproportionately slow for something as simple as "I bought coffee."
- **Technical Comfort:** Low to moderate — wants to open an app from the home screen and start typing.
- **Relationship to the Product:** Primary day-to-day end-user, and the persona the original problem statement was written around. Success looks like: logging an expense takes less time than opening a banking app.

### The Frugal Subscription-Avoider

**Dave, 41, Teacher**
*"I already pay for five subscriptions I forgot I had. I'm not adding a sixth to track that problem."*

- **Goals:** Track spending and stick to a budget without an ongoing monthly cost; set it up once and have it "just work" long-term.
- **Frustrations:** Frustrated that budgeting tools charge a subscription to manage money he's trying to save; has churned through multiple free-tier apps that eventually paywall core features.
- **Technical Comfort:** Low to moderate — happy to use an app someone else runs, as long as it's simple.
- **Relationship to the Product:** Primary end-user, cost-driven. Success looks like: no recurring bill, ever — and an app simple enough that he doesn't regret the switch from a paid one.

### The Invited Family Member

**Auntie Grace, 58, Retired Administrator**
*"Just tell me where to tap. And I don't want anyone else seeing what I spend."*

- **Goals:** Keep track of her own household spending with something her family has set up for her; see at a glance how this month compares to last.
- **Frustrations:** Finds most finance apps cluttered and intimidating; worries about who can see her information.
- **Technical Comfort:** Low — comfortable with WhatsApp and signing in with Google, but not much more.
- **Relationship to the Product:** Invited end-user with her own private account. Success looks like: she logs expenses without needing help, and trusts that her data is hers alone. Shared or family-wide budgets remain out of scope.

---

## Appendix B: Future / Out of Current Scope

Personas defined when the project was framed as a self-hosted, community-driven tool. Self-hosting is now a non-goal, but these are kept for reference should it return to scope.

### The Privacy-Conscious Home User

**Mei, 34, Product Manager**
*"I just don't want my spending habits sitting on someone else's server."*

- **Goals:** Track personal and household spending without exposing financial data to a third party; maintain full control over where her data lives and who can access it.
- **Frustrations:** Distrusts cloud-based finance apps, even ones with "bank-level encryption" claims; has looked into self-hosted alternatives before but found them either too barebones or too complex to set up.
- **Technical Comfort:** Moderate — comfortable following setup instructions and running a home server, but not a developer. Wants something she can install and mostly forget about.
- **Relationship to the Product:** Would require a self-hosted deployment with local inference. Not served by the hosted web app.

### The Self-Hoster / Homelab Enthusiast

**Priya, 29, DevOps Engineer**
*"If it doesn't have a docker-compose.yml, does it even count as self-hosted?"*

- **Goals:** Add expense tracking to an existing homelab stack alongside Plex, Home Assistant, etc.; wants clean, well-documented deployment and sensible defaults.
- **Frustrations:** Impatient with projects that claim to be "self-hostable" but assume a single specific OS or lack containerization; wants to inspect and, if needed, modify the stack (backend, DB, model) without fighting the architecture.
- **Technical Comfort:** High — can debug, contribute code, and adapt the deployment to her own infrastructure. Likely to raise GitHub issues or PRs.
- **Relationship to the Product:** Would require a self-hosted deployment option. Not served by the hosted web app.

### The Open Source Contributor

**Sam, 24, CS Student**
*"I want to see how far a local model can actually get with real-world messy text."*

- **Goals:** Contribute to a project with an interesting technical problem (local model inference, structured parsing from free-form text); build public portfolio work and learn from code review / collaboration.
- **Frustrations:** Bounces off projects with unclear contribution guidelines, no labeled "good first issue" tickets, or an unclear roadmap; loses motivation if PRs sit unreviewed.
- **Technical Comfort:** High — but may be new to some parts of the stack (e.g. hasn't used Ollama before). Learning-motivated as much as output-motivated.
- **Relationship to the Product:** Partly served by the CLI proof of concept, which still uses local inference. Community contribution is not a current focus.
