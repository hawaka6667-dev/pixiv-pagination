const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const contentScript = fs.readFileSync(
  path.join(__dirname, "content.js"),
  "utf8"
);

class FakeElement {
  constructor({
    tagName = "a",
    href = null,
    rel = "",
    ariaLabel = "",
    disabled = false,
    ariaDisabled = false,
    className = "",
    editable = false
  } = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.classList = new Set(className.split(/\s+/).filter(Boolean));
    this.isContentEditable = editable;

    if (href !== null) this.attributes.set("href", href);
    if (rel) this.attributes.set("rel", rel);
    if (ariaLabel) this.attributes.set("aria-label", ariaLabel);
    if (disabled) this.attributes.set("disabled", "");
    if (ariaDisabled) this.attributes.set("aria-disabled", "true");
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  matches(selector) {
    if (selector === 'a[href], button, [role="button"]') {
      return this.tagName === "A" || this.tagName === "BUTTON";
    }

    const rel = this.getAttribute("rel");
    const ariaLabel = this.getAttribute("aria-label") || "";

    return (
      (selector.includes('[rel="next"]') && rel === "next") ||
      (selector.includes('[rel="prev"]') && rel === "prev") ||
      (selector.includes('[rel="previous"]') && rel === "previous") ||
      (selector.includes('[rel="last"]') && rel === "last") ||
      (selector.includes("Next") && /next|次/i.test(ariaLabel)) ||
      (selector.includes("Previous") && /previous|前/i.test(ariaLabel)) ||
      (selector.includes("Last") && /last|末/i.test(ariaLabel))
    );
  }
}

function createLocation(startUrl) {
  let currentUrl = new URL(startUrl);

  return {
    get href() {
      return currentUrl.href;
    },
    set href(value) {
      currentUrl = new URL(value, currentUrl.href);
    },
    get pathname() {
      return currentUrl.pathname;
    }
  };
}

function createHarness(url, elements = []) {
  const listeners = [];
  const location = createLocation(url);
  const document = {
    addEventListener(type, listener) {
      if (type === "keydown") listeners.push(listener);
    },
    querySelectorAll() {
      return elements;
    }
  };
  const chromeGlobals = {
    HTMLInputElement: class HTMLInputElement extends FakeElement {},
    HTMLTextAreaElement: class HTMLTextAreaElement extends FakeElement {},
    HTMLSelectElement: class HTMLSelectElement extends FakeElement {}
  };
  const context = vm.createContext({
    URL,
    document,
    location,
    ...chromeGlobals
  });

  vm.runInContext(contentScript, context);

  return {
    location,
    press(key, { ctrlKey = false, target = {} } = {}) {
      const event = {
        key,
        ctrlKey,
        target,
        prevented: false,
        preventDefault() {
          this.prevented = true;
        }
      };
      for (const listener of listeners) listener(event);
      return event;
    }
  };
}

function currentPage(harness) {
  return Number(new URL(harness.location.href).searchParams.get("p") || 1);
}

test("first page: left does not navigate, right goes to page 2", () => {
  const harness = createHarness("https://www.pixiv.net/users/1/artworks");

  const left = harness.press("ArrowLeft");
  assert.equal(currentPage(harness), 1);
  assert.equal(left.prevented, true);

  const right = harness.press("ArrowRight");
  assert.equal(currentPage(harness), 2);
  assert.equal(right.prevented, true);
});

test("middle page: left and right move one page", () => {
  const harness = createHarness(
    "https://www.pixiv.net/users/1/artworks?p=3"
  );

  harness.press("ArrowLeft");
  assert.equal(currentPage(harness), 2);

  const next = createHarness(
    "https://www.pixiv.net/users/1/artworks?p=3"
  );
  next.press("ArrowRight");
  assert.equal(currentPage(next), 4);
});

test("known last page: ctrl-right jumps to the actual last page", () => {
  const lastLink = new FakeElement({
    ariaLabel: "Last page",
    href: "/users/1/artworks?p=7"
  });
  const harness = createHarness(
    "https://www.pixiv.net/users/1/artworks?p=3",
    [lastLink]
  );

  harness.press("ArrowRight", { ctrlKey: true });
  assert.equal(currentPage(harness), 7);
});

test("visible page links identify a last page without rel=last", () => {
  const pageLinks = [
    new FakeElement({ href: "/users/1/artworks?p=1" }),
    new FakeElement({ href: "/users/1/artworks?p=5" })
  ];
  const harness = createHarness(
    "https://www.pixiv.net/users/1/artworks?p=5",
    pageLinks
  );

  const event = harness.press("ArrowRight");
  assert.equal(harness.location.href, "https://www.pixiv.net/users/1/artworks?p=5");
  assert.equal(event.prevented, false);

  const ctrlEvent = harness.press("ArrowRight", { ctrlKey: true });
  assert.equal(harness.location.href, "https://www.pixiv.net/users/1/artworks?p=5");
  assert.equal(ctrlEvent.prevented, true);
});

test("disabled next control blocks normal and ctrl-right navigation", () => {
  const next = new FakeElement({
    rel: "next",
    href: "/users/1/artworks?p=6",
    ariaDisabled: true
  });
  const harness = createHarness(
    "https://www.pixiv.net/users/1/artworks?p=5",
    [next]
  );

  const normal = harness.press("ArrowRight");
  assert.equal(harness.location.href, "https://www.pixiv.net/users/1/artworks?p=5");
  assert.equal(normal.prevented, false);

  const ctrl = harness.press("ArrowRight", { ctrlKey: true });
  assert.equal(harness.location.href, "https://www.pixiv.net/users/1/artworks?p=5");
  assert.equal(ctrl.prevented, true);
});

test("page 1000 is the hard upper limit", () => {
  const harness = createHarness(
    "https://www.pixiv.net/users/1/artworks?p=1000"
  );

  const normal = harness.press("ArrowRight");
  assert.equal(harness.location.href, "https://www.pixiv.net/users/1/artworks?p=1000");
  assert.equal(normal.prevented, false);

  const ctrl = harness.press("ArrowRight", { ctrlKey: true });
  assert.equal(harness.location.href, "https://www.pixiv.net/users/1/artworks?p=1000");
  assert.equal(ctrl.prevented, true);
});

test("invalid page parameter is ignored", () => {
  const harness = createHarness(
    "https://www.pixiv.net/users/1/artworks?p=invalid"
  );
  const event = harness.press("ArrowRight");

  assert.equal(harness.location.href, "https://www.pixiv.net/users/1/artworks?p=invalid");
  assert.equal(event.prevented, false);
});

test("editable targets are ignored", () => {
  const input = new FakeElement({ editable: true });
  const harness = createHarness("https://www.pixiv.net/users/1/artworks");
  const event = harness.press("ArrowRight", { target: input });

  assert.equal(currentPage(harness), 1);
  assert.equal(event.prevented, false);
});

test("user profile path enters the artworks page", () => {
  const harness = createHarness("https://www.pixiv.net/users/123");
  const event = harness.press("ArrowRight");

  assert.equal(harness.location.pathname, "/users/123/artworks");
  assert.equal(event.prevented, true);
});

