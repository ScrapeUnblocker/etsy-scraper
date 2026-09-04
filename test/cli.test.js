import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs, run } from "../src/cli.js";

test("parseArgs joins positionals into a query", () => {
  const opts = parseArgs(["leather", "wallet"]);
  assert.equal(opts.query, "leather wallet");
  assert.equal(opts.pages, 1);
  assert.equal(opts.country, "US");
});

test("parseArgs reads options in any order", () => {
  const opts = parseArgs(["--pages", "3", "vintage lamp", "-c", "GB", "--csv", "out.csv", "--pretty"]);
  assert.equal(opts.query, "vintage lamp");
  assert.equal(opts.pages, 3);
  assert.equal(opts.country, "GB");
  assert.equal(opts.csv, "out.csv");
  assert.equal(opts.pretty, true);
});

test("parseArgs rejects unknown options and bad page counts", () => {
  assert.throws(() => parseArgs(["--nope"]), /Unknown option/);
  assert.throws(() => parseArgs(["x", "--pages", "0"]), /positive integer/);
  assert.throws(() => parseArgs(["x", "--pages", "abc"]), /positive integer/);
});

test("run prints JSON from the injected scraper", async () => {
  const calls = [];
  const scraper = {
    search: async (query, options) => {
      calls.push([query, options]);
      return [{ title: "Wallet", shop: "Leathers" }];
    },
  };

  const chunks = [];
  const original = process.stdout.write;
  process.stdout.write = (chunk) => {
    chunks.push(chunk);
    return true;
  };
  let code;
  try {
    code = await run(["leather", "wallet", "--pretty"], { scraper });
  } finally {
    process.stdout.write = original;
  }

  assert.equal(code, 0);
  assert.deepEqual(calls[0][0], "leather wallet");
  assert.deepEqual(calls[0][1], { pages: 1 });
  assert.match(chunks.join(""), /"title": "Wallet"/);
});

test("run shows help and returns 1 when no query is given", async () => {
  const chunks = [];
  const original = process.stdout.write;
  process.stdout.write = (chunk) => {
    chunks.push(chunk);
    return true;
  };
  let code;
  try {
    code = await run([]);
  } finally {
    process.stdout.write = original;
  }

  assert.equal(code, 1);
  assert.match(chunks.join(""), /Usage:/);
});
