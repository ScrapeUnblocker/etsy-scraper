import { ScrapeUnblockerClient } from "scrapeunblocker";

import { normalizeItem } from "./parse.js";

const SEARCH_BASE = "https://www.etsy.com/search";

/**
 * Build an Etsy search URL for a query and (1-based) page number.
 * @param {string} query
 * @param {number} [page]
 * @returns {string}
 */
export function buildSearchUrl(query, page = 1) {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set("page", String(page));
  return `${SEARCH_BASE}?${params.toString()}`;
}

/**
 * Scrape Etsy search listings through the ScrapeUnblocker getPageSource
 * parsed_data API. The API returns AI-parsed JSON, so no HTML parsing is needed.
 */
export class EtsyScraper {
  /**
   * @param {object} [options]
   * @param {import("scrapeunblocker").ScrapeUnblockerClient} [options.client]
   *   A pre-built client (mainly for tests). Defaults to a new one that reads
   *   SCRAPEUNBLOCKER_KEY from the environment.
   * @param {string} [options.apiKey] Explicit API key (overrides the env var).
   * @param {string} [options.country] Proxy country ISO code (default "US").
   */
  constructor({ client, apiKey, country = "US" } = {}) {
    this.client = client ?? new ScrapeUnblockerClient(apiKey ? { apiKey } : undefined);
    this.country = country;
  }

  /**
   * Fetch and normalize a single page of results.
   * @param {string} url
   */
  async fetchPage(url) {
    const response = await this.client.getParsed(url, { proxyCountry: this.country });
    return this.#shape(response);
  }

  /**
   * Search Etsy and collect listings across one or more result pages.
   * Pagination follows the API-provided `next_page` link and stops early when
   * there are no more pages.
   * @param {string} query
   * @param {object} [options]
   * @param {number} [options.pages] Maximum number of pages to collect.
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async search(query, { pages = 1 } = {}) {
    const collected = [];
    let url = buildSearchUrl(query, 1);
    for (let page = 1; page <= pages; page += 1) {
      const { items, nextPage } = await this.fetchPage(url);
      collected.push(...items);
      if (!nextPage) break;
      url = nextPage;
    }
    return collected;
  }

  /**
   * Reduce a raw getParsed response to the fields we care about.
   * @param {{ pageType?: string, data?: any }} response
   */
  #shape(response) {
    const data = response?.data ?? {};
    const rawItems = Array.isArray(data.items) ? data.items : [];
    return {
      pageType: response?.pageType ?? null,
      items: rawItems.map(normalizeItem),
      total: typeof data.total === "number" ? data.total : rawItems.length,
      nextPage: data.next_page ?? null,
    };
  }
}
