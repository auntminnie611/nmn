# Tally — Adding Machine

A browser adding machine that keeps every number on a paper-style tape while a running total updates. Built with HTML, CSS, and JavaScript — no build step.

## Quick start

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How to use

1. Enter a number with the keypad or your keyboard
2. Press **+** / **Enter** to add it to the tape, or **−** to subtract
3. Each figure stays listed on the tape; the total updates below
4. **CE** clears the current entry; **AC** / **Clear tape** wipes everything

### Keyboard

| Key | Action |
| --- | --- |
| `0`–`9` | Digits |
| `.` | Decimal |
| `+` / `Enter` | Add to tape |
| `-` | Subtract from tape |
| `Backspace` | Delete last digit |
| `Escape` | Clear entry |
| `Delete` | Clear tape |

## Features

- On-screen tape that keeps every posted number
- Running total
- Add and subtract
- Decimal support
- On-screen keypad + full keyboard support
- Tape saved in `localStorage` across refresh

## File structure

```
/
├── index.html      # Markup: tape + keypad
├── css/styles.css  # Machine and tape styling
├── js/app.js       # Entry, tape, totals, persistence
├── PLAN.md         # Product/tech plan
└── README.md
```
