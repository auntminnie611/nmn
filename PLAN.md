# Habit Tracker — Plan

## Goal
A simple, clean habit tracker that lets you add habits, mark them complete each day, and see streaks. Data persists in the browser via `localStorage`.

## Tech
- **HTML** — structure
- **CSS** — layout and modern styling
- **JavaScript** — app logic and `localStorage`
- No frameworks or build step

## File structure
```
/
├── index.html      # App shell and markup
├── css/
│   └── styles.css  # Layout, theme, components
├── js/
│   └── app.js      # Habits CRUD, streaks, persistence
├── PLAN.md         # This plan
└── README.md       # How to run and use
```

## Features (v1)
1. **Add habit** — name any habit you want to track
2. **Mark complete** — toggle today’s completion with one click
3. **Streaks** — show current streak and best streak per habit
4. **Delete habit** — remove habits you no longer need
5. **Persist** — save everything to `localStorage` so it survives refresh
6. **Week strip** — last 7 days of completion at a glance

## Data model
```js
{
  habits: [
    {
      id: "uuid",
      name: "Drink water",
      createdAt: "2026-07-25T12:00:00.000Z",
      completions: ["2026-07-23", "2026-07-24", "2026-07-25"] // YYYY-MM-DD
    }
  ]
}
```

## Streak rules
- **Current streak**: consecutive days ending today if completed today, otherwise ending yesterday
- **Best streak**: longest consecutive run in the completion history

## UI outline
1. Brand header + today’s date
2. Add-habit form
3. Habit list (interactive rows): name, week dots, streak stats, complete toggle, delete

## Out of scope (later)
- Accounts / sync
- Reminders / notifications
- Habit categories or goals beyond daily yes/no
