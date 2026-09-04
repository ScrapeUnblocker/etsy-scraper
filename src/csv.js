// Minimal, dependency-free CSV serialization for normalized Etsy records.

/** Column order used for CSV export. */
export const COLUMNS = [
  "title",
  "shop",
  "price",
  "salePrice",
  "originalPrice",
  "currency",
  "discountPercent",
  "url",
  "image",
];

/**
 * Escape a single CSV field per RFC 4180: wrap in quotes when it contains a
 * comma, quote or newline, and double any embedded quotes.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCsv(value) {
  if (value == null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Serialize an array of records to a CSV string (with a header row).
 * @param {Array<Record<string, unknown>>} records
 * @param {string[]} [columns]
 * @returns {string}
 */
export function toCsv(records, columns = COLUMNS) {
  const header = columns.join(",");
  const rows = records.map((record) => columns.map((col) => escapeCsv(record[col])).join(","));
  return [header, ...rows].join("\n") + "\n";
}
