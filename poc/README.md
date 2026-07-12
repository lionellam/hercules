# Project Hercules — CLI Proof of Concept

A single-user command-line expense tracker. Type an expense in plain language, review the parsed fields, confirm, and it's saved to a local SQLite database.

## Prerequisites

- Python 3.11+
- [Ollama](https://ollama.com) installed and running
- Phi-4 model pulled

```bash
ollama pull phi4
ollama serve
```

## Setup

From the `poc/` directory:

```bash
pip install -r requirements.txt
```

## Running

```bash
cd [codepath]/hercules/poc
source venv/bin/activate
python cli.py
```

## Usage

At the prompt, type any natural language expense description:

```
💬  Log expense: grabbed a coffee at Ya Kun for $3.50 this morning
💬  Log expense: $45 grab ride to Changi yesterday
💬  Log expense: bought groceries at NTUC, spent about 80 bucks
```

The app will parse the input, show you the extracted fields, and let you confirm, edit any field, or discard before anything is saved.

**Commands:**
- `history` or `h` — view the 10 most recent saved expenses
- `quit`, `exit`, or `q` — exit the app

## Model Configuration

By default the app uses the `phi4` model. If your Ollama installation uses a different tag (e.g. `phi4:14b`), set the `HERCULES_MODEL` environment variable before running:

```bash
export HERCULES_MODEL=phi4:14b
python cli.py
```

Or inline:

```bash
HERCULES_MODEL=phi4:14b python cli.py
```

## Customising Categories

Edit `data/categories.txt` — one category per line. Changes take effect next time you start the app.

## File Structure

```
poc/
  cli.py              # entry point — run this
  parser.py           # SLM call and JSON parsing
  db.py               # SQLite database operations
  models.py           # data models (ParsedExpense, Expense)
  prompts/
    parse_expense.txt # prompt template sent to Phi-4
  data/
    categories.txt    # expense categories (editable)
    expenses.db       # SQLite database (auto-created on first run)
  requirements.txt
  README.md
```
