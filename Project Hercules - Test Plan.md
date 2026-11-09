# Project Hercules — Test Plan: Web App v1

```
Version 1.4 · Draft
Last Reviewed: 9 November 2026
Produced with AI Assistance (Claude Code)
```

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-11-09 | Lionel Lam | First complete set of manual test cases for the web app, covering Specification v0.33 and Architecture v0.14 |
| 1.1 | 2026-11-09 | Lionel Lam | Settings tab: categories, appearance and sign-out tests updated; new Section Q for Settings (Specification v0.34) |
| 1.2 | 2026-11-09 | Lionel Lam | Sign-out confirmation (A-05, A-09), and nothing carrying over after sign-out (A-10) |
| 1.3 | 2026-11-09 | Lionel Lam | Integrity check: S-02 updated for Settings; B-07 reference corrected; A-09 and A-10 in order; Q-08 and new S-07 check the version against the changelog; clean-up also clears test parses |
| 1.4 | 2026-11-09 | Lionel Lam | CSV download: new Section R |

---

## 1. Purpose

A complete, human-readable set of test steps for the Hercules web app. Each test case says what to do and what you should see, so anyone can run it by hand on a phone or computer and record the result. The command-line proof of concept has its own plan in `poc/TEST_PLAN.md`.

Run the whole plan before a large release, and the relevant sections after a smaller change. Section 6 is a short check to run on the live app after every deploy.

## 2. Where to Test

**Test on the local app, not the live one.** The local app has its own database, so test data never mixes with real spending. Only Section 6 is run against the live app, and it adds nothing that isn't removed straight away.

**Setting up the local app** (full details in `web/README.md`):

1. Start the local database: `npm run db:local` in `web/`.
2. Apply the schema: `npm run db:migrate`.
3. Allow a test email address: `npm run allow -- add <your test email>`.
4. Start the app: `npm run dev`, then open http://localhost:3000.
5. Sign in with **Dev sign in**, using the allowed email address.
6. Optional: load sample data with `npm run sample -- add <your test email>`, which adds about three months of made-up expenses. Remove them afterwards with `npm run sample -- remove <your test email>`.

**Parsing locally:** with no Anthropic API key in `web/.env.local`, a simple keyword stand-in replaces Claude. It recognises amounts, "yesterday", and a few words per category (lunch, grab, NTUC, and so on). Test cases marked **[Claude]** need a real API key, since they test how well the real model reads text.

**Phones:** test cases marked **[Phone]** need a real phone. To open the local app from a phone on the same Wi-Fi, use the computer's address, for example `http://192.168.1.20:3000`.

## 3. Test Data and Clean-up

- **Mark everything you create.** Start test expense text with `[TEST]` (for example `[TEST] lunch 5.50`) and test category names with `zz-test-` (for example `zz-test-pets`). This makes test data easy to find and remove.
- **Don't change existing records** unless the test needs it. If it does, note the original values and put them back afterwards.
- **Clean up after testing.** Removing test data from the local database needs the database itself, since deleting in the app only hides an expense. Ask Claude to do it, or run:

  ```sql
  DELETE FROM expenses     WHERE raw_input LIKE '[TEST]%';
  DELETE FROM categories   WHERE name LIKE 'zz-test-%';
  DELETE FROM parse_events WHERE created_at > '<when testing started>';
  ```

  The last line removes the records of test parses, which otherwise count towards the 100-a-day limit (O-02).

## 4. Recording Results

For each run, note the date, the device and browser, whether it was the local or live app, and for each test case: **Pass**, **Fail** (with what you saw instead), or **Not run**. A results table for copying is in Section 7.

---

## 5. Test Cases

### A. Signing In and Access

