import { getVirtualRange, normalizeVirtualListOptions } from "../src/core.js";

// ---------------------------------------------------------------------------
// normalizeVirtualListOptions
// ---------------------------------------------------------------------------

describe("normalizeVirtualListOptions", () => {
  // -- default / fallback behaviour ----------------------------------------

  test("returns defaults when called without arguments", () => {
    const options = normalizeVirtualListOptions();

    expect(options).toEqual({
      items: [],
      itemHeight: 40,
      overscan: 5,
      as: "item",
      indexAs: "index",
      key: undefined,
    });
  });

  test("returns defaults when called with undefined", () => {
    expect(normalizeVirtualListOptions(undefined)).toEqual(
      normalizeVirtualListOptions(),
    );
  });

  test("returns defaults when called with null", () => {
    expect(normalizeVirtualListOptions(null)).toEqual(
      normalizeVirtualListOptions(),
    );
  });

  test("returns defaults for an empty object", () => {
    expect(normalizeVirtualListOptions({})).toEqual(
      normalizeVirtualListOptions(),
    );
  });

  // -- array shorthand -----------------------------------------------------

  test("normalizes array shorthand into list options", () => {
    const items = ["a", "b"];
    const options = normalizeVirtualListOptions(items);

    expect(options.items).toBe(items);
    expect(options.itemHeight).toBe(40);
    expect(options.overscan).toBe(5);
    expect(options.as).toBe("item");
    expect(options.indexAs).toBe("index");
  });

  test("normalizes an empty array into list options with no items", () => {
    const options = normalizeVirtualListOptions([]);

    expect(options.items).toEqual([]);
    expect(options.itemHeight).toBe(40);
  });

  // -- items handling ------------------------------------------------------

  test("falls back to empty array when items is not an array", () => {
    expect(normalizeVirtualListOptions({ items: "not-array" }).items).toEqual(
      [],
    );
    expect(normalizeVirtualListOptions({ items: 123 }).items).toEqual([]);
    expect(normalizeVirtualListOptions({ items: null }).items).toEqual([]);
  });

  test("preserves a valid items array", () => {
    const items = [1, 2, 3];
    expect(normalizeVirtualListOptions({ items }).items).toBe(items);
  });

  // -- itemHeight / estimateSize -------------------------------------------

  test("uses custom itemHeight when provided", () => {
    expect(normalizeVirtualListOptions({ itemHeight: 60 }).itemHeight).toBe(60);
  });

  test("uses estimateSize as alias for itemHeight", () => {
    expect(normalizeVirtualListOptions({ estimateSize: 80 }).itemHeight).toBe(
      80,
    );
  });

  test("prefers itemHeight over estimateSize when both are provided", () => {
    expect(
      normalizeVirtualListOptions({ itemHeight: 50, estimateSize: 80 })
        .itemHeight,
    ).toBe(50);
  });

  test("falls back to default for non-positive itemHeight", () => {
    expect(normalizeVirtualListOptions({ itemHeight: 0 }).itemHeight).toBe(40);
    expect(normalizeVirtualListOptions({ itemHeight: -10 }).itemHeight).toBe(
      40,
    );
  });

  test("falls back to default for non-numeric itemHeight", () => {
    expect(normalizeVirtualListOptions({ itemHeight: "abc" }).itemHeight).toBe(
      40,
    );
    expect(normalizeVirtualListOptions({ itemHeight: NaN }).itemHeight).toBe(
      40,
    );
    expect(
      normalizeVirtualListOptions({ itemHeight: Infinity }).itemHeight,
    ).toBe(40);
  });

  // -- overscan ------------------------------------------------------------

  test("uses custom overscan value", () => {
    expect(normalizeVirtualListOptions({ overscan: 10 }).overscan).toBe(10);
  });

  test("accepts zero overscan", () => {
    expect(normalizeVirtualListOptions({ overscan: 0 }).overscan).toBe(0);
  });

  test("floors fractional overscan to integer", () => {
    expect(normalizeVirtualListOptions({ overscan: 3.7 }).overscan).toBe(3);
  });

  test("falls back to default for negative overscan", () => {
    expect(normalizeVirtualListOptions({ overscan: -1 }).overscan).toBe(5);
  });

  test("falls back to default for non-numeric overscan", () => {
    expect(normalizeVirtualListOptions({ overscan: "abc" }).overscan).toBe(5);
    expect(normalizeVirtualListOptions({ overscan: NaN }).overscan).toBe(5);
  });

  // -- as / indexAs --------------------------------------------------------

  test("uses custom 'as' alias", () => {
    expect(normalizeVirtualListOptions({ as: "row" }).as).toBe("row");
  });

  test("falls back to 'item' for empty or non-string 'as'", () => {
    expect(normalizeVirtualListOptions({ as: "" }).as).toBe("item");
    expect(normalizeVirtualListOptions({ as: 123 }).as).toBe("item");
    expect(normalizeVirtualListOptions({ as: null }).as).toBe("item");
  });

  test("uses custom 'indexAs' alias", () => {
    expect(normalizeVirtualListOptions({ indexAs: "i" }).indexAs).toBe("i");
  });

  test("falls back to 'index' for empty or non-string 'indexAs'", () => {
    expect(normalizeVirtualListOptions({ indexAs: "" }).indexAs).toBe("index");
    expect(normalizeVirtualListOptions({ indexAs: 0 }).indexAs).toBe("index");
    expect(normalizeVirtualListOptions({ indexAs: null }).indexAs).toBe(
      "index",
    );
  });

  // -- key passthrough -----------------------------------------------------

  test("passes through the key option as-is", () => {
    expect(normalizeVirtualListOptions({ key: "id" }).key).toBe("id");
  });

  test("key is undefined when not provided", () => {
    expect(normalizeVirtualListOptions({}).key).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getVirtualRange
// ---------------------------------------------------------------------------

describe("getVirtualRange", () => {
  // -- zero / empty list ---------------------------------------------------

  test("returns zeroed range when itemCount is 0", () => {
    const range = getVirtualRange({
      itemCount: 0,
      itemHeight: 20,
      viewportHeight: 100,
      scrollTop: 0,
    });

    expect(range).toEqual({
      start: 0,
      end: 0,
      visibleStart: 0,
      visibleEnd: 0,
      totalHeight: 0,
      offsetTop: 0,
    });
  });

  test("returns zeroed range for negative itemCount", () => {
    const range = getVirtualRange({
      itemCount: -5,
      itemHeight: 20,
      viewportHeight: 100,
      scrollTop: 0,
    });

    expect(range.totalHeight).toBe(0);
    expect(range.start).toBe(0);
    expect(range.end).toBe(0);
  });

  // -- basic mid-list calculation ------------------------------------------

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

  // -- clamping at list boundaries -----------------------------------------

  test("clamps the range at the start of the list (scrollTop = 0)", () => {
    const range = getVirtualRange({
      itemCount: 100,
      itemHeight: 20,
      viewportHeight: 100,
      scrollTop: 0,
      overscan: 3,
    });

    expect(range.start).toBe(0);
    expect(range.visibleStart).toBe(0);
    expect(range.visibleEnd).toBe(5);
    expect(range.end).toBe(8);
    expect(range.offsetTop).toBe(0);
    expect(range.totalHeight).toBe(2000);
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

  test("clamps when scrolled past the very end", () => {
    const range = getVirtualRange({
      itemCount: 10,
      itemHeight: 50,
      viewportHeight: 200,
      scrollTop: 99999,
      overscan: 2,
    });

    // visibleStart clamped to last item (index 9)
    expect(range.visibleStart).toBe(9);
    expect(range.end).toBe(10);
    expect(range.start).toBeLessThanOrEqual(range.visibleStart);
    expect(range.totalHeight).toBe(500);
  });

  // -- default overscan ----------------------------------------------------

  test("uses default overscan of 5 when not provided", () => {
    const range = getVirtualRange({
      itemCount: 50,
      itemHeight: 20,
      viewportHeight: 100,
      scrollTop: 400,
    });

    // visibleStart = floor(400/20) = 20, visibleEnd = 20 + ceil(100/20) = 25
    expect(range.visibleStart).toBe(20);
    expect(range.visibleEnd).toBe(25);
    // with default overscan of 5: start = 20 - 5 = 15, end = 25 + 5 = 30
    expect(range.start).toBe(15);
    expect(range.end).toBe(30);
  });

  test("overscan 0 gives only the visible window", () => {
    const range = getVirtualRange({
      itemCount: 100,
      itemHeight: 20,
      viewportHeight: 100,
      scrollTop: 200,
      overscan: 0,
    });

    expect(range.start).toBe(range.visibleStart);
    expect(range.end).toBe(range.visibleEnd);
  });

  // -- single item ---------------------------------------------------------

  test("handles a single-item list", () => {
    const range = getVirtualRange({
      itemCount: 1,
      itemHeight: 40,
      viewportHeight: 400,
      scrollTop: 0,
      overscan: 5,
    });

    expect(range.visibleStart).toBe(0);
    expect(range.visibleEnd).toBe(1);
    expect(range.start).toBe(0);
    expect(range.end).toBe(1);
    expect(range.totalHeight).toBe(40);
    expect(range.offsetTop).toBe(0);
  });

  // -- totalHeight / offsetTop calculations --------------------------------

  test("totalHeight equals itemCount * itemHeight", () => {
    const range = getVirtualRange({
      itemCount: 200,
      itemHeight: 25,
      viewportHeight: 300,
      scrollTop: 0,
    });

    expect(range.totalHeight).toBe(5000);
  });

  test("offsetTop equals start * itemHeight", () => {
    const range = getVirtualRange({
      itemCount: 100,
      itemHeight: 30,
      viewportHeight: 150,
      scrollTop: 600,
      overscan: 2,
    });

    expect(range.offsetTop).toBe(range.start * 30);
  });

  // -- invalid / edge-case inputs ------------------------------------------

  test("treats NaN/undefined inputs as 0", () => {
    const range = getVirtualRange({
      itemCount: NaN,
      itemHeight: undefined,
      viewportHeight: NaN,
      scrollTop: undefined,
    });

    // itemCount → 0  ⇒  zeroed range
    expect(range).toEqual({
      start: 0,
      end: 0,
      visibleStart: 0,
      visibleEnd: 0,
      totalHeight: 0,
      offsetTop: 0,
    });
  });

  test("falls back to default itemHeight when given invalid value", () => {
    const range = getVirtualRange({
      itemCount: 10,
      itemHeight: -5,
      viewportHeight: 200,
      scrollTop: 0,
      overscan: 0,
    });

    // Should use DEFAULT_ITEM_HEIGHT (40)
    expect(range.totalHeight).toBe(10 * 40);
  });

  test("handles string-coercible numeric inputs", () => {
    const range = getVirtualRange({
      itemCount: "20",
      itemHeight: "50",
      viewportHeight: "200",
      scrollTop: "100",
      overscan: 0,
    });

    expect(range.totalHeight).toBe(1000);
    expect(range.visibleStart).toBe(2);
  });

  // -- relationship invariants ---------------------------------------------

  test("start ≤ visibleStart ≤ visibleEnd ≤ end", () => {
    const configs = [
      { itemCount: 100, itemHeight: 20, viewportHeight: 100, scrollTop: 0 },
      { itemCount: 100, itemHeight: 20, viewportHeight: 100, scrollTop: 500 },
      { itemCount: 100, itemHeight: 20, viewportHeight: 100, scrollTop: 1900 },
      { itemCount: 5, itemHeight: 100, viewportHeight: 1000, scrollTop: 0 },
    ];

    for (const config of configs) {
      const r = getVirtualRange(config);
      expect(r.start).toBeLessThanOrEqual(r.visibleStart);
      expect(r.visibleStart).toBeLessThanOrEqual(r.visibleEnd);
      expect(r.visibleEnd).toBeLessThanOrEqual(r.end);
    }
  });

  test("end never exceeds itemCount", () => {
    const range = getVirtualRange({
      itemCount: 10,
      itemHeight: 10,
      viewportHeight: 500,
      scrollTop: 0,
      overscan: 100,
    });

    expect(range.end).toBe(10);
  });
});
