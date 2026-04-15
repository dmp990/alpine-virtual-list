import { getVirtualRange, normalizeVirtualListOptions } from "./core.js";

export default function virtualList(Alpine) {
  Alpine.directive(
    "virtual-list",
    (el, { expression }, { cleanup, effect, evaluateLater }) => {
      const evaluate = evaluateLater(expression || "{}");
      const template = el.querySelector("template");

      if (!template) {
        warn("x-virtual-list requires a child <template> to render each row.");
        return;
      }

      const mount = document.createElement("div");
      const state = {
        options: normalizeVirtualListOptions(),
        range: getVirtualRange({
          itemCount: 0,
          itemHeight: 40,
          viewportHeight: 0,
          scrollTop: 0,
        }),
        nodesByKey: new Map(),
        frame: null,
        destroyed: false,
      };

      prepareContainer(el, template, mount);

      const requestRender = () => {
        if (state.frame !== null || state.destroyed) return;

        state.frame = requestAnimationFrame(() => {
          state.frame = null;
          renderWindow(Alpine, el, template, mount, state);
        });
      };

      const onScroll = () => requestRender();
      el.addEventListener("scroll", onScroll, { passive: true });

      const observer =
        typeof ResizeObserver === "function"
          ? new ResizeObserver(requestRender)
          : null;

      observer?.observe(el);

      effect(() => {
        evaluate((value) => {
          state.options = normalizeVirtualListOptions(value);
          requestRender();
        });
      });

      cleanup(() => {
        state.destroyed = true;
        el.removeEventListener("scroll", onScroll);
        observer?.disconnect();

        if (state.frame !== null) cancelAnimationFrame(state.frame);

        for (const record of state.nodesByKey.values()) {
          destroyRecord(Alpine, record);
        }

        state.nodesByKey.clear();
        mount.remove();
        template.hidden = false;
      });
    },
  ).before("for");
}

if (typeof document !== "undefined") {
  if (window.Alpine) {
    window.Alpine.plugin(virtualList);
  } else {
    document.addEventListener("alpine:init", () => {
      window.Alpine.plugin(virtualList);
    });
  }
}

export { getVirtualRange, normalizeVirtualListOptions };

function prepareContainer(el, template, mount) {
  template.hidden = true;
  mount.setAttribute("data-virtual-list-mount", "");
  mount.style.position = "relative";
  mount.style.width = "100%";
  mount.style.minHeight = "100%";
  mount.style.height = "0px";

  if (getComputedStyle(el).overflowY === "visible") {
    el.style.overflowY = "auto";
  }

  if (getComputedStyle(el).position === "static") {
    el.style.position = "relative";
  }

  el.append(mount);
}

function renderWindow(Alpine, el, template, mount, state) {
  const { items, itemHeight, overscan } = state.options;
  const range = getVirtualRange({
    itemCount: items.length,
    itemHeight,
    viewportHeight: el.clientHeight,
    scrollTop: el.scrollTop,
    overscan,
  });

  state.range = range;
  mount.style.height = `${range.totalHeight}px`;

  const activeKeys = new Set();

  for (let index = range.start; index < range.end; index += 1) {
    const item = items[index];
    const key = getItemKey(state.options, item, index);
    const top = index * itemHeight;
    activeKeys.add(key);

    let record = state.nodesByKey.get(key);

    if (!record) {
      record = createRecord(Alpine, template, state.options, item, index);
      state.nodesByKey.set(key, record);
      mount.append(record.node);
    } else {
      updateRecord(record, state.options, item, index);
    }

    positionRecord(record, top, itemHeight);
  }

  for (const [key, record] of state.nodesByKey) {
    if (activeKeys.has(key)) continue;

    destroyRecord(Alpine, record);
    state.nodesByKey.delete(key);
  }
}

function createRecord(Alpine, template, options, item, index) {
  const fragment = template.content.cloneNode(true);
  const firstElement = fragment.firstElementChild;

  if (!firstElement) {
    throw new Error("x-virtual-list template must contain one root element.");
  }

  const node = firstElement;
  const scope = Alpine.reactive
    ? Alpine.reactive(createScope(options, item, index))
    : createScope(options, item, index);

  node.setAttribute("data-virtual-list-item", "");
  node.style.position = "absolute";
  node.style.left = "0";
  node.style.right = "0";
  node.style.width = "100%";
  node.style.boxSizing = "border-box";
  node.style.willChange = "transform";

  Alpine.addScopeToNode(node, scope);
  Alpine.initTree(node);

  return { node, scope };
}

function updateRecord(record, options, item, index) {
  record.scope[options.as] = item;
  record.scope[options.indexAs] = index;
  record.scope.virtual = createVirtualMeta(index);
}

function positionRecord(record, top, itemHeight) {
  record.node.style.height = `${itemHeight}px`;
  record.node.style.transform = `translateY(${top}px)`;
}

function destroyRecord(Alpine, record) {
  Alpine.destroyTree?.(record.node);
  record.node.remove();
}

function createScope(options, item, index) {
  return {
    [options.as]: item,
    [options.indexAs]: index,
    virtual: createVirtualMeta(index),
  };
}

function createVirtualMeta(index) {
  return {
    index,
    odd: index % 2 === 1,
    even: index % 2 === 0,
  };
}

function getItemKey(options, item, index) {
  if (typeof options.key === "function") return options.key(item, index);
  if (
    typeof options.key === "string" &&
    item &&
    item[options.key] !== undefined
  ) {
    return item[options.key];
  }

  return index;
}

function warn(message) {
  if (typeof console !== "undefined")
    console.warn(`[alpine-virtual-list] ${message}`);
}
