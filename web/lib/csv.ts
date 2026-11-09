// CSV for the monthly download (Specification 4.5)

// Text starting with these could be run as a formula when the file is opened in a spreadsheet
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string) {
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// UTF-8 byte-order mark first, so Excel shows symbols such as "é" correctly
export function toCsv(rows: string[][]) {
  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