| ID | Test | Steps | Expected result |
|---|---|---|---|
| A-01 | Sign-in screen | Open the app while signed out | The Hercules sign-in screen shows "Sign in with Google" and "Invite only. Your expenses are private to your account." |
| A-02 | Invited account signs in | Sign in with an allowed email address | The Log screen opens, showing today's date and "Log an expense" |
| A-03 | Uninvited account is refused | Sign in with an email address that isn't on the allow-list | Back on the sign-in screen with "This account hasn't been invited. Ask the app owner to add your email address." |
| A-04 | Removing access takes effect at once | While signed in on one device, remove that email address from the allow-list (`npm run allow -- remove <email>`), then reload the app | The sign-in screen appears; the person can't get back in. Add the address again afterwards |
| A-05 | Signing out | Settings → **Sign out** → **Sign out** on the confirmation | "Sign out?" appears first, with a red Sign out button. After confirming, the sign-in screen appears; opening the app again asks you to sign in |
| A-06 | Data needs sign-in | While signed out, open `http://localhost:3000/api/expenses?month=2026-11` in the browser | The page shows `{"error":"Not signed in"}` and no expenses |
| A-07 | Each person sees only their own expenses | Allow a second test email address. Sign in as each in turn, logging one `[TEST]` expense as each | Each account sees only its own expense in Today, History and Summary |
| A-08 | Dev sign-in is local only | Open the live app's sign-in screen | Only "Sign in with Google" shows; there's no "Dev sign in" form |
| A-09 | Cancelling sign-out | Settings → **Sign out**, then **Cancel** (or tap outside the sheet) | The sheet closes and you stay signed in on Settings |
| A-10 | Nothing carries over after sign-out | Open Settings, sign out, then sign in again on the same browser tab (or as a second test account, see A-07) | The app opens fresh on **Log**, showing only the signed-in person's data, not the tab or data from before |

### B. Logging an Expense

| ID | Test | Steps | Expected result |
|---|---|---|---|
| B-01 | Parse and save | Type `[TEST] lunch at Ya Kun 4.50`, tap **Parse**, then **Save** | A review card appears with SGD 4.50, Food & Dining and today's date. After saving, "Saved" shows briefly, the box empties, and the expense appears under **Today** |
| B-02 | Relative date | Type `[TEST] grab home 14.20 yesterday` → Parse | The review card's date is yesterday |
| B-03 | Specific date **[Claude]** | Type `[TEST] NTUC groceries 62.30 on 3 Nov` → Parse | Date is 3 November of this year; category Groceries; merchant NTUC |
| B-04 | Another currency **[Claude]** | Type `[TEST] coffee USD 5` → Parse → Save | The card shows USD 5.00; in the Today list the amount shows as "USD 5.00" |
| B-05 | No amount | Type `[TEST] lunch` → Parse | The amount on the card is empty. Tapping Save shows "Please enter an amount." and nothing is saved |
| B-06 | Unmatched category falls back to Other **[Claude]** | Type `[TEST] mystery item 9.99` → Parse | Category is **Other** (or the closest of your own categories), never a new category name |
| B-07 | Only your categories are offered **[Claude]** | Retire a category (see L-01), then type an expense that clearly belongs in it → Parse | The card shows one of your active categories or Other, not the retired one. Restore the category afterwards |
| B-08 | Parse button state | Look at **Parse** with the box empty, then type something | Parse is dimmed and can't be tapped while the box is empty, and while a review card is open |
| B-09 | Spent today total | Note **Spent today**, then save a `[TEST]` expense of 5.00 dated today | Spent today goes up by $5.00 |
| B-10 | Today by category | Save two `[TEST]` expenses today in different categories | **Today by category** lists each category with its count and total, largest first, and a combined total |
| B-11 | Expense dated another day | Save `[TEST] taxi 10 yesterday` | It appears in History under yesterday's date, not under Today, and doesn't change Spent today |
| B-12 | Typed text is kept | Save `[TEST] dinner with the team 30`, then open it from Today | The card shows the original text in italics at the top: "[TEST] dinner with the team 30" |
| B-13 | Text length limit | Paste text longer than 500 characters into the box | The box stops accepting text at 500 characters |
| B-14 | Clearing the box | With the box empty, look for an ×; then type some text and tap the **×** at the top right of the box | No × while the box is empty. With text, the × appears; tapping it empties the box without asking, the cursor stays in the box, Parse dims, and the × disappears until you type again |

