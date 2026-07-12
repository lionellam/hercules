# db.py
# Handles all database operations: creating the table, saving expenses,
# and retrieving past records.
#
# We use SQLite — a lightweight database stored as a single file on disk.
# Python's built-in sqlite3 library handles everything; no installation needed.

import sqlite3
from datetime import datetime
from models import Expense

# Path to the SQLite database file.
# The file is created automatically the first time the app runs.
DB_PATH = "data/expenses.db"


def get_connection() -> sqlite3.Connection:
    """
    Opens (or creates) the SQLite database file and returns a connection object.
    The connection is what we use to send commands to the database.
    """
    # sqlite3.connect() opens the file at DB_PATH.
    # If it doesn't exist yet, SQLite creates it automatically.
    conn = sqlite3.connect(DB_PATH)

    # Row factory makes query results return as dictionaries (column: value)
    # rather than plain tuples, which is easier to work with.
    conn.row_factory = sqlite3.Row

    return conn


def init_db():
    """
    Creates the expenses table if it doesn't already exist.
    Safe to call every time the app starts — 'IF NOT EXISTS' prevents errors
    if the table was already created in a previous run.
    """
    conn = get_connection()

    # A cursor is the object we use to execute SQL commands.
    cursor = conn.cursor()

    # CREATE TABLE IF NOT EXISTS: creates the table only if it's not there yet.
    # Each column has a name and a type (TEXT, REAL, INTEGER, BOOLEAN).
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,  -- unique ID, auto-assigned
            raw_input   TEXT NOT NULL,                      -- original text the user typed
            amount      REAL NOT NULL,                      -- expense amount as a decimal number
            currency    TEXT NOT NULL,                      -- e.g. "SGD"
            category    TEXT NOT NULL,                      -- chosen category
            merchant    TEXT,                               -- shop/restaurant name (optional)
            date        TEXT NOT NULL,                      -- date description or value
            remarks     TEXT,                               -- optional user notes
            was_edited  INTEGER NOT NULL DEFAULT 0,         -- 1 if user edited parsed fields, 0 if not
            created_at  TEXT NOT NULL                       -- timestamp when the record was saved
        )
    """)

    # commit() saves the changes to disk.
    conn.commit()
    conn.close()


def save_expense(expense: Expense) -> int:
    """
    Saves a confirmed Expense record to the database.
    Returns the ID of the newly created row.

    Parameters:
        expense - An Expense object containing all the confirmed fields
    """
    conn = get_connection()
    cursor = conn.cursor()

    # INSERT INTO adds a new row to the expenses table.
    # The ? placeholders are filled in by the tuple in the second argument.
    # This approach (parameterised queries) is safer than string formatting
    # because it prevents SQL injection attacks.
    cursor.execute("""
        INSERT INTO expenses
            (raw_input, amount, currency, category, merchant, date, remarks, was_edited, created_at)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        expense.raw_input,
        expense.amount,
        expense.currency,
        expense.category,
        expense.merchant,
        expense.date,
        expense.remarks,
        1 if expense.was_edited else 0,       # SQLite stores booleans as 1/0
        datetime.now().isoformat()            # current timestamp in ISO format
    ))

    conn.commit()

    # cursor.lastrowid gives us the auto-assigned ID of the row we just inserted.
    new_id = cursor.lastrowid
    conn.close()

    return new_id


def get_monthly_summary() -> list[dict]:
    """
    Returns total spending grouped by category for the current calendar month.
    Only includes expenses whose date field is in YYYY-MM-DD format and falls
    within the current year and month.
    """
    from datetime import date

    # Build the year-month prefix for the current month, e.g. "2026-07"
    month_prefix = date.today().strftime("%Y-%m")

    conn = get_connection()
    cursor = conn.cursor()

    # LIKE 'YYYY-MM-%' matches any date string that starts with the current year-month.
    # SUM(amount) adds up all amounts per category.
    # COUNT(*) tells us how many individual expenses make up that total.
    cursor.execute("""
        SELECT category,
               SUM(amount)  AS total,
               COUNT(*)     AS count
        FROM expenses
        WHERE date LIKE ?
        GROUP BY category
        ORDER BY total DESC
    """, (month_prefix + "-%",))

    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return rows


def get_monthly_expenses() -> list[dict]:
    """
    Retrieves all expenses for the current calendar month, ordered by date then creation time.
    """
    from datetime import date

    month_prefix = date.today().strftime("%Y-%m")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM expenses
        WHERE date LIKE ?
        ORDER BY date ASC, created_at ASC
    """, (month_prefix + "-%",))

    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return rows


def get_recent_expenses(limit: int = 10) -> list[dict]:
    """
    Retrieves the most recent expenses from the database.
    Returns a list of dictionaries, one per row.

    Parameters:
        limit - How many records to return (default: 10)
    """
    conn = get_connection()
    cursor = conn.cursor()

    # SELECT fetches rows. ORDER BY created_at DESC gives newest first.
    # LIMIT restricts how many rows are returned.
    cursor.execute("""
        SELECT * FROM expenses
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))

    # fetchall() retrieves all matching rows.
    # dict(row) converts each sqlite3.Row into a plain Python dictionary.
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return rows
