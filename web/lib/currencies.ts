// The default currency (Specification 4.6): the 20 currencies offered, and how a parsed currency is decided.
// Used by the server when parsing and by the screens, so the list and rules live in one place.

export const CURRENCIES: { code: string; name: string }[] = [
  { code: "SGD", name: "Singapore dollar" },
  { code: "MYR", name: "Malaysian ringgit" },
  { code: "IDR", name: "Indonesian rupiah" },
  { code: "THB", name: "Thai baht" },
  { code: "PHP", name: "Philippine peso" },
  { code: "VND", name: "Vietnamese dong" },
  { code: "CNY", name: "Chinese yuan" },
  { code: "HKD", name: "Hong Kong dollar" },
  { code: "TWD", name: "New Taiwan dollar" },
  { code: "JPY", name: "Japanese yen" },
  { code: "KRW", name: "South Korean won" },
  { code: "INR", name: "Indian rupee" },
  { code: "AED", name: "UAE dirham" },
  { code: "AUD", name: "Australian dollar" },
  { code: "NZD", name: "New Zealand dollar" },
  { code: "USD", name: "US dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
  { code: "CHF", name: "Swiss franc" },
  { code: "CAD", name: "Canadian dollar" },
];

export const DEFAULT_CURRENCY = "SGD";

export const isListedCurrency = (code: string) => CURRENCIES.some((c) => c.code === code);

export const currencyName = (code: string) => CURRENCIES.find((c) => c.code === code)?.name ?? code;

// Currencies a plain "$" can stand for; anything else reads "$" as US dollars
export const DOLLARS = new Set(["SGD", "HKD", "TWD", "AUD", "NZD", "USD", "CAD"]);

// The text mentions US dollars in so many words, so a USD answer can be trusted
const NAMES_US_DOLLARS = /\bUSD\b|US\s?\$|\bUS\s*dollars?\b|\bU\.S\.\s*dollars?\b|\bAmerican\s+dollars?\b/i;

// Decides an expense's currency from the model's answer (a code, or null when the text names none),
// the text typed and the person's default
export function resolveCurrency(fromModel: string | null, rawText: string, defaultCurrency: string): string {
  let code = fromModel?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{3}$/.test(code)) code = "";
  // A plain "$" is never taken as US dollars unless the text says so
  if (code === "USD" && !NAMES_US_DOLLARS.test(rawText)) code = "";
  if (code) return code;
  if (rawText.includes("$")) return DOLLARS.has(defaultCurrency) ? defaultCurrency : "USD";
  if (rawText.includes("¥")) return defaultCurrency === "JPY" || defaultCurrency === "CNY" ? defaultCurrency : "JPY";
  return defaultCurrency;
}
