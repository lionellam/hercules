// Date helpers shared by the server and the screens. Dates are 'YYYY-MM-DD' strings and months 'YYYY-MM'.

const pad = (n: number) => String(n).padStart(2, "0");

// --- Checks ---

export const MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;

// A real calendar date in 2000–2099, so e.g. 2026-02-31 is refused here rather than failing in the database.
export function isRealDate(s: string) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// --- Arithmetic ---

export function shiftDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// First day of the month, and first day of the next month (exclusive end)
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  return [`${month}-01`, `${next}-01`];
}

export const daysInMonth = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};

// --- The device's local calendar (screens only) ---

export const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// This month (0), last month (-1), and so on
export const monthKey = (offset: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// --- Display ---

export const monthLabel = (month: string, opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString("en-SG", opts);

// "Sun, 8 Nov"
export const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });

// "Sun, 8 Nov" for a day of the given month
export const shortDay = (month: string, day: number) => dayLabel(`${month}-${pad(day)}`);

// "8 Nov"
export const dayMonth = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
