import assert from "node:assert/strict";
import test from "node:test";

import { normalizeItem, parseDiscount, pickPrice } from "../src/parse.js";
import { escapeCsv, toCsv } from "../src/csv.js";

test("parseDiscount extracts a percentage", () => {
  assert.equal(parseDiscount("(60% off)"), 60);
  assert.equal(parseDiscount("15.5% off"), 15.5);
  assert.equal(parseDiscount(null), null);
  assert.equal(parseDiscount("no digits here"), null);
});

test("pickPrice prefers the sale price and falls back to original", () => {
  assert.deepEqual(
    pickPrice({ sale_price: { value: 32.2, currency: null }, original_price: { value: 80.5, currency: "USD" } }),
    { price: 32.2, salePrice: 32.2, originalPrice: 80.5, currency: "USD" },
  );
  assert.deepEqual(
    pickPrice({ sale_price: null, original_price: { value: 42, currency: "USD" } }),
    { price: 42, salePrice: null, originalPrice: 42, currency: "USD" },
  );
  assert.deepEqual(
    pickPrice({ sale_price: null, original_price: null }),
    { price: null, salePrice: null, originalPrice: null, currency: null },
  );
});

test("normalizeItem produces a flat, stable record", () => {
  const record = normalizeItem({
    title: "Handmade Leather Wallet",
    shop_name: "TexasValleyLeather",
    url: "https://www.etsy.com/listing/1/handmade",
    image: "https://i.etsystatic.com/x.jpg",
    sale_price: { value: 32.2, currency: null },
    original_price: { value: 80.5, currency: null },
    discount_pct: "(60% off)",
  });
  assert.deepEqual(record, {
    title: "Handmade Leather Wallet",
    shop: "TexasValleyLeather",
    price: 32.2,
    salePrice: 32.2,
    originalPrice: 80.5,
    currency: null,
    discountPercent: 60,
    url: "https://www.etsy.com/listing/1/handmade",
    image: "https://i.etsystatic.com/x.jpg",
  });
});

test("normalizeItem tolerates missing fields", () => {
  const record = normalizeItem({});
  assert.equal(record.title, null);
  assert.equal(record.shop, null);
  assert.equal(record.price, null);
  assert.equal(record.discountPercent, null);
});

test("escapeCsv quotes fields with commas, quotes and newlines", () => {
  assert.equal(escapeCsv("plain"), "plain");
  assert.equal(escapeCsv("a,b"), '"a,b"');
  assert.equal(escapeCsv('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsv(null), "");
  assert.equal(escapeCsv(32.2), "32.2");
});

test("toCsv emits a header and one row per record", () => {
  const csv = toCsv([
    { title: "Wallet, slim", shop: "Shop", price: 32.2, currency: "USD", url: "u", image: "i" },
  ]);
  const lines = csv.trimEnd().split("\n");
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^title,shop,price,/);
  assert.match(lines[1], /"Wallet, slim"/);
});
