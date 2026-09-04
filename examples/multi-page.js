// Multi-page collection: gather several pages and summarize by shop.
//
//   SCRAPEUNBLOCKER_KEY=your_key node examples/multi-page.js

import { EtsyScraper } from "../src/index.js";

const scraper = new EtsyScraper();
const items = await scraper.search("vintage lamp", { pages: 3 });

const shops = new Set(items.map((item) => item.shop).filter(Boolean));
const onSale = items.filter((item) => item.discountPercent != null).length;

console.log(`Collected ${items.length} listings from ${shops.size} shops`);
console.log(`${onSale} of them are discounted`);
