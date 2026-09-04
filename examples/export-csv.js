// Collect two pages of results and write them to a CSV file.
//
//   SCRAPEUNBLOCKER_KEY=your_key node examples/export-csv.js "handmade mug"

import { writeFileSync } from "node:fs";

import { EtsyScraper, toCsv } from "../src/index.js";

const query = process.argv.slice(2).join(" ") || "handmade mug";
const scraper = new EtsyScraper();
const items = await scraper.search(query, { pages: 2 });

writeFileSync("etsy.csv", toCsv(items));
console.log(`Wrote ${items.length} rows for "${query}" to etsy.csv`);
