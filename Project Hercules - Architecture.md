# Project Hercules — Architecture: Web App v1

```
Version 0.29 · Draft
Last Reviewed: 14 November 2026
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
| 0.14 | 2026-11-09 | Lionel Lam | Decision 24: text fields use 16-pixel text on phones, so Safari doesn't zoom in when one is tapped |
| 0.15 | 2026-11-09 | Lionel Lam | Decision 33: a Settings tab replaces the Categories tab; decisions 25 and 26 updated |
| 0.16 | 2026-11-09 | Lionel Lam | Decision 30: signing out also asks for confirmation. Decision 23: signing out clears everything held in memory |
| 0.17 | 2026-11-09 | Lionel Lam | Decision 34: semantic versioning, starting at 1.0.0, with a changelog and Git tags |
| 0.18 | 2026-11-09 | Lionel Lam | Decision 35: monthly CSV download from Summary; export delivered ahead of Phase 4 |
| 0.19 | 2026-11-09 | Lionel Lam | Integrity check: system overview lists the Settings tab |
| 0.20 | 2026-11-10 | Lionel Lam | Decision 35: the iPhone home-screen app shares the CSV through the share sheet |
| 0.21 | 2026-11-10 | Lionel Lam | Decision 35: the prepared CSV is kept while the app is open and refreshed only after changes |
| 0.22 | 2026-11-10 | Lionel Lam | Integrity check: decision 35's original reason about the home-screen app marked as superseded |
| 0.23 | 2026-11-13 | Lionel Lam | Decision 36: default currency per person, applied by the server when parsing; decision 19 updated |
| 0.24 | 2026-11-13 | Lionel Lam | Decision 36: totals count only the default currency; others shown as not included; switching asks first |
| 0.25 | 2026-11-14 | Lionel Lam | Decision 37: each parse records how long its steps took, to find what slows parsing down |
| 0.26 | 2026-11-14 | Lionel Lam | Known Gaps: change the live database address to `sslmode=verify-full` before upgrading to pg 9 |
| 0.27 | 2026-11-14 | Lionel Lam | Decision 38: the review card after Parse opens in a sheet, reusing the edit sheet; Known Gaps: sheet animation |
| 0.28 | 2026-11-14 | Lionel Lam | Decision 38 updated: pencil and calendar icons on both sheets; the date sits flush right in Safari |
| 0.29 | 2026-11-14 | Lionel Lam | Accuracy review: decision 38's "›" marked superseded; decisions 16, 24, 25, 30, 31 and 33 brought up to date; system overview lists every database table |

---

## 1. Purpose

Record the architecture of the Project Hercules web app (Phase 2 — Web App v1) and the decisions behind it, so the reasons remain clear as the project evolves. Each decision lists the option chosen and the main reason; superseded decisions should be struck through rather than deleted.

## 2. System Overview

```
 ┌──────────────────────────┐
 │  Phone (PWA, Safari)     │
 │  Log · History ·         │
 │  Summary · Settings      │
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
                                     │  expenses ·              │
                                     │  allowed_emails ·        │
                                     │  parse_events            │
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
| 23 | **Loaded data kept in memory, refreshed in the background** | Switching tabs is instant: screens show the last-loaded data while a fresh copy loads, and the app loads this month's expenses and last month's Summary totals when it opens. The current month's Summary is worked out on the device from this month's expenses (needed for spending pace anyway), so the server's totals are only requested for past months. Any save, edit or delete reloads everything held. Nothing is stored on the device, so data is gone when the app closes. Signing out reloads the page fully, and the app is tied to the person signed in, so nothing held in memory carries over to whoever signs in next on the same browser (9 November 2026: the framework otherwise keeps a page's state when navigating away and back). Server-side caching was not used because the allow-list is re-checked on every request, so that removing someone takes effect immediately |
| 24 | **Moderately responsive layout:** phone layout up to 767 pixels wide; from 768 pixels, the app is up to 820 pixels wide, widening to 920 pixels from 1,024-pixel windows (iPad held sideways, small laptops) and 1,000 pixels from 1,280-pixel windows, with two columns on Log and Summary and sheets (editing an expense and, since 1.3.0, the review after Parse) as centred dialogs | Makes good use of a tablet or computer screen without a separate desktop design. The bottom tab bar stays at every width, so there is one way to navigate. The two wider steps (7 November 2026) leave less of a laptop window empty while keeping the burn-up chart's text a comfortable size, since it scales with the chart's width. On phones, every text field uses text of at least 16 pixels (9 November 2026), because Safari on iPhone zooms in on smaller text when a field is tapped and doesn't zoom back out; stopping zoom altogether was avoided, as it would also block pinch-to-zoom |
| 25 | **Light and dark mode**, following the device's setting until changed; the choice is saved per device in the browser. *Since decision 33, chosen in Settings (System, Light or Dark) instead of an icon on every screen* | ~~One tap on every main screen.~~ *Superseded by decision 33: the choice is now in Settings.* It is a display preference, not personal data, so it does not need the database or need to follow the user between devices |
| 30 | **In-app confirmation sheet** instead of the phone's built-in prompt, used before deleting an expense, retiring a category, discarding unsaved changes, (since 9 November 2026, at the owner's request) signing out, and (since 1.2.1) switching the default currency; **Undo** for about five seconds after deleting or retiring | The built-in prompt can't be styled and is switched off in some browsers, including the test browser built into the Claude app, where it silently answered "Cancel". Undo gives deleting an in-app way back, which it didn't have; confirmation and Undo are both used because a delete is easy to tap by mistake. Undo needs only a small "restore" route for expenses, since deletes are already soft. Discarding asks only when something changed, so prompts keep their meaning. Duplicate and unusual-value warnings were mocked up at the same time and left for later |
| 31 | **Code organised by role:** one file per screen in `web/components/screens/`, shared pieces (confirmation sheet, review card, edit sheet, currency picker, pace chart, pie chart) beside them in `web/components/`, and plain logic in `web/lib/`: `types.ts` (Category, Expense and Summary row shapes), `dates.ts` (date checks and formatting), `pace.ts` (spending pace maths), `client.ts` (fetching, in-memory cache and money formatting), `currencies.ts` (the 20 currencies and the rules for reading a currency from the text, since decision 36) and `csv.ts` (building the CSV file, since decision 35). `types.ts`, `dates.ts` and `currencies.ts` are used by both the server and the screens, and `pace.ts` by the screens only; database, parsing and sign-in code stays server-only (*corrected 14 November 2026: `pace.ts` was listed as shared*) | The single screen file had grown past 1,000 lines. Splitting it by role makes each part easy to find, keeps one definition of each data shape and date rule, and leaves the pace and date logic in plain files that can be tested on their own. No change to behaviour |
| 32 | **History search filters the selected month on the device**, with each keystroke; changing month or leaving History clears it | The month's expenses are already loaded for the list, so filtering them is instant and needs no new server route or database index. Searching all months at once was mocked up and set aside: it would need a server search and respond only after a pause in typing |
| 33 | **Settings tab** in place of the Categories tab, as a short menu: Categories & budgets (opening as its own page with a way back), Appearance (System, Light or Dark), Account (email and Sign out), and the app's version and last-updated time. The version comes from `web/package.json` with the short commit ID, and the time is when the running version was built, both fixed at build time. *Since decision 36 (1.2.0), a Currency row sits under Categories & budgets; since 1.2.3, the version line sits at the bottom of the screen, just above the tab bar* | Gathers set-and-forget options in one place, as people expect from other apps, and frees the tab bar for the things used daily. A menu rather than one long page leaves room to add settings later. Moving the theme choice off every screen tidies the headers and adds a System option. A user guide link was considered and left out at the owner's request |
| 34 | **Semantic versioning** for the web app, starting at **1.0.0** on 9 November 2026: **major** for a change in how the app fundamentally works or a change to existing data that can't be undone; **minor** for a new feature people will notice; **patch** for a fix or small tweak; no change for updates to documents alone. The version in `web/package.json` is bumped in the same commit as the change, each release is tagged in Git (`v1.0.0`) after it's pushed, and `CHANGELOG.md` gets a short plain-English entry. Settings shows the version with the commit and build time | The number now says what kind of change a release was, and the tag marks exactly which code it was, which helps if a release ever needs rolling back. The app had been live since 1 November at 0.1.0, which undersold it. The commit and build time stay alongside so two deploys with the same version can still be told apart. Calendar versions and automatic build numbers were considered: less effort, but they say nothing about the size of a change |
| 35 | **Monthly CSV download** from Summary, through a server route (`GET /api/expenses/export?month=YYYY-MM`) that returns the month's expenses as a CSV attachment; the button sits beside the month's total and follows the month selected. Text that could be read as a spreadsheet formula is prefixed with an apostrophe | ~~A file sent by the server downloads reliably on phones, including the home-screen app, where files built in the browser can fail to save on iPhone.~~ *Superseded by the 1.1.1 update below: in the iPhone home-screen app, a download from the server also got stuck.* Building the file on the server keeps its rules in one place. Building it on the server also lets the file include fields the screens don't load, such as when each expense was logged. The formula guard matters because the file contains text people typed. Placement beside the total was chosen over an icon in the heading or a button at the bottom of Summary. *Updated 10 November 2026 (1.1.1):* in the iPhone home-screen app a download replaced the app's window with no way back, so there the file is fetched in advance and handed to the share sheet (Web Share API with a file) instead; opening the download in a separate window was the simpler alternative but still showed the preview first. *Updated 10 November 2026 (1.1.2):* the prepared file is kept in memory while the app is open and fetched again only after a change made in the app (any save, edit, delete or category change), instead of on every Summary visit; building the file on the device was considered and rejected, as it would duplicate the file's rules on the phone and the server |
| 36 | **Default currency per person**, stored as `users.default_currency` (default `SGD`) and chosen in Settings from a fixed list of 20 currencies. The language model returns a currency only when the text names one; the server fills in the default, resolves a plain `$` or `¥` against it, and only accepts USD when the text mentions US dollars. The review card gets a currency picker, and budget labels, the code shown in lists and the sign on totals ("$" for a dollar currency, otherwise the code) follow the default. *Updated 13 November 2026 (1.2.1):* totals, budgets, pace and the pie chart count only expenses in the default currency, with other currencies listed beside them as "Not included", and switching the default asks first; 1.2.0 had added every currency together and relabelled the sum. Last month's Summary totals are grouped by currency on the server for the same reason. No conversion between currencies | The model sometimes read a plain "$" as US dollars, and the review card offered no way to change it. Deciding the default in code rather than in the prompt makes it certain, and costs nothing extra. Storing it on the account rather than the device keeps parsing (on the server) and every device consistent. A free choice of any currency, or conversion at exchange rates, was set aside as more than is needed |
| 37 | **Parse timing:** each parse measures how long its steps take (sign-in check, daily-limit check, loading categories, the language model call, and the total) and records them two ways: a `Server-Timing` header on the response, visible in a browser's developer tools, and one line in the server log (Vercel's logs in production) with the same timings, the model used, and the number of input and output tokens. The log line never includes the expense text, the parsed details or who parsed it. Added in 1.2.4 | Parsing feels slow, and nothing yet showed where the time goes. Measuring first means any speed-up is chosen from evidence. Timings from the live app are what count, as the local app reaches Anthropic over a different connection. A separate timing table in the database was considered and set aside: the logs and header are enough for a short investigation, need no schema change, and keep no new data about people |
| 38 | **Review after Parse in a sheet:** the Log screen's review card opens in the same bottom sheet used to edit a saved expense (a centred dialog on wider screens), over the darkened Log screen, instead of sitting in the page below the text box. It keeps today's wording ("Review before saving", the typed text in quotes, "Discard"), ~~adds a "›" to each line~~ *(superseded by the 1.3.1 update below: a pencil or a calendar beside each line)*, and has two full-width buttons, **Save expense** and **Discard**. Tapping outside does the same as Discard, asking first if a detail was changed; "Discard your edits?" drops its explanation text and keeps its red Discard button. No handle and no animation. The edit sheet keeps **Save** (and, since 1.3.1, has the same icons) | In the page, the card looked like one more section of the screen, so it wasn't clear it needed an answer. A sheet over a darkened screen makes the next step plain, and reusing the edit sheet keeps one pattern for both and adds little code. Options considered in `design/review-card-mockups.html`: a stronger card in place (A), the same with the rest of the screen faded (B), and a sheet (C), chosen by Lionel. New wording such as "Check the details, then save" and a "Not saved yet" tag were set aside in favour of today's wording. A drag handle was left out because the app's sheets can't be dragged, so it would suggest a gesture that does nothing. *Updated 14 November 2026 (1.3.1):* the "›" is replaced by a pencil beside Category, Merchant and Remarks and a calendar beside Date, on both the review sheet and the edit sheet, so the two match; the amount has no icon. The icons are drawn by the app, as the browser's own date icon shows on computers but not in Safari on iPhone. Safari also ignored the date's right alignment, so the date gets a Safari-specific rule to sit flush right. A ▾ on Category (as on the currency) was considered; Lionel kept the pencil |

