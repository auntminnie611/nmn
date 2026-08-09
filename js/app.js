(() => {
  const STORAGE_KEY = "tally-adding-machine-v1";
  const MAX_DIGITS = 14;

  const tapeList = document.getElementById("tape-list");
  const tapeEmpty = document.getElementById("tape-empty");
  const tapeScroll = document.getElementById("tape-scroll");
  const totalValue = document.getElementById("total-value");
  const entryValue = document.getElementById("entry-value");
  const entryHint = document.getElementById("entry-hint");
  const keypad = document.querySelector(".keypad");
  const clearAllBtn = document.getElementById("btn-clear-all");
  const lineTemplate = document.getElementById("tape-line-template");

  /** @type {{ id: string, value: number, op: "add" | "sub" }[]} */
  let entries = [];
  /** @type {string} */
  let draft = "0";
  let fresh = true;

  load();
  render();

  keypad.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const key = target.closest(".key");
    if (!key) return;

    flashKey(key);

    if (key.dataset.digit != null) {
      inputDigit(key.dataset.digit);
      return;
    }

    switch (key.dataset.action) {
      case "decimal":
        inputDecimal();
        break;
      case "backspace":
        backspace();
        break;
      case "clear-entry":
        clearEntry();
        break;
      case "clear-all":
        clearAll();
        break;
      case "add":
        post("add");
        break;
      case "sub":
        post("sub");
        break;
      default:
        break;
    }
  });

  clearAllBtn.addEventListener("click", () => {
    clearAll();
  });

  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const { key } = event;

    if (key >= "0" && key <= "9") {
      event.preventDefault();
      inputDigit(key);
      flashAction(`[data-digit="${key}"]`);
      return;
    }

    if (key === "." || key === ",") {
      event.preventDefault();
      inputDecimal();
      flashAction('[data-action="decimal"]');
      return;
    }

    if (key === "+" || key === "=" || key === "Enter") {
      event.preventDefault();
      post("add");
      flashAction('[data-action="add"]');
      return;
    }

    if (key === "-" || key === "_") {
      event.preventDefault();
      post("sub");
      flashAction('[data-action="sub"]');
      return;
    }

    if (key === "Backspace") {
      event.preventDefault();
      backspace();
      flashAction('[data-action="backspace"]');
      return;
    }

    if (key === "Escape") {
      event.preventDefault();
      clearEntry();
      flashAction('[data-action="clear-entry"]');
      return;
    }

    if (key === "Delete") {
      event.preventDefault();
      clearAll();
      flashAction('[data-action="clear-all"]');
    }
  });

  function inputDigit(digit) {
    if (fresh || draft === "0") {
      draft = digit;
      fresh = false;
    } else if (digitCount(draft) < MAX_DIGITS) {
      draft += digit;
    }
    updateEntry();
  }

  function inputDecimal() {
    if (fresh) {
      draft = "0.";
      fresh = false;
    } else if (!draft.includes(".")) {
      draft += ".";
    }
    updateEntry();
  }

  function backspace() {
    if (fresh) return;
    if (draft.length <= 1) {
      draft = "0";
      fresh = true;
    } else {
      draft = draft.slice(0, -1);
      if (draft === "-" || draft === "") {
        draft = "0";
        fresh = true;
      }
    }
    updateEntry();
  }

  function clearEntry() {
    draft = "0";
    fresh = true;
    entryHint.textContent = "Cleared";
    updateEntry();
  }

  function clearAll() {
    entries = [];
    draft = "0";
    fresh = true;
    entryHint.textContent = "Tape cleared";
    persist();
    render({ bumpTotal: true });
  }

  /**
   * @param {"add" | "sub"} op
   */
  function post(op) {
    const value = Number(draft);
    if (!Number.isFinite(value)) {
      clearEntry();
      return;
    }

    // Posting 0 with a fresh zero is a no-op unless user typed it.
    if (fresh && value === 0 && draft === "0") {
      entryHint.textContent = op === "add" ? "Enter a number" : "Enter a number";
      return;
    }

    entries.push({
      id: crypto.randomUUID(),
      value: Math.abs(value),
      op,
    });

    draft = "0";
    fresh = true;
    entryHint.textContent = op === "add" ? "Added" : "Subtracted";
    persist();
    render({ bumpTotal: true, animateNewest: true });
  }

  function render(options = {}) {
    const { bumpTotal = false, animateNewest = false } = options;
    tapeList.replaceChildren();

    const empty = entries.length === 0;
    tapeEmpty.hidden = !empty;

    for (const [index, entry] of entries.entries()) {
      const node = lineTemplate.content.firstElementChild.cloneNode(true);
      const opEl = node.querySelector(".line-op");
      const valueEl = node.querySelector(".line-value");

      node.dataset.id = entry.id;
      if (entry.op === "sub") node.classList.add("is-sub");
      if (animateNewest && index === entries.length - 1) {
        node.classList.add("is-newest");
      }

      opEl.textContent = entry.op === "add" ? "+" : "−";
      valueEl.textContent = formatNumber(entry.value);
      tapeList.appendChild(node);
    }

    const total = entries.reduce((sum, entry) => {
      return entry.op === "add" ? sum + entry.value : sum - entry.value;
    }, 0);

    totalValue.textContent = formatNumber(total);
    if (bumpTotal) {
      totalValue.classList.remove("is-bump");
      void totalValue.offsetWidth;
      totalValue.classList.add("is-bump");
    }

    updateEntry();
    scrollTapeToBottom();
  }

  function updateEntry() {
    entryValue.textContent = draft;
  }

  function scrollTapeToBottom() {
    requestAnimationFrame(() => {
      tapeScroll.scrollTop = tapeScroll.scrollHeight;
    });
  }

  function digitCount(value) {
    return value.replace(".", "").replace("-", "").length;
  }

  function formatNumber(value) {
    const fixed = Number.isInteger(value)
      ? String(value)
      : String(Math.round(value * 1e10) / 1e10);

    const [whole, fraction] = fixed.split(".");
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction != null ? `${withCommas}.${fraction}` : withCommas;
  }

  function flashKey(key) {
    key.classList.add("is-pressed");
    window.setTimeout(() => key.classList.remove("is-pressed"), 120);
  }

  function flashAction(selector) {
    const key = keypad.querySelector(selector);
    if (key) flashKey(key);
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries }));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.entries)) return;

      entries = parsed.entries
        .filter(
          (item) =>
            item &&
            (item.op === "add" || item.op === "sub") &&
            typeof item.value === "number" &&
            Number.isFinite(item.value)
        )
        .map((item) => ({
          id: String(item.id || crypto.randomUUID()),
          value: Math.abs(item.value),
          op: item.op,
        }));
    } catch {
      entries = [];
    }
  }
})();