### C. The Review Card

| ID | Test | Steps | Expected result |
|---|---|---|---|
| C-01 | Every field can be changed | Parse `[TEST] lunch 5.50`. Change the amount to 6.00, the category, the merchant, the date and add a remark → Save | The saved expense shows all the changed values, and an **edited** tag in the list |
| C-02 | Unchanged expense isn't marked edited | Parse and save without changing anything | No **edited** tag on the expense |
| C-03 | Discard without changes | Parse `[TEST] lunch 5.50` → tap **Discard** | The card closes straight away, with no question. The typed text stays in the box. Nothing is saved |
| C-04 | Discard after a change asks first | Parse, change the amount → tap **Discard** | "Discard your edits?" appears. **Keep reviewing** returns to the card with your change. **Discard** closes the card; the typed text stays; nothing is saved |
| C-05 | Amount must be above zero | On a card, set the amount to 0 or text such as "abc" → Save | "Please enter an amount." Nothing is saved |
| C-06 | Impossible date is refused | Using the browser's developer tools or the API, try to save an expense dated 2026-02-31 | The save is refused with "Please check the amount and fields." |

### D. Fixing, Deleting and Undo

| ID | Test | Steps | Expected result |
|---|---|---|---|
| D-01 | Edit from Today | Tap a `[TEST]` expense under Today → change the amount → Save | The sheet closes; the new amount shows in Today, History and Summary, with an **edited** tag |
| D-02 | Edit from History | History → tap a `[TEST]` expense → change the remarks → Save | The change is saved; reopening shows the new remark |
| D-03 | Delete asks first | Open a `[TEST]` expense → **Delete** | "Delete this expense?" appears, showing the expense's merchant (or text), category, date and amount, with **Delete expense** and **Cancel** |
| D-04 | Cancel a delete | In D-03, tap **Cancel** | The confirmation closes; the edit sheet is still open; nothing is deleted |
| D-05 | Delete and Undo | Delete a `[TEST]` expense → tap **Undo** on the bar at the bottom | "Expense deleted · Undo" appears for about five seconds. After Undo, the expense is back in the list with all its details |
| D-06 | Undo bar times out | Delete a `[TEST]` expense and wait | The bar disappears after about five seconds; the expense stays deleted |
| D-07 | Deleted expense is hidden everywhere | After D-06, check Today, History, Summary and the totals | The expense appears nowhere, and totals no longer include it |
| D-08 | Deleted expense is kept in the database | After D-06, look at the expense in the database | It's still there, with a `deleted_at` time set |
| D-09 | Move an expense to another date | Edit a `[TEST]` expense's date to last month → Save | It moves to last month in History and leaves this month's Summary |

### E. Unsaved Changes

| ID | Test | Steps | Expected result |
|---|---|---|---|
| E-01 | Edit expense, no changes | Open an expense → tap **Cancel**, then open it again and tap outside the sheet | Each time the sheet closes straight away |
| E-02 | Edit expense, with a change | Open an expense, change the amount → tap **Cancel** | "Discard changes?" appears. **Keep editing** keeps the sheet open with your change |
| E-03 | Tapping outside with a change | Open an expense, change a field → tap the dimmed area above the sheet | "Discard changes?" appears. **Discard changes** closes the sheet; the expense is unchanged |
| E-04 | Category sheet | Settings → Categories & budgets → open a category, change its budget → tap outside | "Discard changes?" appears; discarding leaves the budget unchanged |
| E-05 | Add category | Settings → Categories & budgets → **Add category** → type a name → **Cancel** | "Discard changes?" appears. With nothing typed, Cancel closes straight away |

### F. History

| ID | Test | Steps | Expected result |
|---|---|---|---|
| F-01 | Month list | Open **History** | This month's expenses, newest first, grouped under day headings such as "Sun, 8 Nov" |
| F-02 | Earlier months | Tap **‹** | The previous month's expenses load. **›** returns towards this month and is dimmed on the current month |
| F-03 | Empty month | Go back to a month with no expenses | "No expenses this month." |
| F-04 | Pinned top | Scroll a long month | The heading, month switcher and search field stay at the top |

