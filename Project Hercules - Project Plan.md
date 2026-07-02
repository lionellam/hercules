# Project Hercules — Project Plan

```
Version 0.1 · Draft 
Last Reviewed: 02 July 2026
Assembled with the use of Claude
```

## 1. Overview

Project Hercules is web-based, open source, self-hosted expense and budget tracker that uses a natural language interface, powered by a Small Language Model (SLM), to remove the friction of manual expense entry. This plan translates the project charter into a working plan for contributors — covering the product vision, objectives, features, phases, and risks — as a community-driven, open project.

## 2. Product Vision

**Elevator Statement**

> For home users who want to track spending without the hassle of manual data entry or recurring subscription costs, Project Hercules is a self-hosted expense tracker that lets you log and query expenses in plain language. Unlike commercial tools like YNAB, Project Hercules runs entirely on your own hardware, keeps your financial data private, and is free and open source.

**Vision Box**

- Log an expense the way you'd tell a friend — *"spent $12 on lunch"* — no forms, no dropdowns, no friction.
- Your data never leaves your home server.
- No subscriptions, no accounts, no ads.
- Built by and for people who want a simple, private, open alternative to commercial budgeting apps.
- Confirm before it's saved — you're always in control of what gets recorded.

## 3. Problem Statement

Friction of maintaining an up-to-date expense and budget log can be due to the fiddly and cumbersome nature of some expense tracker apps. This project aims to reduce this friction by employing a natural language interface. For personal and home use, this project aims to deliver a working solution without the expense of recurring subscriptions that is pervasive of the competing alternatives (i.e. YNAB, etc.) available on the market.

## 4. Project Objectives

- Enable natural language expense entry that is parsed into structured, storable data
- Provide a human-in-the-loop confirmation step before any data is saved
- Support budget and expense tracking by category
- Run entirely self-hosted / on-premises, with no cloud dependency
- Keep the project free, open, and easy for others to run on their own hardware
- Achieve reliable parsing (target: less than 10% of entries require manual correction)
- To demonstrate the viability of the CPMAI framework in conceiving of and developing cognitive projects.

## 5. Feature Breakdown

