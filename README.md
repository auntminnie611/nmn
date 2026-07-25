# Pulse — Habit Tracker

A clean, modern habit tracker built with HTML, CSS, and JavaScript. Habits, daily completions, and streaks are saved in your browser with `localStorage`.

## Quick start

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Features

- Add any habit you want to track
- Mark habits complete for today (toggle to undo)
- See **current** and **best** streaks
- Last-7-days completion strip per habit
- Delete habits you no longer need
- Persists across refreshes via `localStorage`

## File structure

```
/
├── index.html      # Markup and habit row template
├── css/styles.css  # Theme, layout, motion
├── js/app.js       # CRUD, streaks, localStorage
├── PLAN.md         # Product/tech plan
└── README.md
```

## Plan summary

See [PLAN.md](./PLAN.md) for the full plan: goals, data model, streak rules, and UI outline.

## Streak rules

- **Current**: consecutive days ending today if you completed today; otherwise ending yesterday
- **Best**: longest consecutive run in that habit’s history
