# Project Hercules — Go-Live Checklist (Web App v1)

```
Last updated: 2 November 2026
```

Tracks the steps to take the web app from "working locally" to "live on your phone". Detailed instructions for each step are in `web/README.md`; ask Claude to walk through any of them.

**Owner:** *You* = needs your accounts, keys or decisions. *Claude* = can be done in a session once you say go.

## 1. Code

- [x] Commit the web app, document updates and this checklist — *Claude* (done 26 Oct)
- [x] Push to GitHub — *Claude* (done 26 Oct)

## 2. Accounts and keys

- [x] **Anthropic** — create an API key in the Anthropic Console — *You* (done 26 Oct; saved in `web/.env.local`, real parsing verified locally)
- [x] **Anthropic** — set a US$5 monthly spend limit on the account — *You* (done 26 Oct)
- [x] **Vercel** — sign up / sign in with GitHub — *You* (done 1 Nov)
- [ ] **Vercel** — check the Hobby plan terms suit a personal family app — *You*
- [x] **Vercel** — import the `hercules` repository with **Root Directory** set to `web` — *You* (done 1 Nov; first deploy Ready, address `https://hercules-eta-three.vercel.app`)
- [x] **Neon** — add Neon from the Vercel project's Storage / Marketplace tab and connect it (sets `DATABASE_URL`) — *You* (done 1 Nov; `hercules-db`, Free plan, env prefix `DATABASE`)
- [x] **Google Cloud** — create a project and configure the OAuth consent screen (External, "Hercules") — *You* (done 1 Nov; project ID `hercules-513414`, currently in Testing)
- [x] **Google Cloud** — publish the consent screen, or add each invitee as a test user — *You* (decided 1 Nov: stay in Testing and add test users; owner added. Publishing would need a home page, privacy policy and likely a custom domain)
- [x] **Google Cloud** — create an OAuth client ID (Web application) with the redirect URIs for `localhost:3000` and the Vercel address — *You* (done 1 Nov; client "Hercules web")

## 3. Configuration

- [x] Add environment variables in Vercel: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ANTHROPIC_API_KEY` (do **not** set `DEV_LOGIN`) — *You* (all four added and redeployed 1 Nov)
- [x] Note the Vercel address (`https://<name>.vercel.app`) and make sure it matches the Google redirect URI — *You* (keeping `https://hercules-eta-three.vercel.app`, decided 1 Nov)

## 4. Database

- [x] Apply the schema to Neon: `DATABASE_URL="<neon url>" npm run db:migrate` — *You* (done 1 Nov)
- [x] Add yourself to the allow-list: `npm run allow -- add <your gmail>` (with the Neon URL) — *You* (done 1 Nov)

## 5. Launch and verify

- [x] Deploy, then sign in once with Google — *You* (done 1 Nov)
- [x] Import CLI history: dry run first, then the real import — *You* (done 1 Nov; 229 imported, 0 skipped, 0 invalid)
- [x] Check History shows July–August correctly — *You* (done 1 Nov. Summary only covers this month and last month in v1, so July–August aren't visible there. A Summary month switcher was considered and left out of v1)
- [x] Log a few real expenses to test Claude Haiku parsing (first real test of the model) — *You* (done by 2 Nov)
- [x] On iPhone: Safari → Share → Add to Home Screen — *You* (done by 2 Nov)
- [ ] Report anything odd back to Claude for fixes — *You*

## 6. Rollout

- [ ] Invite family members and close friends, adding each email in **both** places — *You* (ongoing; first family member added to both on 2 Nov):
  - Hercules allow-list: `npm run allow -- add <email>` (with the Neon URL)
  - Google Cloud → Google Auth Platform → Audience → Test users → Add users (project `hercules-513414`, limit 100)
- [ ] Optional: ask James Wong to review the Architecture document's decisions — *You*

## Notes

- Never paste API keys, secrets or the Neon connection string into the chat; enter them directly in Vercel or your terminal.
- The CLI keeps working as before; entries logged in the CLI after the import won't appear in the web app.
