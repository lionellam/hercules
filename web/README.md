# Hercules — Web App

Mobile-first expense logger: type an expense in plain language, review the parsed fields, save. Next.js (TypeScript) on Vercel, Neon Postgres, Google sign-in with an allow-list, Claude Haiku 5.5 for parsing. See `../Project Hercules - Architecture.md` for the decisions behind this.

**User guide:** [How Hercules Works](https://lionellam.github.io/hercules/) explains how to use the app. It is published from `../Project Hercules - How Hercules Works.html` by `.github/workflows/guide-pages.yml` whenever that file or its screenshots (`../guide-images/`) change on `main`. The screenshots are taken from a local demo account (`demo@example.com`, filled with `npm run sample`), so no real spending appears in the public guide.

## Local development

No accounts are needed to run locally: the database runs in-process (PGlite), a "Dev sign in" form replaces Google, and a keyword stand-in replaces the language model when `ANTHROPIC_API_KEY` is empty.

```bash
npm install
cp .env.example .env.local      # then set AUTH_SECRET: openssl rand -base64 32
npm run db:local                # terminal 1 — local Postgres on port 5433, data in .pglite/
npm run db:migrate              # terminal 2
npm run allow -- add you@gmail.com
npm run dev                     # http://localhost:3000 — use "Dev sign in" with the allowed email
```

To use the real parser locally, add an Anthropic API key to `.env.local`.

## Commands

| Command | Purpose |
|---|---|
| `npm run db:migrate` | Apply `db/schema.sql` to `DATABASE_URL` (safe to re-run) |
| `npm run allow -- add <email>` | Invite someone |
| `npm run allow -- remove <email>` | Revoke access (their data is kept) |
| `npm run allow -- list` | Show the allow-list |
| `npm run sample -- add <email>` / `remove <email>` | Local database only: add about three months of made-up expenses (September, October and early November 2026) to try the app, or remove them. Sample rows are tagged `sample:` and your own entries are never touched. Safe to re-run |
| `npm run import:cli -- <email> [db path] [--dry-run]` | One-off import of the CLI's SQLite expenses (default `../poc/data/expenses.db`). The user must have signed in once. Safe to re-run |

Scripts read `.env.local`. To run one against production, pass the URL for that command only: `DATABASE_URL="<neon url>" npm run db:migrate`.

**Schema changes:** when `db/schema.sql` changes, run the migration against Neon *before* pushing the code that relies on it. Every push to `main` deploys straight away, and migrations only add, so the live app keeps working in the meantime.

## Releasing a new version

Versions follow semantic versioning (Architecture decision 34): **major** for a fundamental change, **minor** for a new feature, **patch** for a fix or small tweak; document-only changes don't change the version.

1. In the same commit as the change, bump the version: `npm version <major|minor|patch> --no-git-tag-version` (updates `package.json` and `package-lock.json`).
2. Add a short entry to `../CHANGELOG.md`.
3. After pushing, tag the release and push the tag: `git tag -a vX.Y.Z -m "Version X.Y.Z"` then `git push origin vX.Y.Z`.

Settings shows the version with the commit and build time, so you can check which version is live.

## Deploying

1. **Anthropic** — in the Anthropic Console, create an API key and set a **US$5 monthly spend limit** on the account.
2. **Vercel** — import the `hercules` GitHub repository and set **Root Directory** to `web`. `vercel.json` runs the server in Singapore (`sin1`), next to the Neon database; keep the two in the same region.
3. **Neon** — in the Vercel project, add Neon from the Storage / Marketplace tab and connect it to the project. This sets `DATABASE_URL`.
4. **Google sign-in** — in Google Cloud Console, create a project, then:
   - Configure the OAuth consent screen (External, app name "Hercules"). With only the default email and profile scopes, the app can be published without Google's verification review; while it is in "Testing", only users listed as test users can sign in.
   - Create an **OAuth client ID** of type *Web application* with these authorised redirect URIs:
     - `https://<your-app>.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
5. **Vercel environment variables** — add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and `ANTHROPIC_API_KEY`. Do **not** set `DEV_LOGIN`.
6. **Database** — from this folder, run the migration and invite yourself against Neon:
   ```bash
   DATABASE_URL="<neon url>" npm run db:migrate
   DATABASE_URL="<neon url>" npm run allow -- add you@gmail.com
   ```
7. **Deploy**, sign in once with Google, then import the CLI history:
   ```bash
   DATABASE_URL="<neon url>" npm run import:cli -- you@gmail.com --dry-run
   DATABASE_URL="<neon url>" npm run import:cli -- you@gmail.com
   ```
8. On iPhone, open the app in Safari → Share → **Add to Home Screen**.

## Limits and safeguards

- Each user can parse up to 100 expenses in any 24 hours.
- The allow-list is re-checked on every request, so removing an email revokes access immediately.
- Deleting an expense sets `deleted_at` (soft delete); it can be restored in the database.
