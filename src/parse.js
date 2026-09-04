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
 * Etsy listings carry a sale price and/or an original (struck-through) price,
 * each shaped as { value, currency }. The API often leaves currency null while
 * still returning the numeric value, so we fall back across both objects.
 *
 * `price` is the best available *current* price: the sale price when present,
 * otherwise the original price.
 * @param {Record<string, any>} item
 */
export function pickPrice(item) {
  const sale = item?.sale_price?.value ?? null;
  const original = item?.original_price?.value ?? null;
  const currency = item?.sale_price?.currency ?? item?.original_price?.currency ?? null;
  return {
    price: sale ?? original ?? null,
    salePrice: sale,
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
    discountPercent: parseDiscount(item?.discount_pct),
    url: item?.url ?? null,
    image: item?.image ?? null,
  };
}
