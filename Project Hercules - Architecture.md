# Project Hercules — Architecture: Web App v1

```
Version 0.1 · Draft
Last Reviewed: 26 October 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-10-26 | Lionel Lam | Initial architecture and decision record for the hosted web app |

---

## 1. Purpose

Record the architecture of the Project Hercules web app (Phase 2 — Web App v1) and the decisions behind it, so the reasons remain clear as the project evolves. Each decision lists the option chosen and the main reason; superseded decisions should be struck through rather than deleted.

## 2. System Overview

```
 ┌──────────────────────────┐
 │  Phone (PWA, Safari)     │
 │  Log · History · Summary │
 └────────────┬─────────────┘
              │ HTTPS
 ┌────────────▼─────────────┐        ┌──────────────────────────┐
 │  Next.js app on Vercel   │───────▶│  Google sign-in          │
 │  (TypeScript)            │        │  (allow-list checked     │
 │  - pages / UI            │        │   by the app)            │
 │  - API routes            │        └──────────────────────────┘
 │  - allow-list & limits   │
 │                          │        ┌──────────────────────────┐
 │                          │───────▶│  Anthropic API           │
 │                          │        │  Claude Haiku 5.5        │
 │                          │        │  (parse only)            │
 │                          │        └──────────────────────────┘
 │                          │
 │                          │        ┌──────────────────────────┐
 │                          │───────▶│  Neon (Postgres)         │
 └──────────────────────────┘        │  users · categories ·    │
                                     │  expenses                │
                                     └──────────────────────────┘

 Separate, local only:  Python CLI → Phi-4 via Ollama → SQLite
```

The language model is called only to parse a single expense into structured fields. All other logic — sign-in checks, validation, storage, retrieval, edits, and usage limits — is deterministic application code, in line with the Specification's AI boundary.

## 3. Decision Record

### 3.1 Users and access

| # | Decision | Reason |
|---|---|---|
| 1 | **Users:** family members and close friends only | The app meets a personal and family need; it is not a public product |
| 2 | **Allow-list** of invited email addresses | Keeps access limited to known people even though anyone can attempt Google sign-in |
| 3 | **Google sign-in only** | Free, familiar, and works on both iPhone and Android. Sign in with Apple was considered but requires a paid Apple Developer Program membership (US$99/year) |

### 3.2 Language model and privacy

| # | Decision | Reason |
|---|---|---|
| 4 | **Expense text may be sent to a cloud model provider**, using a provider whose API data is not used for training | Enables a hosted app without running inference at home. Accepted trade-off against the earlier local-only privacy stance |
| 5 | **Anthropic, Claude Haiku 5.5** (`claude-haiku-5-5`), with structured outputs | Fast and inexpensive (US$0.10 / US$0.50 per million input/output tokens); simple extraction is well within its abilities; structured outputs guarantee valid JSON, removing parse failures seen with the local model. Swapping models later is a configuration change |
| 6 | **Cloud model only** for the web app | A cloud-hosted app cannot reach Ollama on a home machine. The parser code is kept tidy enough to add another backend later |
| 7 | **Cost guards:** US$5/month spend limit on the Anthropic account; 100 parses per user per day in the app | Normal use costs cents per month; the limits protect against bugs or misuse |

### 3.3 Hosting and data

| # | Decision | Reason |
|---|---|---|
| 8 | **Vercel** for hosting | Strong fit for a TypeScript / Next.js app; free Hobby plan suits a personal, non-commercial family app (terms to be checked on sign-up) |
| 9 | **Free Vercel address** (`*.vercel.app`) for now | No cost; Google sign-in works with it; a custom domain can be added later without code changes |
| 10 | **Neon** (hosted Postgres) | SQLite cannot persist on Vercel. Neon is plain Postgres designed for serverless hosts, available through Vercel's marketplace with a free tier |
| 11 | **One-off import** of existing CLI data into the owner's account | Keeps the full spending history (July 2026 onwards) in one place from day one |
| 12 | **CLI stays separate** — local SQLite and Phi-4, unchanged | Remains a lightweight, offline, experimental tool (e.g. for trying prompt changes). The web app is the main record; entries logged in the CLI after the import are not synced |

### 3.4 Application

| # | Decision | Reason |
|---|---|---|
| 13 | **TypeScript with Next.js** for frontend and backend | Best fit for Vercel; one language across the app. The Python parser prompt is reused and ported (mostly the prompt plus one API call) |
| 14 | **Progressive Web App (PWA)** | Installs on the phone's home screen and opens full-screen like an app, without App Store distribution or fees |
| 15 | **No offline logging** in v1 | Parsing needs the network. When offline, the app shows a clear message and keeps the typed text |

### 3.5 First-version scope

| # | Decision | Reason |
|---|---|---|
| 16 | **Screens:** Google sign-in, Log, History, Summary | Matches the UI mockup (`design/ui-mockup.html`); gets a working app into use quickly |
| 17 | **Per-user categories**, each new user seeded with the 14 default categories; changes made directly in the database; no management screen | The database matches the Specification's per-user Category model from the start, so a management screen can be added later without schema changes |
| 18 | **Edit and soft delete** from History, reusing the review card | No new screen needed. Soft delete (`deleted_at`) keeps records recoverable, in line with the audit-friendly principle |
| 19 | **SGD only** | Nearly all expenses are in SGD; currency is still stored per expense, but summaries do not convert |

### 3.6 Process

| # | Decision | Reason |
|---|---|---|
| 20 | **Documents updated before code** (Charter v0.5, Project Plan v0.6, Specification v0.7, this document v0.1) | Keeps documentation and implementation aligned |
| 21 | **Decisions made by Lionel Lam** | James Wong may review later |

## 4. Framing

With these decisions, Project Hercules is framed as a **hosted, invite-only family app**. Self-hosting and local inference — the original framing — are moved to non-goals and possible future options. The personas that depended on them are kept for reference in the Project Plan (Appendix B).

## 5. Known Gaps and Follow-ups

- ~~Update the UI mockup's sign-in button from Apple to Google~~ — *Done (26 October 2026)*
- Confirm Vercel Hobby plan terms on sign-up
- Decide how the allow-list is stored (environment configuration or a database table) during implementation
- Allow-list administration, category management, and export are deferred to Phase 4
