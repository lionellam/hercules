# cli.py
# The entry point for the Hercules POC.
# This is the file you run to start the application: python cli.py
#
# It handles:
#   1. Loading categories from the text file
#   2. Taking the user's expense input
#   3. Calling the parser (SLM) to extract structured fields
#   4. Showing a confirmation screen for the user to review and edit
#   5. Saving the confirmed expense to the database
#   6. Optionally showing recent expenses

import sys
import os

# We need to tell Python where to find our other files (models, parser, db).
# This line adds the current directory to Python's module search path.
sys.path.insert(0, os.path.dirname(__file__))

from models import ParsedExpense, Expense
from parser import parse_expense
from db import init_db, save_expense, get_recent_expenses, get_monthly_summary, get_monthly_expenses


# ─────────────────────────────────────────────
# CATEGORIES
# ─────────────────────────────────────────────

CATEGORIES_PATH = "data/categories.txt"


def load_categories() -> list[str]:
    """
    Reads expense categories from the plain text file.
    Each non-empty line in the file is one category.
    """
    with open(CATEGORIES_PATH, "r") as f:
        # strip() removes leading/trailing whitespace and newlines from each line.
        # The 'if line.strip()' part skips blank lines.
        return [line.strip() for line in f if line.strip()]


# ─────────────────────────────────────────────
# DISPLAY HELPERS
# ─────────────────────────────────────────────

def print_divider():
    """Prints a horizontal line to visually separate sections in the terminal."""
    print("\n" + "─" * 50 + "\n")


def display_parsed(parsed: ParsedExpense):
    """
    Prints the parsed expense fields in a readable format.
    This is the confirmation screen the user sees before saving.
    """
    print_divider()
    print("📋  PARSED EXPENSE — please review:")
    print(f"  [1] Amount   : {parsed.amount} {parsed.currency}")
    print(f"  [2] Category : {parsed.category}")
    print(f"  [3] Merchant : {parsed.merchant or '—'}")
    print(f"  [4] Date     : {parsed.date}")
    print(f"  [5] Remarks  : {parsed.remarks or '—'}")
    print_divider()


# ─────────────────────────────────────────────
# CONFIRMATION SCREEN
# ─────────────────────────────────────────────

def confirm_or_edit(parsed: ParsedExpense, categories: list[str]) -> Expense | None:
    """
    Shows the parsed expense and lets the user confirm, edit, or discard it.

    Returns an Expense object ready for saving, or None if the user discards.

    Parameters:
        parsed     - The ParsedExpense returned by the SLM
        categories - The full list of categories (used if the user edits the category)
    """

    # Track whether the user changes anything.
    # This gets recorded in the 'was_edited' field of the saved record.
    was_edited = False

    # Work with a copy of the parsed values so we can modify them.
    amount   = parsed.amount
    currency = parsed.currency
    category = parsed.category
    merchant = parsed.merchant
    date     = parsed.date
    remarks  = parsed.remarks

    while True:
        display_parsed(ParsedExpense(
            amount=amount,
            currency=currency,
            category=category,
            merchant=merchant,
            date=date,
            remarks=remarks
        ))

        print("Options:  [s] Save   [1–5] Edit field   [d] Discard")
        choice = input("Your choice: ").strip().lower()

        if choice == "s":
            # User is happy — check that amount is present before saving.
            if amount is None:
                print("⚠️  Amount is required. Please edit field [1] before saving.")
                continue

            if category is None or category not in categories:
                print("⚠️  Category is required. Please edit field [2] before saving.")
                continue

            # Build and return the final Expense object.
            return Expense(
                raw_input=parsed.raw_input if hasattr(parsed, 'raw_input') else "",
                amount=amount,
                currency=currency or "SGD",
                category=category,
                merchant=merchant,
                date=date or "today",
                remarks=remarks,
                was_edited=was_edited
            )

        elif choice == "d":
            # User chose to discard — return None to signal cancellation.
            print("\n🗑️  Expense discarded.")
            return None

        elif choice == "1":
            # Edit amount
            val = input(f"  New amount (current: {amount}): ").strip()
            try:
                amount = float(val)
                was_edited = True
            except ValueError:
                print("  ⚠️  Please enter a number (e.g. 12.50)")

        elif choice == "2":
            # Edit category — show the full list so the user can pick
            print("\n  Available categories:")
            for i, cat in enumerate(categories, 1):
                print(f"    {i}. {cat}")
            val = input("  Enter category number or name: ").strip()
            # Try to interpret as a number first (pick by index)
            try:
                idx = int(val) - 1
                if 0 <= idx < len(categories):
                    category = categories[idx]
                    was_edited = True
                else:
                    print("  ⚠️  Number out of range.")
            except ValueError:
                # Otherwise accept it as a typed name if it matches
                if val in categories:
                    category = val
                    was_edited = True
                else:
                    print(f"  ⚠️  '{val}' is not in the category list.")

        elif choice == "3":
            # Edit merchant
            val = input(f"  New merchant (current: {merchant or '—'}): ").strip()
            merchant = val if val else None
            was_edited = True

        elif choice == "4":
            # Edit date
            val = input(f"  New date (current: {date}): ").strip()
            date = val if val else date
            was_edited = True

        elif choice == "5":
            # Edit remarks
            val = input(f"  New remarks (current: {remarks or '—'}): ").strip()
            remarks = val if val else None
            was_edited = True

        else:
            print("  ⚠️  Invalid choice. Enter s, d, or a number 1–5.")


