const DEFAULT_ITEM_HEIGHT = 40;
const DEFAULT_OVERSCAN = 5;

export function normalizeVirtualListOptions(value = {}) {
  const options = Array.isArray(value) ? { items: value } : value || {};
  const itemHeight = toPositiveNumber(
    options.itemHeight ?? options.estimateSize,
    DEFAULT_ITEM_HEIGHT,
  );

  return {
    items: Array.isArray(options.items) ? options.items : [],
    itemHeight,
    overscan: toNonNegativeInteger(options.overscan, DEFAULT_OVERSCAN),
    as:
      typeof options.as === "string" && options.as.length > 0
        ? options.as
        : "item",
    indexAs:
      typeof options.indexAs === "string" && options.indexAs.length > 0
        ? options.indexAs
        : "index",
    key: options.key,
  };
}

export function getVirtualRange({
  itemCount,
  itemHeight,
  viewportHeight,
  scrollTop,
  overscan = DEFAULT_OVERSCAN,
}) {
  const count = Math.max(0, Math.floor(Number(itemCount) || 0));
  const size = toPositiveNumber(itemHeight, DEFAULT_ITEM_HEIGHT);
  const height = Math.max(0, Number(viewportHeight) || 0);
  const top = Math.max(0, Number(scrollTop) || 0);
  const buffer = toNonNegativeInteger(overscan, DEFAULT_OVERSCAN);

  if (count === 0) {
    return {
      start: 0,
      end: 0,
      visibleStart: 0,
      visibleEnd: 0,
      totalHeight: 0,
      offsetTop: 0,
    };
  }

  const visibleStart = clamp(Math.floor(top / size), 0, count - 1);
  const visibleCount = Math.max(1, Math.ceil(height / size));
  const visibleEnd = clamp(visibleStart + visibleCount, 0, count);
  const start = clamp(visibleStart - buffer, 0, count);
  const end = clamp(visibleEnd + buffer, start, count);

  return {
    start,
    end,
    visibleStart,
    visibleEnd,
    totalHeight: count * size,
    offsetTop: start * size,
  };
}

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function toNonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