> Feature priorities are grounded in the target personas — see [Appendix A: Personas](#appendix-a-personas).

A high-level look at the functional pieces of the system. These will be broken down further into individual backlog items as the project progresses. 

- **Natural Language Input** — free-form text entry for logging an expense
- **NL Parsing Engine** — local model (Phi-4-mini via Ollama) that parses input into structured fields
- **Confirmation Screen** — editable review step before data is committed to the database
- **Expense Storage** — structured, queryable storage of logged expenses
- **Budget Tracking** — category-based budgets and tracking against them
- **Category Taxonomy** — a fixed, manageable set of expense categories
- **Export / Download** — ability to export a list of expenses (in lieu of built-in reports/dashboards)
- **Hosting & Deployment** — self-hosted setup on a home server (containerization approach TBD)

## 6. Milestones & Deliverables (To be reviewed)

Phased, sequential rather than dated — reflecting the open, community-driven pace of the project.

**Phase 1 — Foundation**
CLI/API-level natural language parsing working end-to-end, with manual database insertion. Proves out the core parsing approach.

**Phase 2 — Confirmation UI**
A usable interface for reviewing, editing, and confirming parsed expenses before saving.

**Phase 3 — Budgets & Queries**
Budget definitions by category, and the ability to query/report on spending via natural language or simple views.

**Phase 4 — Polish & Hosting**
Refinement of the experience, documentation for self-hosting, and a settled containerization/deployment approach.

## 7. Risks, Dependencies and Open Questions

- Containerize the app, or run natively on the home server? To preserve portability.
- Always show the confirmation screen, or auto-save high-confidence entries?
- How should multi-item entries in a single input be handled (e.g. "coffee $4 and lunch $12")?
- The fixed category taxonomy still needs to be finalized
- Parsing reliability is dependent on the chosen small language model's performance on free-form, informal text

## 8. Review Checkpoints

This plan is a living document. It should be revisited:

- At the end of each phase, to confirm scope for the next
- Whenever a significant open question (see Risks & Dependencies) is resolved
- As new contributors join and priorities evolve, given the community-driven nature of the project

---

## Appendix A: Personas

A set of representative users and contributors the project is designed for. These help ground feature decisions and prioritization in real needs.

### The Privacy-Conscious Home User

**Mei, 34, Product Manager**
*"I just don't want my spending habits sitting on someone else's server."*

- **Goals:** Track personal and household spending without exposing financial data to a third party; maintain full control over where her data lives and who can access it.
- **Frustrations:** Distrusts cloud-based finance apps, even ones with "bank-level encryption" claims; has looked into self-hosted alternatives before but found them either too barebones or too complex to set up.
- **Technical Comfort:** Moderate — comfortable following setup instructions and running a home server, but not a developer. Wants something she can install and mostly forget about.
- **Relationship to the Product:** Primary end-user. Success looks like: data never leaves her network, and the app is trustworthy enough that she checks it daily without a second thought.

### The Frugal Subscription-Avoider

**Dave, 41, Teacher**
*"I already pay for five subscriptions I forgot I had. I'm not adding a sixth to track that problem."*

- **Goals:** Track spending and stick to a budget without an ongoing monthly cost; set it up once and have it "just work" long-term.
- **Frustrations:** Frustrated that budgeting tools charge a subscription to manage money he's trying to save; has churned through multiple free-tier apps that eventually paywall core features.
- **Technical Comfort:** Low to moderate — willing to follow a guided setup (e.g. a Docker Compose file) but not going to debug dependency issues. Self-hosting is a means to an end (free), not a hobby.
- **Relationship to the Product:** Primary end-user, cost-driven. Success looks like: no recurring bill, ever — and a setup simple enough that he doesn't regret the switch from a paid app.

### The Self-Hoster / Homelab Enthusiast

**Priya, 29, DevOps Engineer**
*"If it doesn't have a docker-compose.yml, does it even count as self-hosted?"*

- **Goals:** Add expense tracking to an existing homelab stack alongside Plex, Home Assistant, etc.; wants clean, well-documented deployment and sensible defaults.
- **Frustrations:** Impatient with projects that claim to be "self-hostable" but assume a single specific OS or lack containerization; wants to inspect and, if needed, modify the stack (backend, DB, model) without fighting the architecture.
- **Technical Comfort:** High — can debug, contribute code, and adapt the deployment to her own infrastructure. Likely to raise GitHub issues or PRs.
- **Relationship to the Product:** Power user and potential contributor. Success looks like: it slots cleanly into her existing setup, and the codebase is approachable enough to tinker with.

### The Busy / Mobile-First Logger

**Jordan, 26, Nurse**
*"I'm not typing into six fields while I'm still holding my coffee."*

- **Goals:** Log expenses in the moment — while walking, in a queue, between tasks — with minimal friction; trust that a quick, casual sentence gets recorded accurately.
- **Frustrations:** Abandons expense tracking within a week or two because manual entry feels like a chore; screen-constrained mobile forms (dropdowns, date pickers) feel disproportionately slow for something as simple as "I bought coffee."
- **Technical Comfort:** Low to moderate — not going to self-host it themselves, but happy to use an instance a partner or roommate (like Priya) has already set up.
- **Relationship to the Product:** Primary day-to-day end-user, and the persona the original problem statement was written around. Success looks like: logging an expense takes less time than opening a banking app.

### The Open Source Contributor

**Sam, 24, CS Student**
*"I want to see how far a 3.8B model can actually get with real-world messy text."*

- **Goals:** Contribute to a project with an interesting technical problem (local SLM inference, structured parsing from free-form text); build public portfolio work and learn from code review / collaboration.
- **Frustrations:** Bounces off projects with unclear contribution guidelines, no labeled "good first issue" tickets, or an unclear roadmap; loses motivation if PRs sit unreviewed.
- **Technical Comfort:** High — but may be new to some parts of the stack (e.g. hasn't used Ollama before). Learning-motivated as much as output-motivated.
- **Relationship to the Product:** Not necessarily an end-user yet — motivated by the build itself. Success looks like: clear docs, a welcoming project structure, and visible impact from their contributions.

### Out of Scope: The Household / Family Budgeter

Someone managing a shared household or family budget across multiple people would want multi-user support, shared visibility, and permissions — all explicitly listed as Non-Goals in the charter. Included here as a boundary marker, not a target persona, so it doesn't quietly creep into scope later.