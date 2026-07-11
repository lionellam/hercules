# Hercules POC — Test Plan

```
Version 1.0
Date: 12 July 2026
```

## Pre-conditions

- Ollama is running locally with `phi4-mini` pulled
- Virtual environment is active: `source venv/bin/activate` from `poc/`
- Run from the `poc/` directory: `python cli.py`

---

## Test Cases

| ID | Description | Input / Steps | Expected Result |
|---|---|---|---|
| TC-01 | Application starts cleanly | Run `python cli.py`, then `quit` | Banner prints, 10 categories loaded, hint text lists `history`, `summary`, `quit` |
| TC-02 | Log expense with no date mentioned | `coffee at Ya Kun $4.50` → save | Date field shows today in `YYYY-MM-DD`; amount, category, merchant parsed correctly |
| TC-03 | Log expense with relative date | `$12 grab ride yesterday` → save | Date resolves to yesterday in `YYYY-MM-DD` using the correct year |
| TC-04 | Edit a field on confirmation screen | Any expense → press `2` to edit category → pick different category → save | Record saved with `was_edited` flag; `✏️` visible in history |
| TC-05 | Discard an expense | Any expense → press `d` on confirmation screen | "Expense discarded" message; no record saved |
| TC-06 | History command | Type `history` or `h` | Last 10 expenses shown with date, amount, currency, category, merchant |
| TC-07 | Month-to-date summary | Log at least 2 expenses, then type `summary` or `s` | Table shows categories with total and count; grand total row; correct month label; only current month's expenses included |
| TC-08 | Summary with no data this month | Fresh DB or no expenses this month → type `summary` | "No expenses recorded for [Month Year] yet." — no crash |
| TC-09 | Invalid/nonsense input | `abc xyz` | SLM handles gracefully (returns `Other`, null amount) or shows `⚠️ Parsing failed` — no crash |
| TC-10 | Quit | Type `quit`, `exit`, or `q` | "Goodbye! 👋", clean exit |
