// Basic search: fetch one page of Etsy listings and print the first few as JSON.
//
//   SCRAPEUNBLOCKER_KEY=your_key node examples/search-json.js

import { EtsyScraper } from "../src/index.js";

const scraper = new EtsyScraper({ country: "US" });
const items = await scraper.search("leather wallet", { pages: 1 });

console.log(JSON.stringify(items.slice(0, 5), null, 2));
console.log(`\n${items.length} listings`);