### G. Searching History

Use a month with several expenses, such as one filled with sample data.

| ID | Test | Steps | Expected result |
|---|---|---|---|
| G-01 | Field placement | Open History | A field reading "Search expenses" sits below the month switcher, with no × yet |
| G-02 | Filters on each letter | Type `g`, then `r`, `a`, `b`, one letter at a time | The list narrows after every letter; "Grab" is highlighted in each result |
| G-03 | Results line | With `grab` typed | A line above the list shows the number of results and their total, for example "3 results" and "$69.80". Check the total by adding the amounts shown |
| G-04 | Searches the category | Type `transport` | Every Transport expense in the month shows |
| G-05 | Searches the typed text and remarks | Save `[TEST] dinner with the team 30` with merchant "Jumbo" and remark "birthday". Search `team`, then `birthday` | The expense shows both times, even though "team" and "birthday" aren't in the merchant or category |
| G-06 | Searches amounts | Type an amount that appears in the month, such as `64.90` | Only expenses of that amount show, with the amount highlighted |
| G-07 | Capitals and word order | Type `KUN ya` | Ya Kun expenses show |
| G-08 | Every word must match | Type `grab sushi` | "No search results", with "Nothing in [month] matches "grab sushi"." |
| G-09 | Clear with × | With text typed, tap **×** | The field empties, the × disappears, and the full list returns |
| G-10 | Clear with Escape (computer) | With text typed, press Escape | Same as G-09 |
| G-11 | Changing month clears it | Type `grab`, then tap **‹** | The previous month opens with an empty search field and its full list |
| G-12 | Leaving History clears it | Type `grab`, switch to Log, then back to History | The field is empty and the full list shows |
| G-13 | Searching doesn't change data | Run any searches, then check Summary | Totals are unchanged |

### H. Summary

| ID | Test | Steps | Expected result |
|---|---|---|---|
| H-01 | This month | Open **Summary** | "Spent so far this month", the total, "Day X of Y" with today's date, and how it compares with last month ("+$… vs October" or "−$…") |
| H-02 | Last month | Tap last month's name at the top | "Spent in [month]", that month's total, compared with the month before. No pace notes |
| H-03 | Totals match History | Add up a month's amounts in History (or use a search for each category) | Each category's figure on Summary matches |
| H-04 | Only categories with spending | Have a category with a budget but no spending this month | It isn't listed on Summary |
| H-05 | Bars without a budget | Look at a category with no budget | Its bar is relative to the month's largest category |
| H-06 | Bars with a budget | Set a budget on a category with spending this month | It reads "x of budget", and the bar fills against the budget |
| H-07 | Over budget is red | Make a `zz-test-` category with a 10.00 budget and log `[TEST]` expenses totalling 12.00 in it | Its bar is full and red, with "Over budget by $2.00" in red and a warning icon |
| H-08 | Pie chart | Look below the category list | "Share of spend" with up to six slices and percentages. With more than six categories, the smaller ones are grouped as "Everything else (n)" |
| H-09 | Future-dated expense | Save a `[TEST]` expense dated later this month | It counts towards this month's total and pace straight away |

### I. Spending Pace (This Month)

Pace applies to categories with a budget and spending this month. **Expected by today** = budget × today's day ÷ days in the month. "On pace" means within 5% of the whole budget either side of that amount.

Worked example for a **$300 budget on day 7 of a 30-day month**: expected $70.00, on pace between $55.00 and $85.00, and "about $/day" divides what's left by the 23 days remaining. Adjust the figures to today's date and month when you test.