# ─────────────────────────────────────────────
# MONTHLY SUMMARY VIEW
# ─────────────────────────────────────────────

def show_monthly_summary():
    """Prints a month-to-date spending summary grouped by category."""
    from datetime import date

    rows = get_monthly_summary()
    month_label = date.today().strftime("%B %Y")   # e.g. "July 2026"

    if not rows:
        print(f"\nNo expenses recorded for {month_label} yet.")
        return

    print_divider()
    print(f"📊  MONTH-TO-DATE SUMMARY — {month_label}:\n")
    print(f"  {'Category':<22} {'Expenses':>9}  {'Total (SGD)':>12}")
    print(f"  {'─' * 22}  {'─' * 9}  {'─' * 12}")

    grand_total = 0.0
    for row in rows:
        print(
            f"  {row['category']:<22} {row['count']:>9}  {row['total']:>12.2f}"
        )
        grand_total += row["total"]

    print(f"  {'─' * 22}  {'─' * 9}  {'─' * 12}")
    print(f"  {'TOTAL':<22} {'':>9}  {grand_total:>12.2f}")
    print_divider()


# ─────────────────────────────────────────────
# RECENT EXPENSES VIEW
# ─────────────────────────────────────────────

def show_recent_expenses():
    """Fetches and prints all expenses for the current calendar month."""
    from datetime import date

    month_label = date.today().strftime("%B %Y")
    rows = get_monthly_expenses()
    if not rows:
        print(f"\nNo expenses recorded for {month_label} yet.")
        return

    print_divider()
    print(f"📂  EXPENSES — {month_label}:\n")
    for row in rows:
        edited_flag = " ✏️" if row["was_edited"] else ""
        print(
            f"  [{row['id']}] {row['date']:<12} "
            f"{row['amount']:>8.2f} {row['currency']}  "
            f"{row['category']:<20} "
            f"{row['merchant'] or '—':<20}"
            f"{edited_flag}"
        )
    print_divider()


# ─────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────

def main():
    """
    The main application loop.
    Runs continuously until the user types 'quit'.
    """

    print("\n╔══════════════════════════════════╗")
    print("║   Project Hercules — POC v0.1    ║")
    print("║   Expense Tracker (CLI) — Phi-4  ║")
    print("╚══════════════════════════════════╝")

    # Set up the database on first run (creates the table if it doesn't exist).
    init_db()

    # Load categories from the text file once at startup.
    categories = load_categories()
    print(f"\n✅  Loaded {len(categories)} categories.")
    print("    Type an expense in plain language, or:")
    print("    'history'  (h) to see recent expenses")
    print("    'summary'  (s) to see month-to-date totals by category")
    print("    'quit'     (q) to exit\n")

    # Keep looping until the user decides to quit.
    while True:
        # Get the user's input. strip() removes accidental leading/trailing spaces.
        raw = input("💬  Log expense: ").strip()

        # Handle special commands first.
        if raw.lower() in ("quit", "exit", "q"):
            print("\nGoodbye! 👋\n")
            break

        if raw.lower() in ("history", "h"):
            show_recent_expenses()
            continue

        if raw.lower() in ("summary", "s"):
            show_monthly_summary()
            continue

        # Ignore blank input.
        if not raw:
            continue

        # Send the raw input to the parser (the SLM call).
        parsed = parse_expense(raw, categories)

        # If parsing failed (model returned bad JSON), skip to the next input.
        if parsed is None:
            print("⚠️  Parsing failed. Please try rephrasing your expense.")
            continue

        # Attach the original raw input to the parsed object so it can be stored verbatim.
        # model_copy() creates a new object with the updated field — Pydantic models
        # are immutable by default, so we can't just do parsed.raw_input = raw.
        parsed = parsed.model_copy(update={"raw_input": raw})

        # Show the confirmation screen and let the user review/edit/save/discard.
        expense = confirm_or_edit(parsed, categories)

        # If the user confirmed (didn't discard), save to the database.
        if expense is not None:
            record_id = save_expense(expense)
            edited_note = " (with edits)" if expense.was_edited else ""
            print(f"\n✅  Expense saved{edited_note}. Record ID: {record_id}\n")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

# This block runs only when the file is executed directly (python cli.py).
# It won't run if this file is imported as a module by another script.
if __name__ == "__main__":
    main()
