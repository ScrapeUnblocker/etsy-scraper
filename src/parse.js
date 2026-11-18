// Pure shaping helpers for the raw items returned by the ScrapeUnblocker
// getPageSource parsed_data API. No network access here, so these are trivial
// to unit-test.

/**
 * Parse a discount label such as "(60% off)" into a number (60).
 * Returns null when there is no percentage to extract.
 * @param {unknown} raw
 * @returns {number|null}
 */
export function parseDiscount(raw) {
  if (raw == null) return null;
  const match = String(raw).match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

/**
 * Read a money amount from one parsed_data price field. The API shapes it as
 * { value, currency }, but a bare number or a price string ("$31.50") is
 * accepted too.
 * @param {unknown} raw
 * @returns {number|null}
 */
function amountOf(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") return amountOf(raw.value);
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const match = String(raw).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/**
 * A 3-letter currency code from a price object or a top-level currency field.
 * Symbols such as "$" are ambiguous across currencies, so they are ignored.
 * @param {unknown} raw
 * @returns {string|null}
 */
function currencyOf(raw) {
  const code = raw && typeof raw === "object" ? raw.currency : raw;
  return typeof code === "string" && /^[A-Za-z]{3}$/.test(code.trim())
    ? code.trim().toUpperCase()
    : null;
}

/**
 * The parsed_data API returns an Etsy card's price in one of two shapes,
 * depending on which part of the page it reads:
 *
 * - from the listing cards: `sale_price` and/or `original_price`
 *   (the struck-through price), each { value, currency };
 * - from the page's schema.org data: a single `price` { value, currency }
 *   plus a top-level `currency` code.
 *
 * Both are handled, so a search keeps its prices whichever shape comes back.
 * `price` is the best available *current* price: the sale price when present,
 * otherwise the single `price`, otherwise the original price.
 * @param {Record<string, any>} item
 */
export function pickPrice(item) {
  const sale = amountOf(item?.sale_price);
  const single = amountOf(item?.price);
  const original = amountOf(item?.original_price);
  const currency =
    currencyOf(item?.sale_price) ??
    currencyOf(item?.price) ??
    currencyOf(item?.original_price) ??
    currencyOf(item?.currency);
  return {
    price: sale ?? single ?? original ?? null,
    salePrice: sale ?? single,
    originalPrice: original,
    currency,
  };
}

/**
 * Normalize one raw parsed_data item into a flat, stable record.
 * @param {Record<string, any>} item
 */
export function normalizeItem(item) {
  const { price, salePrice, originalPrice, currency } = pickPrice(item);
  return {
    title: item?.title ?? null,
    shop: item?.shop_name ?? null,
    price,
    salePrice,
    originalPrice,
    currency,
    discountPercent: parseDiscount(item?.discount_pct ?? item?.discount),
    url: item?.url ?? null,
    image: item?.image ?? null,
  };
}
