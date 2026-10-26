# Project Hercules — Go-Live Checklist (Web App v1)

```
Last updated: 26 October 2026
```

Tracks the steps to take the web app from "working locally" to "live on your phone". Detailed instructions for each step are in `web/README.md`; ask Claude to walk through any of them.

**Owner:** *You* = needs your accounts, keys or decisions. *Claude* = can be done in a session once you say go.

## 1. Code

- [x] Commit the web app, document updates and this checklist — *Claude* (done 26 Oct)
- [ ] Push to GitHub — *Claude* (awaiting your go-ahead)

## 2. Accounts and keys

- [x] **Anthropic** — create an API key in the Anthropic Console — *You* (done 26 Oct; saved in `web/.env.local`, real parsing verified locally)
- [x] **Anthropic** — set a US$5 monthly spend limit on the account — *You* (done 26 Oct)
- [ ] **Vercel** — sign up / sign in with GitHub; check the Hobby plan terms suit a personal family app — *You*
- [ ] **Vercel** — import the `hercules` repository with **Root Directory** set to `web` — *You*
- [ ] **Neon** — add Neon from the Vercel project's Storage / Marketplace tab and connect it (sets `DATABASE_URL`) — *You*
- [ ] **Google Cloud** — create a project and configure the OAuth consent screen (External, "Hercules"); publish it, or add each invitee as a test user — *You*
- [ ] **Google Cloud** — create an OAuth client ID (Web application) with the redirect URIs for `localhost:3000` and the Vercel address — *You*

## 3. Configuration

- [ ] Add environment variables in Vercel: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ANTHROPIC_API_KEY` (do **not** set `DEV_LOGIN`) — *You*
- [ ] Note the Vercel address (`https://<name>.vercel.app`) and make sure it matches the Google redirect URI — *You*

## 4. Database

- [ ] Apply the schema to Neon: `DATABASE_URL="<neon url>" npm run db:migrate` — *You*
- [ ] Add yourself to the allow-list: `npm run allow -- add <your gmail>` (with the Neon URL) — *You*

## 5. Launch and verify

- [ ] Deploy, then sign in once with Google — *You*
- [ ] Import CLI history: dry run first, then the real import — *You*
- [ ] Check History and Summary show July–August correctly — *You*
- [ ] Log a few real expenses to test Claude Haiku parsing (first real test of the model) — *You*
- [ ] On iPhone: Safari → Share → Add to Home Screen — *You*
- [ ] Report anything odd back to Claude for fixes — *You*

## 6. Rollout

- [ ] Invite family members and close friends: `npm run allow -- add <email>` — *You*
- [ ] Optional: ask James Wong to review the Architecture document's decisions — *You*

## Notes

- Never paste API keys, secrets or the Neon connection string into the chat; enter them directly in Vercel or your terminal.
- The CLI keeps working as before; entries logged in the CLI after the import won't appear in the web app.
