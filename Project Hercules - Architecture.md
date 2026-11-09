# Project Hercules — Architecture: Web App v1

```
Version 0.13 · Draft
Last Reviewed: 9 November 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-10-26 | Lionel Lam | Initial architecture and decision record for the hosted web app |
| 0.2 | 2026-11-02 | Lionel Lam | Performance decisions: server moved to Vercel's Singapore region; screens keep loaded data in memory and refresh it in the background |
| 0.3 | 2026-11-02 | Lionel Lam | Interface decisions: moderately wider layout for tablets and computers; light and dark mode toggle |
| 0.4 | 2026-11-02 | Lionel Lam | Category management and monthly budgets brought forward; decision 17 superseded |
| 0.5 | 2026-11-07 | Lionel Lam | Spending pace against budget on Summary (decision 28) |
| 0.6 | 2026-11-07 | Lionel Lam | Corrections: system overview now lists the Categories screen; decision 8 records that the Hobby plan terms were confirmed |
| 0.7 | 2026-11-07 | Lionel Lam | Decision 18 covers editing from the Today list; decision 16 notes the UI mockup is historical |
| 0.8 | 2026-11-07 | Lionel Lam | Decision 24: the app widens to 920 pixels from 1,024-pixel windows and 1,000 pixels from 1,280-pixel windows |
| 0.9 | 2026-11-08 | Lionel Lam | Retiring and restoring categories (decision 29); decision 26's deferral of retiring superseded |
| 0.10 | 2026-11-08 | Lionel Lam | In-app confirmation sheets, Undo, and a check before discarding unsaved changes (decision 30) |
| 0.11 | 2026-11-08 | Lionel Lam | Decision 23: the app no longer requests the current month's Summary totals, which were unused |
| 0.12 | 2026-11-08 | Lionel Lam | Decision 31: how the web app's code is organised |
| 0.13 | 2026-11-09 | Lionel Lam | Decision 32: History search filters the selected month on the device |

---

## 1. Purpose

Record the architecture of the Project Hercules web app (Phase 2 — Web App v1) and the decisions behind it, so the reasons remain clear as the project evolves. Each decision lists the option chosen and the main reason; superseded decisions should be struck through rather than deleted.

## 2. System Overview

```
 ┌──────────────────────────┐
 │  Phone (PWA, Safari)     │
 │  Log · History ·         │
 │  Summary · Categories    │
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
| 5 | **Anthropic, Claude Haiku 5.5** (`claude-haiku-5-5`), with structured outputs | Fast and inexpensive (US$0.10 / US$0.50 per million input/output tokens); simple extraction is well within its abilities; structured outputs guarantee valid JSON, removing parse failures seen with the local model. Swapping models later is a configuration change. Gemini's free tier was considered (26 Oct 2026) but not chosen: its terms allow free-tier inputs to be used to improve Google's products, conflicting with decision 4, while Haiku's expected cost is only around US$0.10/month |
| 6 | **Cloud model only** for the web app | A cloud-hosted app cannot reach Ollama on a home machine. The parser code is kept tidy enough to add another backend later |
| 7 | **Cost guards:** US$5/month spend limit on the Anthropic account; 100 parses per user per day in the app | Normal use costs cents per month; the limits protect against bugs or misuse |

### 3.3 Hosting and data

| # | Decision | Reason |
|---|---|---|
| 8 | **Vercel** for hosting | Strong fit for a TypeScript / Next.js app; free Hobby plan suits a personal, non-commercial family app (terms confirmed 2 November 2026: Hobby plan active, no payment method on file) |
| 9 | **Free Vercel address** (`*.vercel.app`) for now | No cost; Google sign-in works with it; a custom domain can be added later without code changes |
| 10 | **Neon** (hosted Postgres) | SQLite cannot persist on Vercel. Neon is plain Postgres designed for serverless hosts, available through Vercel's marketplace with a free tier |
| 11 | **One-off import** of existing CLI data into the owner's account | Keeps the full spending history (July 2026 onwards) in one place from day one |
| 12 | **CLI stays separate** — local SQLite and Phi-4, unchanged | Remains a lightweight, offline, experimental tool (e.g. for trying prompt changes). The web app is the main record; entries logged in the CLI after the import are not synced |
| 22 | **Server runs in Vercel's Singapore region** (`sin1`, set in `web/vercel.json`) | Puts the server next to the Neon database (`ap-southeast-1`) and the app's users. Vercel's default (`iad1`, US East) sent each signed-in request across the Pacific and back, plus again for each database lookup |

