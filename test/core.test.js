import test from "node:test";
import assert from "node:assert/strict";
import { getVirtualRange, normalizeVirtualListOptions } from "../src/core.js";

test("normalizes array shorthand into list options", () => {
  const items = ["a", "b"];
  const options = normalizeVirtualListOptions(items);

  assert.equal(options.items, items);
  assert.equal(options.itemHeight, 40);
  assert.equal(options.overscan, 5);
  assert.equal(options.as, "item");
  assert.equal(options.indexAs, "index");
});

test("calculates a buffered visible range", () => {
  const range = getVirtualRange({
    itemCount: 100,
    itemHeight: 20,
    viewportHeight: 100,
    scrollTop: 200,
    overscan: 2,
  });

  assert.deepEqual(range, {
    start: 8,
    end: 17,
    visibleStart: 10,
    visibleEnd: 15,
    totalHeight: 2000,
    offsetTop: 160,
  });
});

test("clamps the range near the end of the list", () => {
  const range = getVirtualRange({
    itemCount: 10,
    itemHeight: 30,
    viewportHeight: 120,
    scrollTop: 270,
    overscan: 3,
  });

  assert.equal(range.start, 6);
  assert.equal(range.end, 10);
  assert.equal(range.totalHeight, 300);
});
