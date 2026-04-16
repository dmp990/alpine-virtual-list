import { Window } from "happy-dom";

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

test("virtualized rows inherit parent Alpine scope and can update it", async () => {
  const window = new Window({ url: "http://localhost" });
  window.document.body.innerHTML = `
    <div
      x-data="{
        options: [
          { label: 'Alpha', value: 'alpha' },
          { label: 'Beta', value: 'beta' }
        ],
        selectedOption: { label: 'Beta', value: 'beta' },
        setSelectedOption(option) {
          this.selectedOption = option
        }
      }"
    >
      <div id="selected" x-text="selectedOption.label"></div>
      <div
        id="viewport"
        x-virtual-list="{ items: options, itemHeight: 44, as: 'item', key: 'value' }"
      >
        <template>
          <button
            type="button"
            class="option"
            x-on:click="setSelectedOption(item)"
            x-bind:class="selectedOption && selectedOption.value === item.value ? 'is-selected' : ''"
            x-bind:data-selected="selectedOption && selectedOption.value === item.value ? 'yes' : 'no'"
          >
            <span x-text="item.label"></span>
          </button>
        </template>
      </div>
    </div>
  `;

  const previousGlobals = {
    window: globalThis.window,
    document: globalThis.document,
    CustomEvent: globalThis.CustomEvent,
    Element: globalThis.Element,
    Event: globalThis.Event,
    HTMLElement: globalThis.HTMLElement,
    KeyboardEvent: globalThis.KeyboardEvent,
    MouseEvent: globalThis.MouseEvent,
    MutationObserver: globalThis.MutationObserver,
    Node: globalThis.Node,
    ResizeObserver: globalThis.ResizeObserver,
    ShadowRoot: globalThis.ShadowRoot,
    getComputedStyle: globalThis.getComputedStyle,
    navigator: globalThis.navigator,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };

  try {
    globalThis.window = window;
    globalThis.document = window.document;
    globalThis.CustomEvent = window.CustomEvent;
    globalThis.Element = window.Element;
    globalThis.Event = window.Event;
    globalThis.HTMLElement = window.HTMLElement;
    globalThis.KeyboardEvent = window.KeyboardEvent;
    globalThis.MouseEvent = window.MouseEvent;
    globalThis.MutationObserver = window.MutationObserver;
    globalThis.Node = window.Node;
    globalThis.ResizeObserver = window.ResizeObserver;
    globalThis.ShadowRoot = window.ShadowRoot;
    globalThis.getComputedStyle = window.getComputedStyle.bind(window);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: window.navigator,
      writable: true,
    });
    globalThis.requestAnimationFrame =
      window.requestAnimationFrame.bind(window);
    globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

    const viewport = window.document.getElementById("viewport");
    Object.defineProperty(viewport, "clientHeight", {
      configurable: true,
      value: 88,
    });

    const [alpineModule, { default: virtualList }] = await Promise.all([
      import("alpinejs"),
      import("../src/index.js"),
    ]);
    const Alpine =
      alpineModule.default?.default ??
      alpineModule.default ??
      alpineModule.Alpine;

    window.Alpine = Alpine;
    Alpine.plugin(virtualList);
    Alpine.start();

    await flush();

    const options = [...window.document.querySelectorAll(".option")];
    expect(options).toHaveLength(2);
    expect(options[1].getAttribute("data-selected")).toBe("yes");
    expect(window.document.getElementById("selected").textContent).toBe("Beta");

    options[0].dispatchEvent(
      new window.MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    await flush();

    const updatedOptions = [...window.document.querySelectorAll(".option")];
    expect(updatedOptions[0].getAttribute("data-selected")).toBe("yes");
    expect(updatedOptions[1].getAttribute("data-selected")).toBe("no");
    expect(window.document.getElementById("selected").textContent).toBe(
      "Alpha",
    );

    Alpine.destroyTree?.(window.document.body);
  } finally {
    window.close();

    for (const [key, value] of Object.entries(previousGlobals)) {
      if (value === undefined) {
        delete globalThis[key];
      } else {
        globalThis[key] = value;
      }
    }
  }
});
