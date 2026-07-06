# models.py
# Defines the data structures used throughout the POC.
# Pydantic models give us type checking and easy JSON parsing for free.

from pydantic import BaseModel
from typing import Optional


class ParsedExpense(BaseModel):
    """
    Represents the structured data returned by the SLM after parsing
    the user's raw natural language input.

    All fields are Optional (can be None/null) because the model may not
    be able to extract every field from every input.
    """

    raw_input: Optional[str] = None      # The original text the user typed (set by cli.py after parsing)
    amount: Optional[float] = None       # The expense amount, e.g. 12.50
    currency: Optional[str] = "SGD"      # Currency code, defaults to SGD
    category: Optional[str] = None       # One of the categories from categories.txt
    merchant: Optional[str] = None       # Shop/restaurant name, if mentioned
    date: Optional[str] = "today"        # Date description, e.g. "today", "yesterday"
    remarks: Optional[str] = None        # Any extra context from the user's input


class Expense(BaseModel):
    """
    Represents a fully confirmed expense record ready to be saved to the database.
    This is what gets written to SQLite after the user reviews and confirms.
    """

    raw_input: str                        # The original text the user typed — stored verbatim
    amount: float                         # Confirmed expense amount
    currency: str                         # Currency code
    category: str                         # Confirmed category
    merchant: Optional[str] = None        # Merchant name, if provided
    date: str                             # Date of expense
    remarks: Optional[str] = None         # Optional notes from the user
    was_edited: bool = False              # True if the user changed any parsed field
