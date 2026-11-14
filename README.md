# Project Hercules

A private expense tracker for family and close friends. You type an expense the way you'd say it ("lunch at Ya Kun 4.50"), Claude picks out the amount, category, merchant and date, and you check and save it. Hercules then totals your spending by day, month and category, and tracks it against any monthly budgets you set.

**User guide:** [How Hercules Works](https://lionellam.github.io/hercules/)

The app is invite-only: sign-in is with Google, for invited email addresses only.

## What's here

| Folder or file | What it is |
|---|---|
| [`web/`](web/) | The web app (Next.js on Vercel, Neon Postgres, Claude Haiku 5.5). See [`web/README.md`](web/README.md) for running it locally and deploying |
| [`poc/`](poc/) | The original command-line proof of concept (Python, local model, SQLite), kept for experiments |
| [`design/`](design/) | Design mockups made while planning changes |
| [How Hercules Works](Project%20Hercules%20-%20How%20Hercules%20Works.html) | Source of the user guide, with its pictures drawn as mockups in the page itself, published to GitHub Pages by [`.github/workflows/guide-pages.yml`](.github/workflows/guide-pages.yml) |

## Project documents

| Document | Covers |
|---|---|
| [Project Charter](Project%20Hercules%20-%20Project%20Charter.md) | Purpose, goals, scope and phases |
| [Project Plan](Project%20Hercules%20-%20Project%20Plan.md) | Features, milestones, risks and personas |
| [Specification](Project%20Hercules%20-%20Specification.md) | How the app behaves, including the "Log an Expense" flow, spending pace rules and data model |
| [Architecture](Project%20Hercules%20-%20Architecture.md) | The system and the decision record behind it |
| [Go-Live Checklist](Project%20Hercules%20-%20Go-Live%20Checklist.md) | Steps taken to put the web app live |
| [Test Plan](Project%20Hercules%20-%20Test%20Plan.md) | Step-by-step manual tests for the web app, with expected results |
| [Work Log](WORKLOG.md) | What was done, decisions made and lessons learned, by date |
| [Changelog](CHANGELOG.md) | What's new in each version of the app |
| [CLAUDE.md](CLAUDE.md) | How Claude sessions work on this project: the routine for changes, testing, the user guide and integrity checks (read automatically by Claude Code) |

## Versions

The web app uses [semantic versioning](https://semver.org), starting at 1.0.0 (Architecture decision 34). Each release bumps the version in `web/package.json`, adds an entry to [CHANGELOG.md](CHANGELOG.md), and is tagged in Git as `vX.Y.Z`. The version running shows at the bottom of Settings in the app.

## License

[MIT](LICENSE)
