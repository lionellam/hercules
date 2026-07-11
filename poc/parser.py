# parser.py
# Responsible for the single AI step in the application:
# taking the user's raw expense text and asking the SLM to parse it
# into structured fields.
#
# Everything in this file is the "cognitive" boundary — the only place
# in the POC where the language model is involved. All other logic
# (validation, storage, display) is handled by deterministic code elsewhere.

import json
import datetime
import ollama
from models import ParsedExpense

# The name of the Ollama model to use.
# This must match what you pulled with: ollama pull phi4-mini
MODEL_NAME = "phi4-mini"

# Path to the prompt template file.
# Keeping the prompt in a separate text file makes it easy to
# tweak the instructions without touching Python code.
PROMPT_TEMPLATE_PATH = "prompts/parse_expense.txt"


def load_prompt_template() -> str:
    """
    Reads the prompt template from disk and returns it as a string.
    The template contains placeholder variables like {raw_input} and {categories}
    that we fill in before sending to the model.
    """
    with open(PROMPT_TEMPLATE_PATH, "r") as f:
        return f.read()


def parse_expense(raw_input: str, categories: list[str]) -> ParsedExpense | None:
    """
    The main parsing function. Takes the user's raw text and the list of
    available categories, sends them to the SLM, and returns a ParsedExpense
    object with the extracted fields.

    Returns None if the model's response cannot be parsed as valid JSON.

    Parameters:
        raw_input   - The exact text the user typed, e.g. "coffee at MBS $6.50"
        categories  - The list of category names loaded from categories.txt
    """

    # Format the category list as a numbered list for the prompt.
    # This makes it clearer for the model to select from.
    category_list = "\n".join(f"- {c}" for c in categories)

    # Load the prompt template and substitute in the actual values.
    # We use simple string replacement rather than str.format() because the
    # template also contains JSON curly braces {} which would confuse format().
    # Resolve today's date so the SLM can interpret relative terms like "yesterday".
    today_str = datetime.date.today().isoformat()

    template = load_prompt_template()
    prompt = (
        template
        .replace("{raw_input}", raw_input)
        .replace("{categories}", category_list)
        .replace("{today}", today_str)
    )

    print("\n⏳ Sending to Phi-4-mini for parsing...")

    # Call the Ollama service running locally.
    # ollama.generate() sends an HTTP request to http://localhost:11434
    # and waits for the model to return a response.
    response = ollama.generate(model=MODEL_NAME, prompt=prompt)

    # The model's reply is a plain string stored in response.response.
    # We expect it to be a JSON object, so we try to parse it.
    raw_response = response.response.strip()

    # Some models wrap their JSON output in markdown code fences like:
    #   ```json
    #   { ... }
    #   ```
    # We strip those fences out before trying to parse the JSON.
    if raw_response.startswith("```"):
        # Split on newlines, drop the first line (```json) and last line (```)
        lines = raw_response.splitlines()
        raw_response = "\n".join(lines[1:-1]).strip()

    try:
        # json.loads() converts the JSON string into a Python dictionary.
        data = json.loads(raw_response)

        # Pydantic's model_validate() takes the dictionary and creates
        # a ParsedExpense object, applying type checks and defaults.
        return ParsedExpense.model_validate(data)

    except (json.JSONDecodeError, ValueError) as e:
        # If the model returned something that isn't valid JSON,
        # we print a warning and return None so the caller can handle it.
        print(f"\n⚠️  Could not parse model response: {e}")
        print(f"Raw response was:\n{raw_response}")
        return None
