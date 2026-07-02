# Project Hercules — Project Plan

> Version 0.1 · Draft

## 1. Overview

Project Hercules is a self-hosted expense and budget tracker that uses a natural language interface, powered by a small language model, to remove the friction of manual expense entry. This plan translates the project charter into a working plan for contributors — covering the product vision, objectives, features, phases, and risks — as a community-driven, open project.

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

## 5. Feature Breakdown

A high-level look at the functional pieces of the system. These will be broken down further into individual backlog items as the project progresses.

- **Natural Language Input** — free-form text entry for logging an expense
- **NL Parsing Engine** — local model (Phi-4-mini via Ollama) that parses input into structured fields
- **Confirmation Screen** — editable review step before data is committed to the database
- **Expense Storage** — structured, queryable storage of logged expenses
- **Budget Tracking** — category-based budgets and tracking against them
- **Category Taxonomy** — a fixed, manageable set of expense categories
- **Export / Download** — ability to export a list of expenses (in lieu of built-in reports/dashboards)
- **Hosting & Deployment** — self-hosted setup on a home server (containerization approach TBD)

## 6. Milestones & Deliverables

Phased, sequential rather than dated — reflecting the open, community-driven pace of the project.

**Phase 1 — Foundation**
CLI/API-level natural language parsing working end-to-end, with manual database insertion. Proves out the core parsing approach.

**Phase 2 — Confirmation UI**
A usable interface for reviewing, editing, and confirming parsed expenses before saving.

**Phase 3 — Budgets & Queries**
Budget definitions by category, and the ability to query/report on spending via natural language or simple views.

**Phase 4 — Polish & Hosting**
Refinement of the experience, documentation for self-hosting, and a settled containerization/deployment approach.

## 7. Risks & Dependencies

- Containerize the app, or run natively on the home server?
- Always show the confirmation screen, or auto-save high-confidence entries?
- How should multi-item entries in a single input be handled (e.g. "coffee $4 and lunch $12")?
- The fixed category taxonomy still needs to be finalized
- Parsing reliability is dependent on the chosen small language model's performance on free-form, informal text

## 8. Review Checkpoints

This plan is a living document. It should be revisited:

- At the end of each phase, to confirm scope for the next
- Whenever a significant open question (see Risks & Dependencies) is resolved
- As new contributors join and priorities evolve, given the community-driven nature of the project