| ID | Test | Spent | Expected note |
|---|---|---|---|
| I-01 | On pace | $60.00 | **On pace** · $240.00 left, about $10.43/day |
| I-02 | Over pace | $90.00 | **$20.00 over pace** · $210.00 left, about $9.13/day (not red) |
| I-03 | Under pace | $50.00 | **$20.00 under pace** · $250.00 left, about $10.87/day |
| I-04 | Budget used | $300.00 | **Budget used** · $0.00 left |
| I-05 | Over budget | $320.00 | **Over budget by $20.00**, in red with a warning icon |
| I-06 | Last day of the month | Any amount under budget, on the last day | "… left today" instead of "about $/day" |
| I-07 | Marker position | Any budgeted category | A small upright marker on the bar sits at the expected-by-today amount |
| I-08 | Last month has no pace | Switch to last month | No markers or pace notes |

To set up I-01 to I-05: create a `zz-test-` category with a $300 budget and log `[TEST]` expenses in it dated this month, adjusting the total between checks.

### J. Burn-up Chart

| ID | Test | Steps | Expected result |
|---|---|---|---|
| J-01 | Opening and closing | Tap a budgeted category on this month's Summary | Its chart opens below the bar; tapping again closes it. Only budgeted categories open |
| J-02 | Lines | Look at the chart | A solid line steps up on each day with spending, a dashed line runs from zero to the budget across the month, and an upright line marks today labelled "Today" |
| J-03 | Labels | Look at the chart | "Budget X" by the budget line, today's amount beside the dot, and dates along the bottom (first day, 10, 20, last day). No labels overlap |
| J-04 | Pointing at a day | Touch or drag across the chart (or use the arrow keys on a computer) | A box shows that day's date, amount spent so far, the expected amount, and whether it was on, over or under pace |
| J-05 | Daily figures | Open **Daily figures** under the chart | A table of each day with spending: amount, running total and expected amount, matching the chart |
| J-06 | Over-budget chart | Open the category from H-07 | The line and shading are red |

### K. Categories and Budgets

| ID | Test | Steps | Expected result |
|---|---|---|---|
| K-01 | List | Settings → **Categories & budgets** | Your categories, each with its budget or "No budget". **Other** is last |
| K-02 | Add | **Add category** → name `zz-test-pets`, budget 50 → Save | It appears in the list with 50.00, and in the review card's category list |
| K-03 | Add without a budget | Add `zz-test-gifts` with the budget blank | It shows "No budget" |
| K-04 | Duplicate name | Add `ZZ-TEST-PETS` | "That name is already in use, or you've reached the limit of 50 categories." |
| K-05 | Rename | Rename `zz-test-pets` to `zz-test-animals` | The new name shows in the list, and on every past expense in that category in History and Summary |
| K-06 | Budget validation | Set a budget of 0, or of "abc" | "Enter a budget above zero, or leave it blank." |
| K-07 | Remove a budget | Clear a test category's budget → Save | It shows "No budget"; Summary no longer shows "of budget" for it |
| K-08 | Other can't be renamed or retired | Open **Other** | The name can't be edited; there's no Retire button; the note says it can't be renamed or retired. The budget can still be changed |

### L. Retiring and Restoring Categories

| ID | Test | Steps | Expected result |
|---|---|---|---|
| L-01 | Retire asks first | Open `zz-test-pets` (with a budget) → **Retire** | "Retire zz-test-pets?" explains it won't be offered for new expenses and past expenses keep it, plus a paragraph about its budget |
| L-02 | Retire and Undo | Confirm **Retire category** → tap **Undo** | "zz-test-pets retired · Undo" appears; after Undo it's back in the list with its budget |
| L-03 | Retired group | Retire it again and let the bar time out | A collapsed "Retired (1)" row appears at the bottom. **Show** lists it in grey with its budget and a **Restore** button |
| L-04 | Not offered for new expenses | Parse a new `[TEST]` expense and open the category list | The retired category isn't in the list |
| L-05 | Past expenses keep it | Before retiring, log a `[TEST]` expense in it. After retiring, check History | The expense still shows the category name |
| L-06 | Editing an old expense | Open that expense, change the amount → Save | The category shows "zz-test-pets (retired)"; the expense saves normally |
| L-07 | Can't move other expenses into it | Open a different expense and look at its category list | The retired category isn't offered |
| L-08 | Summary while retired | Look at this month's Summary | The retired category's spending still counts, as a plain bar with no budget or pace note |
| L-09 | Restore button | Categories & budgets → Retired → **Restore** | It returns to the main list with its budget; the Retired row disappears when empty |
| L-10 | Re-adding the name restores it | Retire it, then **Add category** and type `ZZ-TEST-PETS` | A note says it was retired and saving restores it, with or without a budget depending on the budget field. The button reads **Restore**. After saving, it's back with its past expenses |
| L-11 | Retired categories can't be renamed | Via the API, try to rename a retired category | Refused with "That name is already in use, or this category has been retired." |

