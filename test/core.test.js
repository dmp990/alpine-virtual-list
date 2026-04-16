import { getVirtualRange, normalizeVirtualListOptions } from "../src/core.js";

test("normalizes array shorthand into list options", () => {
  const items = ["a", "b"];
  const options = normalizeVirtualListOptions(items);

  expect(options.items).toBe(items);
  expect(options.itemHeight).toBe(40);
  expect(options.overscan).toBe(5);
  expect(options.as).toBe("item");
  expect(options.indexAs).toBe("index");
});

test("calculates a buffered visible range", () => {
  const range = getVirtualRange({
    itemCount: 100,
    itemHeight: 20,
    viewportHeight: 100,
    scrollTop: 200,
    overscan: 2,
  });

  expect(range).toEqual({
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

  expect(range.start).toBe(6);
  expect(range.end).toBe(10);
  expect(range.totalHeight).toBe(300);
});