### 3.4 Application

| # | Decision | Reason |
|---|---|---|
| 13 | **TypeScript with Next.js** for frontend and backend | Best fit for Vercel; one language across the app. The Python parser prompt is reused and ported (mostly the prompt plus one API call) |
| 14 | **Progressive Web App (PWA)** | Installs on the phone's home screen and opens full-screen like an app, without App Store distribution or fees |
| 15 | **No offline logging** in v1 | Parsing needs the network. When offline, the app shows a clear message and keeps the typed text |
| 23 | **Loaded data kept in memory, refreshed in the background** | Switching tabs is instant: screens show the last-loaded data while a fresh copy loads, and the app loads this month's expenses and last month's Summary totals when it opens. The current month's Summary is worked out on the device from this month's expenses (needed for spending pace anyway), so the server's totals are only requested for past months. Any save, edit or delete reloads everything held. Nothing is stored on the device, so data is gone when the app closes. Server-side caching was not used because the allow-list is re-checked on every request, so that removing someone takes effect immediately |
| 24 | **Moderately responsive layout:** phone layout up to 767 pixels wide; from 768 pixels, the app is up to 820 pixels wide, widening to 920 pixels from 1,024-pixel windows (iPad held sideways, small laptops) and 1,000 pixels from 1,280-pixel windows, with two columns on Log and Summary and edit sheets as centred dialogs | Makes good use of a tablet or computer screen without a separate desktop design. The bottom tab bar stays at every width, so there is one way to navigate. The two wider steps (7 November 2026) leave less of a laptop window empty while keeping the burn-up chart's text a comfortable size, since it scales with the chart's width |
| 25 | **Light and dark mode toggle**, following the device's setting until first used; the choice is saved per device in the browser | One tap on every main screen. It is a display preference, not personal data, so it does not need the database or need to follow the user between devices |
| 30 | **In-app confirmation sheet** instead of the phone's built-in prompt, used before deleting an expense, retiring a category, and discarding unsaved changes; **Undo** for about five seconds after deleting or retiring | The built-in prompt can't be styled and is switched off in some browsers, including the test browser built into the Claude app, where it silently answered "Cancel". Undo gives deleting an in-app way back, which it didn't have; confirmation and Undo are both used because a delete is easy to tap by mistake. Undo needs only a small "restore" route for expenses, since deletes are already soft. Discarding asks only when something changed, so prompts keep their meaning. Duplicate and unusual-value warnings were mocked up at the same time and left for later |
| 31 | **Code organised by role:** one file per screen in `web/components/screens/`, shared pieces (confirmation sheet, edit sheet, pace chart, pie chart) beside them in `web/components/`, and plain logic in `web/lib/`: `types.ts` (Category, Expense and Summary row shapes), `dates.ts` (date checks and formatting), `pace.ts` (spending pace maths) and `client.ts` (fetching, in-memory cache and money formatting). `types.ts`, `dates.ts` and `pace.ts` are used by both the server and the screens; database code stays server-only | The single screen file had grown past 1,000 lines. Splitting it by role makes each part easy to find, keeps one definition of each data shape and date rule, and leaves the pace and date logic in plain files that can be tested on their own. No change to behaviour |
| 32 | **History search filters the selected month on the device**, with each keystroke; changing month or leaving History clears it | The month's expenses are already loaded for the list, so filtering them is instant and needs no new server route or database index. Searching all months at once was mocked up and set aside: it would need a server search and respond only after a pause in typing |

### 3.5 First-version scope

