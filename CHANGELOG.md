# Changelog

What's new in each version of the Hercules web app, newest first. The version shows at the bottom of **Settings** in the app.

Versions follow [semantic versioning](https://semver.org): **major** for a change in how the app fundamentally works, **minor** for a new feature, **patch** for a fix or small tweak. Updates to documents alone don't change the version. See Architecture decision 34.

---

## 1.1.0 — 9 November 2026

**New**
- Download a month's expenses as a spreadsheet file (CSV) from Summary: tap **CSV** beside the total. This month gives everything logged so far; last month gives the whole month. The file opens in Excel, Numbers or Google Sheets.

---

## 1.0.0 — 9 November 2026

The first numbered release. The app has been in use since go-live on 1 November 2026; this version covers everything built up to now.

**Logging**
- Type an expense in plain words; Claude picks out the amount, category, merchant and date for you to check before saving.
- An "×" clears the text box in one tap.
- Today's spending, and a breakdown by category, under the box.

**Fixing and deleting**
- Edit any expense from Today or History.
- Deleting asks first, then offers Undo for about five seconds.
- Closing an edit with unsaved changes asks before throwing them away.

**History**
- Every expense month by month, grouped by day.
- Search the month shown by merchant, category, typed text, remarks or amount, with a count and total of the results.

**Summary**
- This month and last month, with totals by category and a pie chart.
- Monthly budgets with spending pace: whether each budget is on pace, and roughly what you can spend a day for the rest of the month, with a burn-up chart.

**Settings**
- Categories & budgets: add, rename, set budgets, retire and restore categories.
- Appearance: System, Light or Dark.
- Account: sign out, with a confirmation.
- The app version and when it was last updated.

**Behind the scenes**
- Invite-only Google sign-in; each person sees only their own expenses.
- Works on phones, tablets and computers, and can be added to the home screen.
- Impossible dates are refused, and phone fields no longer zoom in when tapped.

---

## Before 1.0.0

Development history from the July 2026 proof of concept to go-live is recorded day by day in `WORKLOG.md`.
