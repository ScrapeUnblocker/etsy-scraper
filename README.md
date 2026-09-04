# etsy-scraper

[![CI](https://github.com/ScrapeUnblocker/etsy-scraper/actions/workflows/ci.yml/badge.svg)](https://github.com/ScrapeUnblocker/etsy-scraper/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Scrape [Etsy](https://www.etsy.com) search listings as clean, structured JSON —
title, shop, sale price, original price, discount, listing URL and image — with
multi-page collection and CSV export. A small CLI and a Node library.

> **Powered by [ScrapeUnblocker](https://scrapeunblocker.com/?utm_source=github&utm_medium=integration&utm_campaign=example-repos).**
> Etsy renders search results with heavy client-side JavaScript and anti-bot
> protection. This project uses the ScrapeUnblocker
> [`getPageSource`](https://developers.scrapeunblocker.com/?utm_source=github&utm_medium=integration&utm_campaign=example-repos)
> endpoint with `parsed_data`, which returns AI-parsed JSON — so there is no
> HTML parsing to maintain when Etsy changes its markup.

## Features

- 🔎 Search any Etsy query and get normalized listing records
- 🏷️ Sale price, original price, currency and discount percent per item
- 🏪 Shop name, listing URL and image for every result
- 📄 Multi-page collection that follows Etsy's own pagination
- 🌍 Country targeting (route the request through a chosen locale)
- 💾 JSON or CSV output, from the CLI or as a library
- 🧩 Built on the official [`scrapeunblocker`](https://www.npmjs.com/package/scrapeunblocker) SDK
- ✅ Zero runtime dependencies beyond the SDK; tests mock the API (no credits spent)

## Install

```bash
git clone https://github.com/ScrapeUnblocker/etsy-scraper.git
cd etsy-scraper
npm install
```

Set your API key (get one from the
[ScrapeUnblocker dashboard](https://scrapeunblocker.com/?utm_source=github&utm_medium=integration&utm_campaign=example-repos)):

```bash
cp .env.example .env
# then edit .env, or just export it:
export SCRAPEUNBLOCKER_KEY=your_key_here
```

To use the command globally, `npm link` (or `npm install -g .`).

## CLI usage

```bash
# Print listings as JSON
etsy-scraper "leather wallet"

# Collect three pages and save a CSV
etsy-scraper "handmade mug" --pages 3 --csv mugs.csv

# Target a country and write JSON to a file, pretty-printed to the terminal
etsy-scraper "vintage lamp" --country GB --json lamps.json
etsy-scraper "vintage lamp" --pretty
```

```
Options:
  -p, --pages <n>      number of result pages to collect (default: 1)
  -c, --country <cc>   proxy country ISO code (default: US)
      --csv <file>     write results to a CSV file
      --json <file>    write results to a JSON file
      --pretty         pretty-print JSON to stdout
  -h, --help           show this help
```

If neither `--csv` nor `--json` is given, results are printed as JSON on stdout.

## Library usage

```js
import { EtsyScraper, toCsv } from "etsy-scraper";

const scraper = new EtsyScraper({ country: "US" });

// Collect up to 3 pages of results
const listings = await scraper.search("leather wallet", { pages: 3 });

console.log(listings.length, "listings");
console.log(listings[0]);

// Export to CSV
import { writeFileSync } from "node:fs";
writeFileSync("etsy.csv", toCsv(listings));
```

See [`examples/`](examples) for runnable scripts (`search-json.js`,
`export-csv.js`, `multi-page.js`).

## Example output

Each listing is normalized to a flat record:

```json
{
  "title": "Handmade Leather Bifold Wallet, Personalized Front Pocket Card Holder",
  "shop": "NooyaLeather",
  "price": 35,
  "salePrice": 35,
  "originalPrice": null,
  "currency": "USD",
  "discountPercent": 5,
  "url": "https://www.etsy.com/listing/1214703903/handmade-leather-bifold-wallet",
  "image": "https://i.etsystatic.com/33293494/r/il/6ad75b/3854048691/il_255x319.jpg"
}
```

> Note: Etsy sometimes returns a numeric price with a `null` currency. `price`
> is the best available *current* price (the sale price when present, otherwise
> the original price); `salePrice` and `originalPrice` are kept separately.

## Project layout

```
etsy-scraper/
├── bin/
│   └── etsy-scraper.js       # CLI entry point
├── src/
│   ├── index.js              # public exports
│   ├── scraper.js            # EtsyScraper + URL/pagination logic
│   ├── parse.js              # item normalization + price/discount parsing
│   ├── csv.js                # CSV serialization
│   └── cli.js                # argument parser + runner
├── examples/                 # runnable scripts
├── test/                     # offline unit tests (SDK mocked)
├── .github/workflows/ci.yml  # lint + tests on Node 18 & 20
└── package.json
```

## Development

```bash
npm install       # install deps
npm test          # run the unit tests (offline, no API credits used)
npm run lint      # eslint
npm run format    # eslint --fix
```

The tests mock the ScrapeUnblocker client, so they run without an API key and
never spend credits. Pre-commit hooks (`ruff`-style) are configured in
[`.pre-commit-config.yaml`](.pre-commit-config.yaml) via `pre-commit`.

## How it works

`EtsyScraper.search()` builds an Etsy search URL, calls `client.getParsed(url)`
(the SDK's `getPageSource` + `parsed_data` wrapper), and normalizes each item in
the returned `data.items` array. Pagination follows the API-provided
`data.next_page` link and stops when there are no more pages or the requested
page cap is reached.

## Links

- 🌐 [ScrapeUnblocker](https://scrapeunblocker.com/?utm_source=github&utm_medium=integration&utm_campaign=example-repos)
- 📚 [API documentation](https://developers.scrapeunblocker.com/?utm_source=github&utm_medium=integration&utm_campaign=example-repos)
- 📦 [`scrapeunblocker` on npm](https://www.npmjs.com/package/scrapeunblocker)

## License

[MIT](LICENSE) © 2026 ScrapeUnblocker

---

*This is an example integration. Please scrape responsibly and in accordance
with Etsy's Terms of Service and applicable law.*