| # | Decision | Reason |
|---|---|---|
| 16 | **Screens:** Google sign-in, Log, History, Summary | Matches the UI mockup (`design/ui-mockup.html`); gets a working app into use quickly. The mockup is a historical record of this October 2026 design; the app has since gained a Categories tab, budgets and spending pace |
| ~~17~~ | ~~**Per-user categories**, each new user seeded with the 14 default categories; changes made directly in the database; no management screen~~ *Superseded by decision 26* | The database matches the Specification's per-user Category model from the start, so a management screen can be added later without schema changes |
| 18 | **Edit and soft delete** from History (and, since Specification v0.8, from the Log screen's Today list), reusing the review card | No new screen needed. Soft delete (`deleted_at`) keeps records recoverable, in line with the audit-friendly principle |
| 19 | **SGD only** | Nearly all expenses are in SGD; currency is still stored per expense, but summaries do not convert |
| 26 | **Categories screen** to add and rename per-user categories, as a fourth tab. ~~Retiring and deleting are left out for now~~ *Retiring added by decision 29*; each new user is still seeded with the 14 defaults | Expenses link to categories by ID, so renames carry through history, and the parser reads the live list. ~~Retiring needs more work: an older expense in a retired category must still open and save correctly in the edit sheet~~ |
| 27 | **Optional monthly budget per category**, stored as `categories.monthly_budget` rather than a separate table; Summary shows "x of budget" and a bar of the budget used for the current month only | The simplest start on Phase 3 budgets. Only the current amount is kept, so past months are not compared against budgets. A separate table can replace the column if budget history is needed |
| 28 | **Spending pace on Summary**, current month only: an expected-by-today marker and note on each budgeted bar, and a burn-up chart on tap, worked out in the app from the month's expense list and categories | Answers "am I spending faster than my budget allows?" without a new screen. Linear pro-rata is simple and predictable; red stays reserved for over budget, since spending early (such as rent on day 1) isn't overspending. No month-end forecast, as it is badly wrong early in the month and for one-off spends. No server or database changes |
| 29 | **Retire and restore categories** using the existing `categories.is_active` flag; no permanent delete. Retired categories are hidden from new expenses and the parser, listed in a collapsed "Retired" group with Restore, and can't be renamed while retired. Re-adding a retired name restores it. An expense already in a retired category can still be edited and saved, keeping that category. "Other" can't be retired. No text copy of the category name is stored on expenses | Past expenses keep their category, since the row is never removed, and restoring is one tap. A permanent delete would fail anyway for any category an expense refers to, including deleted expenses. A copied name on each expense was considered and rejected: categories are never removed, so the joined name always resolves, and a copy would either show old names after a rename (against decision 26) or need rewriting on every rename. No database migration was needed |

### 3.6 Process

| # | Decision | Reason |
|---|---|---|
| 20 | **Documents updated before code** (Charter v0.5, Project Plan v0.6, Specification v0.7, this document v0.1) | Keeps documentation and implementation aligned |
| 21 | **Decisions made by Lionel Lam** | James Wong may review later |

## 4. Framing

With these decisions, Project Hercules is framed as a **hosted, invite-only family app**. Self-hosting and local inference — the original framing — are moved to non-goals and possible future options. The personas that depended on them are kept for reference in the Project Plan (Appendix B).

## 5. Known Gaps and Follow-ups

- ~~Update the UI mockup's sign-in button from Apple to Google~~ — *Done (26 October 2026)*
- ~~Confirm Vercel Hobby plan terms on sign-up~~ — *Done (2 November 2026): Hobby plan active with no payment method on file; terms confirmed as suitable for a private, non-commercial family app*
- ~~Decide how the allow-list is stored (environment configuration or a database table) during implementation~~ — *Decided (26 October 2026): an `allowed_emails` database table, managed with `npm run allow`, so invitations don't require a redeploy*
- Allow-list administration and export are deferred to Phase 4 (retiring categories was delivered early: decision 29)
- Budget history, alerts and fuller budget tracking remain in Phase 3
