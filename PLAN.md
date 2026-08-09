# Tally — Adding Machine Plan

## Goal
A browser adding machine that posts each number to a persistent on-screen tape, so every figure you enter stays visible while a running total updates.

## Tech
- **HTML** — structure
- **CSS** — layout and machine/tape styling
- **JavaScript** — entry, tape, totals
- No frameworks or build step

## File structure
```
/
├── index.html      # App shell: tape + keypad
├── css/
│   └── styles.css  # Atmosphere, machine, tape
├── js/
│   └── app.js      # Entry logic, tape, keyboard
├── PLAN.md         # This plan
└── README.md       # How to run and use
```

## Features (v1)
1. **Digit entry** — type with the on-screen pad or keyboard
2. **Post to tape** — `+` / Enter adds; `−` subtracts
3. **On-screen tape** — every posted number stays listed
4. **Running total** — always visible at the foot of the tape
5. **Clear entry / Clear all** — wipe the current figure or the whole tape
6. **Decimals** — single decimal point per entry
7. **Persist** — save the tape in `localStorage` across refresh

## Data model
```js
{
  entries: [
    { id: "uuid", value: 12.5, op: "add" },   // op: "add" | "sub"
  ],
  draft: "0"
}
```

## UI outline
1. Brand header (Tally) + one short line
2. Paper tape: posted lines + total
3. Current entry readout
4. Keypad (digits, operators, clear)

## Out of scope (later)
- Multiplication / division
- Memory registers (M+/MR)
- Print / export tape
- Named sessions
