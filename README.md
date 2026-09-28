# AttendGuard – Attendance Analytics Platform
Open `index.html` in Chrome or Edge (internet needed once for fonts and the PDF reader). No build step.

## New in this version
- Calendar (semester months, holidays, planned leave, per-day skip verdicts, weekly load), click to mark leave/holiday.
- "Should I skip?" table for the next class days and an attend-first priority list.
- Letters: Leave (medical, personal, family, emergency, bereavement) and OD (hackathon, paper, sports, cultural, NSS/NCC, placement, project) templates, optional attendance-impact paragraph, Open in Gmail / mail app / copy / .txt / .doc / print-to-PDF.
- OD classes column (counted as present, switchable), Email summary to parent via Gmail, CSV export, print report.
- Saves automatically in this browser (localStorage); backup/restore JSON; custom timetable CSV import.

## Files
- `data.js`      Sample timetable dataset: 13 sections transcribed from the 10 provided PDFs (edit here to add/replace).
- `app.js`       Calculation engine, charts (pure SVG/CSS), tabs, attendance import (PDF/CSV).
- `extras.js`    Calendar, skip verdicts, persistence, settings, export.
- `letters.js`   OD / Leave letter generator with Gmail.
- `boot.js`      Startup.
- `assistant.js` AI assistant: language, female/male voice, speech-to-text, text-to-speech.
- `style.css`, `index.html`

## How it works
- Classes so far / left are counted per subject from the weekly timetable between 29 Aug and 29 Nov 2026 (holidays excluded). Each period counts as one class.
- Must-attend to finish >= p% = ceil(p x (conducted + left) - attended). If that exceeds classes left -> "Irreversible detention".
- Consecutive recovery = ceil((t x conducted - attended) / (1 - t)).
- Overall % = total attended / total conducted (not an average of subject %).
- Full days off: greedy pick of lightest days while every subject keeps its skip budget.
- Safety score = position between the detention line (0) and 100%.

## Attendance upload
Upload a PDF/CSV whose lines contain the subject name and conducted/attended numbers. Rows are matched to timetable subjects by name; unmatched lines are listed and everything remains editable in the table. Scanned (image-only) PDFs cannot be read; enter values manually.

## AI assistant
Works offline in English, Hindi, Tamil for built-in questions. Paste an Anthropic API key (kept in memory only) for free-form answers in any listed language. Speech features use the browser Web Speech API (Chrome/Edge). Female/Male picks an installed voice by name; otherwise pitch is adjusted.
