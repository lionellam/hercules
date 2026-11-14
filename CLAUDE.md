# Project Hercules — Working Instructions for Claude

How changes to Hercules are made, so every session follows the same routine on any machine. The repository is public: nothing in this file, or anything committed, may contain email addresses (other than the placeholders `demo@example.com` and `you@gmail.com`), secrets or personal details.

Key documents, all at the repository root: Specification, Architecture (decision record), Test Plan, Project Charter, Project Plan, Go-Live Checklist, `WORKLOG.md`, `CHANGELOG.md`, and the user guide `Project Hercules - How Hercules Works.html`. The app is in `web/` (see `web/README.md`).

## Ground rules

- **Commit and push only when asked.** Each approval covers that one commit; ask again for the next. Before committing, show what's staged, and check the staged changes for email addresses.
- **Start of a session:** fetch and check `git status -sb`; work may have been pushed from another machine. Pull only when asked.
- **Staging:** stage deleted files with `git rm` separately (a deleted path in `git add` stops the whole command), then check the staged list before committing.
- **Secrets:** never read, print or commit `web/.env.local` or any connection string, key or password. To check which database a script will use, count matches only (for example, whether `DATABASE_URL` points at `127.0.0.1`).
- **Outward actions:** anything that changes the live app's database, or another service, is done by the owner or only after their go-ahead (for example, the owner clicks Run in Neon's SQL Editor).
- **Be honest in reports:** say what was tested and what wasn't, and correct mistakes openly, including in the worklog.

## How a change is made, in order

1. **Discuss first.** For anything with choices, set out the options with a recommendation, and wait for the owner's decision.
2. **Mockups before building** any visible change: an HTML page in `design/` (kept there), shown in the browser pane. Build only after the owner approves.
3. **Documents before code.** Update the Specification, Architecture (new or updated decision), Test Plan (new or changed test cases), and the Charter or Project Plan if scope or features change. Each document changed gets its version bumped, a Version History row (author "Lionel Lam") and its Last Reviewed date.
4. **Code.**
5. **App version** (Architecture decision 34, semantic versioning): major for a fundamental or irreversible data change, minor for a new feature, patch for a fix or small tweak; documents-only changes don't bump. Run `npm version <major|minor|patch> --no-git-tag-version` in `web/` and add a plain-English `CHANGELOG.md` entry.
6. **Test locally** (see Testing).
7. **Worklog:** add an entry to `WORKLOG.md` (and update its "Last updated" date): what was done and why, the options considered and the owner's choice, the tests run with their actual results, any slips with the lesson learned, and the clean-up done.
8. **Show the result** (a screenshot from the demo account) and ask before committing.
9. **After pushing an app change:** tag it (`git tag -a vX.Y.Z -m "Version X.Y.Z"`), push the tag, and check the tag is on GitHub.
10. **After the owner checks on their phone:** when they confirm, offer to add a line to that version's worklog entry: `- **Confirmed (D Month YYYY):** after the deploy, the owner checked on their phone that …`, then commit only when asked.

## Database changes

- The schema is `web/db/schema.sql`. Changes must be additive and safe to re-run (`IF NOT EXISTS`).
- Locally: `npm run db:local` (local Postgres on port 5433), then `npm run db:migrate`.
- **Production (Neon) must be changed before pushing code that needs it**, because every push to `main` deploys at once. The simplest route: Vercel → hercules → Storage → hercules-db → Open in Neon → SQL Editor (project hercules-db, branch main, database neondb). Type the statement in; the owner clicks Run. Then run a read-only check that the change is there.

## Testing

- Run the app with the `hercules-web` dev server (`npm run dev` in `web/`). Restart it after changing `web/package.json` (version) or `next.config.ts`.
- **Test only on the demo account,** never the owner's:
  - allow it first: `npm run allow -- add demo@example.com` (sample data: `npm run sample`);
  - sign in with the dev sign-in on the local sign-in page;
  - **before every test run, confirm which account is signed in** (`/api/auth/session`), as the test browser may still be signed in to the owner's account.
- Label test data `[TEST]` (expenses) or `zz-test-` (categories).
- Parse tests call Claude Haiku and cost a little: keep them few.
- Always run: `npx tsc --noEmit`, `npx eslint .` (one known warning, in `web/lib/client.ts`), and `npm run build`.
- **Clean up afterwards** and check it: delete the test rows, reset any setting changed (for example the default currency), delete the parse entries the tests created, remove the demo account from the allow-list (`npm run allow -- remove demo@example.com`), and sign the test browser back in to whichever account it was on before. Confirm no `[TEST]` rows remain.
- Leave alone any data that the tests didn't create.

## The user guide

`Project Hercules - How Hercules Works.html`, published to GitHub Pages by `.github/workflows/guide-pages.yml` when it changes on `main`.

- **Content rules:** never name the owner ("the app owner" only where needed, such as asking for an invitation); never name competitor apps; never offer or hint at recovering deleted expenses beyond Undo; update the "Updated" date.
- **Pictures are HTML mockups drawn in the page, not screenshots.** When the app's look changes, edit the mockup to match.
- **Show the owner a preview before committing** a guide change.
- **After pushing, check it's live** before saying so: the workflow run succeeded (`gh run list --workflow guide-pages.yml`) and the live page shows the change. If a run fails on a temporary GitHub error, re-run it.

## Document integrity check

When asked for a "document integrity check":

1. Look at what has changed since the last check.
2. Check each document's version header against the last row of its Version History.
3. Check `web/package.json`, `CHANGELOG.md` and the Git tags (local and on GitHub) agree.
4. Check the Specification, Architecture, Test Plan, Charter and Project Plan all describe the app as it is now: search for wording left from earlier versions, and check new features appear in each relevant document (feature lists, Settings, scope).
5. Check the user guide follows its content rules, and that the live Pages copy matches the repository.
6. Check the READMEs and that `WORKLOG.md` is dated.

Report findings as a numbered list with proposed fixes, apply them only when asked, then record the check and its fixes in the worklog. Documents-only fixes don't change the app version.

## Style

Plain English, short sentences. User-facing text is short and friendly. Keep the existing tone of each document.