### M. Look and Layout

| ID | Test | Steps | Expected result |
|---|---|---|---|
| M-01 | Light and dark | Settings → Appearance → **Light**, then **Dark** | The app switches theme at once. Reload: the choice is kept on that device |
| M-02 | System follows the device | Settings → Appearance → **System**, then switch the device between light and dark | The app follows the device. A new device starts on System |
| M-03 | Pinned tops | Scroll on each of the four tabs | Each tab's heading and main control stay at the top |
| M-04 | Phone layout | Use a phone, or a browser window narrower than 768 pixels | One column; edit sheets slide up from the bottom |
| M-05 | Tablet and computer | Use windows 768, 1,024 and 1,280 pixels wide or more | The app widens to about 820, 920 and 1,000 pixels; Log and Summary show two columns; edit sheets and confirmations open as centred dialogs |
| M-06 | No sideways scrolling | Check each screen at phone width | Nothing makes the page scroll sideways |

### N. Phones

| ID | Test | Steps | Expected result |
|---|---|---|---|
| N-01 | Add to home screen **[Phone]** | iPhone Safari: Share → Add to Home Screen. Android Chrome: ⋮ → Add to Home screen or Install app | A Hercules icon appears; it opens full-screen like an app |
| N-02 | No zooming on fields **[Phone]** | On an iPhone, open an expense and tap Merchant, Date, Remarks and Category, then a category's Name and Budget | The page stays at its normal size; no need to zoom back out |
| N-03 | Pinch to zoom still works **[Phone]** | Pinch on any screen | The page zooms, and zooms back |
| N-04 | Staying signed in **[Phone]** | Close the app and reopen it the next day | Still signed in (sign-in lasts up to 90 days) |

### O. Offline, Limits and Errors

| ID | Test | Steps | Expected result |
|---|---|---|---|
| O-01 | Offline | Turn on airplane mode, open the Log screen and type something | "You're offline. Your text is kept — parse it when you're back online." Parse and Save are dimmed. Back online, Parse works and the text is still there |
| O-02 | Daily parse limit | Locally, parse 100 `[TEST]` expenses within 24 hours (or ask Claude to set up the limit), then parse once more | "Daily limit of 100 entries reached. Please try again tomorrow." The typed text stays in the box |
| O-03 | Category limit | Locally, with 50 active categories, add another | "That name is already in use, or you've reached the limit of 50 categories." |
| O-04 | Stale screen | Delete an expense on one device, then try to save an edit to it on another device that still shows it | "This expense or its category is no longer available. Please refresh and try again." |

### P. Data Safety Checks (Database)

These need a look at the local database; ask Claude to run them.

| ID | Test | Expected result |
|---|---|---|
| P-01 | Saved expense | A saved expense has the original typed text, the amount, currency, category, merchant, date, remarks, and the "edited" flag set correctly |
| P-02 | Soft delete | A deleted expense keeps its row, with `deleted_at` set; Undo clears it again |
| P-03 | Retire keeps the row | A retired category keeps its row and budget, with `is_active` set to false |
| P-04 | Per-person records | Every expense and category belongs to exactly one person's account |

### Q. Settings

