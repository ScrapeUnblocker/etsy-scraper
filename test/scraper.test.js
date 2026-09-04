import assert from "node:assert/strict";
import test from "node:test";

import { EtsyScraper, buildSearchUrl } from "../src/scraper.js";

/**
 * A fake ScrapeUnblocker client. Each getParsed() call shifts the next queued
 * response (or throws it, if it is an Error) and records the call args - so no
 * real API credit is ever spent in tests.
 */
class FakeClient {
  constructor(responses) {
    this.responses = responses;
    this.calls = [];
  }

  async getParsed(url, options) {
    this.calls.push({ url, options });
    const next = this.responses.shift();
    if (next instanceof Error) throw next;
    return next;
  }
}

function page(items, nextPage) {
  return { pageType: "search_list", source: "ai", data: { items, total: items.length, next_page: nextPage } };
}

test("buildSearchUrl encodes the query and adds page only past page 1", () => {
  assert.equal(buildSearchUrl("leather wallet"), "https://www.etsy.com/search?q=leather+wallet");
  assert.equal(buildSearchUrl("leather wallet", 2), "https://www.etsy.com/search?q=leather+wallet&page=2");
});

test("search normalizes items from a single page", async () => {
  const client = new FakeClient([
    page([{ title: "Wallet", shop_name: "Leathers", sale_price: { value: 20, currency: null } }], null),
  ]);
  const scraper = new EtsyScraper({ client });
  const items = await scraper.search("wallet");

  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Wallet");
  assert.equal(items[0].shop, "Leathers");
  assert.equal(items[0].price, 20);
});

test("search follows next_page and aggregates across pages", async () => {
  const client = new FakeClient([
    page([{ title: "A" }], "https://www.etsy.com/search?q=x&page=2"),
    page([{ title: "B" }], "https://www.etsy.com/search?q=x&page=3"),
    page([{ title: "C" }], null),
  ]);
  const scraper = new EtsyScraper({ client });
  const items = await scraper.search("x", { pages: 5 });

  assert.deepEqual(items.map((i) => i.title), ["A", "B", "C"]);
  // Stopped at page 3 because next_page was null, despite pages: 5.
  assert.equal(client.calls.length, 3);
  assert.equal(client.calls[1].url, "https://www.etsy.com/search?q=x&page=2");
});

test("search respects the pages cap even when more pages exist", async () => {
  const client = new FakeClient([
    page([{ title: "A" }], "next-1"),
    page([{ title: "B" }], "next-2"),
    page([{ title: "C" }], "next-3"),
  ]);
  const scraper = new EtsyScraper({ client });
  const items = await scraper.search("x", { pages: 2 });

  assert.equal(items.length, 2);
  assert.equal(client.calls.length, 2);
});

test("search passes the configured proxy country through", async () => {
  const client = new FakeClient([page([], null)]);
  const scraper = new EtsyScraper({ client, country: "GB" });
  await scraper.search("x");

  assert.equal(client.calls[0].options.proxyCountry, "GB");
});

test("search propagates SDK errors (e.g. a blocked page)", async () => {
  const blocked = new Error("blocked");
  blocked.name = "BlockedError";
  const client = new FakeClient([blocked]);
  const scraper = new EtsyScraper({ client });

  await assert.rejects(() => scraper.search("x"), /blocked/);
});

test("search tolerates a response with no items", async () => {
  const client = new FakeClient([{ pageType: "homepage", data: {} }]);
  const scraper = new EtsyScraper({ client });
  const items = await scraper.search("x");

  assert.deepEqual(items, []);
});
