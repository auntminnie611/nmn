(() => {
  const STORAGE_KEY = "pulse-habits-v1";

  const form = document.getElementById("habit-form");
  const input = document.getElementById("habit-input");
  const list = document.getElementById("habit-list");
  const emptyState = document.getElementById("empty-state");
  const habitCount = document.getElementById("habit-count");
  const todayLabel = document.getElementById("today-label");
  const template = document.getElementById("habit-template");

  /** @type {{ id: string, name: string, createdAt: string, completions: string[] }[]} */
  let habits = loadHabits();

  todayLabel.textContent = formatLongDate(todayKey());
  render();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) return;

    habits.unshift({
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      completions: [],
    });

    input.value = "";
    persist();
    render({ animateNewest: true });
    input.focus();
  });

  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const item = target.closest(".habit-item");
    if (!item) return;

    const id = item.dataset.id;
    if (!id) return;

    if (target.closest(".check-btn")) {
      toggleToday(id);
      return;
    }

    if (target.closest(".delete-btn")) {
      deleteHabit(id);
    }
  });

  function toggleToday(id) {
    const habit = habits.find((entry) => entry.id === id);
    if (!habit) return;

    const today = todayKey();
    const index = habit.completions.indexOf(today);

    if (index >= 0) {
      habit.completions.splice(index, 1);
    } else {
      habit.completions.push(today);
      habit.completions.sort();
    }

    persist();
    render({ bumpId: id });
  }

  function deleteHabit(id) {
    habits = habits.filter((habit) => habit.id !== id);
    persist();
    render();
  }

  function render(options = {}) {
    const { bumpId = null } = options;
    list.replaceChildren();

    habitCount.textContent = `${habits.length} habit${habits.length === 1 ? "" : "s"}`;
    emptyState.hidden = habits.length > 0;

    for (const habit of habits) {
      const node = template.content.firstElementChild.cloneNode(true);
      const doneToday = habit.completions.includes(todayKey());
      const current = currentStreak(habit.completions);
      const best = bestStreak(habit.completions);

      node.dataset.id = habit.id;
      node.classList.toggle("is-done-today", doneToday);

      const nameEl = node.querySelector(".habit-name");
      const checkBtn = node.querySelector(".check-btn");
      const checkLabel = node.querySelector(".check-label");
      const weekEl = node.querySelector(".week");
      const currentEl = node.querySelector(".current-streak");
      const bestEl = node.querySelector(".best-streak");

      nameEl.textContent = habit.name;
      checkBtn.setAttribute("aria-pressed", String(doneToday));
      checkBtn.title = doneToday ? "Undo today's completion" : "Mark complete for today";
      checkLabel.textContent = doneToday ? "Undo today's completion" : "Mark complete for today";
      currentEl.textContent = String(current);
      bestEl.textContent = String(best);

      if (bumpId === habit.id) {
        currentEl.classList.add("bump");
        bestEl.classList.add("bump");
      }

      weekEl.replaceChildren(...buildWeekDots(habit.completions));
      list.appendChild(node);
    }
  }

  function buildWeekDots(completions) {
    const completed = new Set(completions);
    const fragments = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(todayKey(), -offset);
      const wrapper = document.createElement("div");
      const label = document.createElement("span");
      const dot = document.createElement("i");

      wrapper.className = "day-dot";
      if (completed.has(date)) wrapper.classList.add("is-complete");
      if (date === todayKey()) wrapper.classList.add("is-today");

      label.textContent = weekdayLetter(date);
      wrapper.append(label, dot);
      fragments.push(wrapper);
    }

    return fragments;
  }

  function currentStreak(completions) {
    if (!completions.length) return 0;

    const set = new Set(completions);
    let cursor = todayKey();

    if (!set.has(cursor)) {
      cursor = shiftDate(cursor, -1);
      if (!set.has(cursor)) return 0;
    }

    let streak = 0;
    while (set.has(cursor)) {
      streak += 1;
      cursor = shiftDate(cursor, -1);
    }
    return streak;
  }

  function bestStreak(completions) {
    if (!completions.length) return 0;

    const dates = [...new Set(completions)].sort();
    let best = 1;
    let run = 1;

    for (let i = 1; i < dates.length; i += 1) {
      if (shiftDate(dates[i - 1], 1) === dates[i]) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 1;
      }
    }

    return best;
  }

  function loadHabits() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((item) => item && typeof item.name === "string")
        .map((item) => ({
          id: String(item.id || crypto.randomUUID()),
          name: item.name.trim(),
          createdAt: item.createdAt || new Date().toISOString(),
          completions: Array.isArray(item.completions)
            ? item.completions.filter((value) => typeof value === "string")
            : [],
        }))
        .filter((item) => item.name);
    } catch {
      return [];
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }

  function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function shiftDate(key, days) {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return todayKey(date);
  }

  function weekdayLetter(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: "narrow",
    });
  }

  function formatLongDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
})();