| ID | Test | Steps | Expected result |
|---|---|---|---|
| Q-01 | Tab bar | Look at the tabs at the bottom | Log, History, Summary and **Settings** (a gear). There's no Categories tab |
| Q-02 | Settings list | Open **Settings** | Groups for Spending (**Categories & budgets**), Appearance and Account, then the version and last-updated time |
| Q-03 | Category count | Look at the Categories & budgets row; then add or retire a `zz-test-` category and look again | It shows the number of categories in use and how many have a budget, and updates after the change |
| Q-04 | Opening and going back | Tap **Categories & budgets**, then **‹ Settings** | The Categories & budgets page opens, with the same list, Add category and Retired group as before; "‹ Settings" returns to the list |
| Q-05 | Returning to Settings | Open Categories & budgets, switch to Log, then tap Settings | The Settings list shows, not Categories & budgets |
| Q-06 | No theme icon on screens | Look at the top of Log, History and Summary | There's no sun or moon icon |
| Q-07 | Account | Look at the Account group | Your email address, and Sign out (see A-05). Summary no longer has a sign-out section at the bottom |
| Q-08 | Version and last updated | Look below Account; compare with `CHANGELOG.md` and the latest deploy | The version number matches the newest entry in the changelog (for example 1.0.0), followed by a short code for the exact version and the date and time of the latest deploy |

### R. Downloading Expenses (CSV)

| ID | Test | Steps | Expected result |
|---|---|---|---|
| R-01 | Button placement | Open Summary | A **CSV** button sits beside the month's total |
| R-02 | This month | On this month, tap **CSV**; open the file in a spreadsheet | The file `hercules-expenses-YYYY-MM.csv` downloads (a phone shows its save or share options). A message names the file. It has a header row and one row per expense logged this month, oldest first, and the Amount column adds up to Summary's total |
| R-03 | Last month | Switch to last month, tap **CSV** | The file is named for last month and contains the whole month; its total matches last month's Summary |
| R-04 | Columns | Look at the header row and a few rows | Date, Category, Merchant, Amount, Currency, Remarks, What you typed, Edited (Yes/No), Logged at (Singapore time); amounts have two decimal places |
| R-05 | Deleted expenses left out | Delete a `[TEST]` expense, then download | The deleted expense isn't in the file |
| R-06 | Commas, quotes and symbols | Save `[TEST] lunch, with "Ann" café 9.50` with remark `=SUM(1)`, then download and open | The text shows exactly as typed, including the comma, quotes and é; the remark shows as text (`'=SUM(1)`), not as a calculated result |
| R-07 | Empty month | Download a month with no expenses (on a fresh test account, or via the API for an earlier month) | The file downloads with the header row only |
| R-08 | Signed out | While signed out, open `/api/expenses/export?month=` with this month | `{"error":"Not signed in"}`; no file |
| R-09 | Another person's data | As a second test account (see A-07), download the same month | Only that account's expenses are in the file |

---

## 6. After Every Deploy (Live App)

A quick check on the live app after each deploy. Use your own account, and remove anything you add.

| ID | Check | Expected result |
|---|---|---|
| S-01 | Sign in with Google | The Log screen opens |
| S-02 | Each tab opens | Log, History, Summary and Settings all load with your data, and Settings → Categories & budgets lists your categories |
| S-03 | Log and remove a test expense | Parse `[TEST] coffee 1.00` → Save → it appears under Today → open it → Delete → confirm. The expense disappears and the totals return to what they were |
| S-04 | Summary figures | This month's total and pace notes look right for your spending |
| S-05 | Signed-out data check | In a private browser window, open `/api/expenses?month=` with this month (for example `2026-11`) on the live address | `{"error":"Not signed in"}` |
| S-06 | User guide | Open https://lionellam.github.io/hercules/ | The user guide loads |
| S-07 | Version | Settings → look below Account | After a release, the version matches the newest entry in `CHANGELOG.md`, the short code matches the latest commit, and "Last updated" is the time of this deploy |

The test expense from S-03 stays in the database as a deleted record. That's harmless, but it can be removed by Lionel if wanted.

---

## 7. Results Record

Copy this table for each run.

```
Date:            Tester:
App:             Local / Live (version or commit: ________)
Device/browser:

| ID   | Result (Pass / Fail / Not run) | Notes |
|------|--------------------------------|-------|
| A-01 |                                |       |
| ...  |                                |       |
```
