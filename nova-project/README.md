# Nova Engine v2 — Full-Feature AI Recommendation Engine

## What's in this build

Almost everything from your feature list is implemented and working. A few
honest notes on *how* things are implemented, since "AI" here means
deterministic, rule-based logic (computed in Python/JS from your inputs),
not a live LLM:

| Your request | What's actually running |
|---|---|
| Floating AI robot, blink, wave, jet flame | Custom SVG + CSS animations (float, blink, wave, thruster glow) |
| Particle background (tsParticles) | Real tsParticles, blue/cyan/purple, mouse hover + click interaction |
| Glassmorphism, neon glow, dark theme | CSS — plus Light / Cyber Blue / Purple theme variants via the dots in the top bar |
| Extended form (10 fields) | All fields present: name, college, year, branch, skills, domain, language, experience, internship mode, learning style |
| Internship / project / resource recommendations | Real backend logic in `backend/app.py` — domain-matched, difficulty-tiered, deterministic given your inputs |
| Skill Analysis bars | Computed from keyword-matching your entered skills against 8 skill categories |
| AI Dashboard (5 scores) | Formulas combining skill scores, experience level, and skill count — see `compute_dashboard()` in `app.py` |
| Interactive Charts (Chart.js) | Radar, doughnut, bar, line, pie — real Chart.js, fed by the backend's `charts` payload |
| Recommendation cards (logo/difficulty/duration/rating/skills/apply) | All present; "Apply" / "Start Learning" / "GitHub" buttons are demo actions (see below) |
| Internship Finder (mode/company size/duration filters) | Mode filter (Remote/Hybrid/Onsite) + search + sort are live. Company-size and exact-duration filters are in the data model but not yet wired to extra filter chips — easy to add if you want them |
| Project Gallery | Folded into the same recommendation-card grid under the "Projects" tab |
| AI Career Score + explanation | Career Readiness gauge + AI Insights list |
| AI Assistant (floating chatbot) | Real rule-based assistant in `assistant.js` — answers from your actual recommendation results |
| Voice Assistant | Real Web Speech API (`SpeechRecognition` + `speechSynthesis`) wired into the same assistant — click the mic, speak, get a spoken reply. Chrome-based browsers only |
| Download Report (PDF/CSV) | Real jsPDF report + real CSV export, both client-side |
| Theme Switch | 4 working themes via CSS variables |
| Loading animation (scanning steps + progress bar) | Real 4-step sequence matching your wording |
| Success animation | Real canvas-confetti burst + toast message |
| Favorites | In-memory (session) favorites with a dedicated tab and counter. Not saved to disk — see note below |
| Search & Filter, Sort | Live text search + mode filter + sort by match/rating/difficulty |
| Achievement Badges | Rule-based badge unlocks (Python Master, ML Beginner, Career Ready, etc.) |
| AI Insights | Template-based sentences generated from your skill gap and readiness scores |
| Hologram cards around robot | The floating Internships/Projects/Courses cards |
| Micro animations (hover/tilt/lift) | Card hover-lift, button states, animated gauge rings |
| Recommendation Match Meter (stars) | Top-3 skill categories with % and star rating |
| AI Skill Gap Analysis | Have vs. missing core-stack skills per domain |
| AI Career Roadmap | Domain-specific step timeline |
| Live Statistics | Animated gauge rings + stat cards |

**Not implemented (would need real infrastructure, not just code):**
- A genuine LLM behind the chatbot/insights — wiring this to a real API (OpenAI, Anthropic, etc.) is straightforward to add but needs your own API key and a backend route to call it.
- Persistent favorites across page reloads — intentionally left in-memory; say the word and I'll add `localStorage` persistence.
- Company-size / exact-duration filter chips in the UI (data already supports it).

## Structure

```
nova-v2/
├── backend/
│   ├── app.py            ← Flask API: recommendations, dashboard scoring, chart data
│   └── requirements.txt
└── frontend/
    ├── index.html         ← page structure
    ├── style.css           ← all styling incl. 4 themes
    ├── config.js           ← API_BASE_URL
    ├── app.js               ← particles, form, dashboard, charts, cards, filters, export
    └── assistant.js          ← chatbot + voice assistant
```

## Run it

```bash
# backend
cd backend
pip install -r requirements.txt
python app.py            # http://127.0.0.1:5050

# frontend (separate terminal)
cd frontend
python -m http.server 8080   # http://127.0.0.1:8080
```

CDN dependencies (loaded from `index.html`, need internet access in the
browser): tsParticles, Chart.js, canvas-confetti, jsPDF. All from jsDelivr.

## Wiring "Apply" / "Start Learning" / "GitHub" buttons to real links

Right now those buttons show a demo toast (`app.js`, the `cardGrid` click
handler). To make them real, add a `link` field to each item in
`backend/app.py`'s data and change the click handler to `window.open(item.link)`.