import { writeFileSync } from "node:fs";

import { EtsyScraper } from "./scraper.js";
import { toCsv } from "./csv.js";

const HELP = `etsy-scraper - scrape Etsy search listings as clean JSON

Usage:
  etsy-scraper <query> [options]

Options:
  -p, --pages <n>      number of result pages to collect (default: 1)
  -c, --country <cc>   proxy country ISO code (default: US)
      --csv <file>     write results to a CSV file
      --json <file>    write results to a JSON file
      --pretty         pretty-print JSON to stdout
  -h, --help           show this help

Environment:
  SCRAPEUNBLOCKER_KEY  your ScrapeUnblocker API key (required)

Examples:
  etsy-scraper "leather wallet"
  etsy-scraper "handmade mug" --pages 3 --csv mugs.csv
  etsy-scraper "vintage lamp" --country GB --json lamps.json
`;

/**
 * Parse CLI argv (already sliced past `node script`) into an options object.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const opts = {
    query: null,
    pages: 1,
    country: "US",
    csv: null,
    json: null,
    pretty: false,
    help: false,
  };
  const positionals = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        opts.help = true;
        break;
      case "-p":
      case "--pages":
        opts.pages = Number(argv[++i]);
        break;
      case "-c":
      case "--country":
        opts.country = argv[++i];
        break;
      case "--csv":
        opts.csv = argv[++i];
        break;
      case "--json":
        opts.json = argv[++i];
        break;
      case "--pretty":
        opts.pretty = true;
        break;
      default:
        if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
        positionals.push(arg);
    }
  }

  opts.query = positionals.join(" ").trim() || null;
  if (!Number.isInteger(opts.pages) || opts.pages < 1) {
    throw new Error("--pages must be a positive integer");
  }
  return opts;
}

/**
 * Run the CLI. Returns a process exit code.
 * @param {string[]} argv
 * @param {object} [deps]
 * @param {{ search: Function }} [deps.scraper] Injected scraper (for tests).
 * @returns {Promise<number>}
 */
export async function run(argv, { scraper } = {}) {
  const opts = parseArgs(argv);

  if (opts.help || !opts.query) {
    process.stdout.write(HELP);
    return opts.help ? 0 : 1;
  }

  const su = scraper ?? new EtsyScraper({ country: opts.country });
  const records = await su.search(opts.query, { pages: opts.pages });

  if (opts.csv) {
    writeFileSync(opts.csv, toCsv(records));
    process.stderr.write(`Wrote ${records.length} rows to ${opts.csv}\n`);
  }
  if (opts.json) {
    writeFileSync(opts.json, JSON.stringify(records, null, 2));
    process.stderr.write(`Wrote ${records.length} records to ${opts.json}\n`);
  }
  if (!opts.csv && !opts.json) {
    process.stdout.write(JSON.stringify(records, null, opts.pretty ? 2 : 0) + "\n");
  }
  return 0;
}