### 3.5 First-version scope

| # | Decision | Reason |
|---|---|---|
| 16 | **Screens:** Google sign-in, Log, History, Summary | Matches the UI mockup (`design/ui-mockup.html`); gets a working app into use quickly. The mockup is a historical record of this October 2026 design; the app has since gained budgets, spending pace, and a Settings tab (decision 33) holding Categories & budgets, which began as a Categories tab |
| ~~17~~ | ~~**Per-user categories**, each new user seeded with the 14 default categories; changes made directly in the database; no management screen~~ *Superseded by decision 26* | The database matches the Specification's per-user Category model from the start, so a management screen can be added later without schema changes |
| 18 | **Edit and soft delete** from History (and, since Specification v0.8, from the Log screen's Today list), reusing the review card | No new screen needed. Soft delete (`deleted_at`) keeps records recoverable, in line with the audit-friendly principle |
| 19 | **SGD only** (*since decision 36, a default currency chosen per person, still without conversion*) | Nearly all expenses are in SGD; currency is still stored per expense, but summaries do not convert |
| 26 | **Categories screen** to add and rename per-user categories, as a fourth tab (*since decision 33, the Categories & budgets page inside Settings*). ~~Retiring and deleting are left out for now~~ *Retiring added by decision 29*; each new user is still seeded with the 14 defaults | Expenses link to categories by ID, so renames carry through history, and the parser reads the live list. ~~Retiring needs more work: an older expense in a retired category must still open and save correctly in the edit sheet~~ |
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
- Allow-list administration is deferred to Phase 4 (retiring categories and the monthly CSV export were delivered early: decisions 29 and 35)
- Budget history, alerts and fuller budget tracking remain in Phase 3
- Choose how to speed up parsing once the live app has recorded timings for 10–15 everyday parses (decision 37)
- Change `sslmode=require` to `sslmode=verify-full` in the live `DATABASE_URL` (Vercel's environment settings; done by Lionel). Each time a server starts, the database driver warns that `require` is treated as `verify-full` for now, which checks the database's certificate, but that pg 9 will make `require` weaker, so it no longer checks the certificate. `web/package.json` allows only pg 8, so nothing changes until then, but the address should be updated before any upgrade to pg 9 (seen in Vercel's logs, 14 November 2026)
- Consider a short slide-up animation when sheets open (review, edit and confirmation sheets), to make the app feel more intuitive; left out of decision 38 for now (14 November 2026)
