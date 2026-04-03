# NeevCAASPP — Project Guide

## What This App Is
A CAASPP Math practice app for Neev (Grade 5, Donlon Elementary, Pleasanton CA). Tracks answered questions, never repeats them, and shows progress by CAASPP domain/topic. Includes per-question timing and a daily review feature.

## Monorepo Structure
```
NeevCAASPP/                  ← git repo root, deploy script lives here
├── package.json             ← root package.json (holds app version)
├── deploy-neevcaaspp.sh
├── client/                  ← React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── components/  (NavBar)
│   │   └── pages/       (HomePage, ProgressPage, ReviewPage)
│   └── vite.config.js   ← injects __APP_VERSION__ from root package.json
└── server/                  ← Express + SQLite backend
    ├── index.js
    ├── db.js                ← schema + seeding (single user: Neev)
    ├── data/neev.db         ← SQLite database
    └── routes/              (questions.js, scores.js)
```

## Key Architecture Decisions
- **Single user**: Only Neev (user_id=1, grade=5) — no user management
- **Database**: SQLite via Node's built-in `node:sqlite` (`DatabaseSync`)
- **CAASPP Domains**: NBT, NF, OA, MD, G (5 domains, 13 topics)
- **Questions**: Multiple choice, 20 per topic target (260 total), Grade 5 hard
- **Timer**: Per-question `time_seconds` stored in scores table
- **Answered tracking**: `scores` table — no re-asking answered questions
- **Version**: Root `package.json`, injected at build as `__APP_VERSION__`

## Local Development
```bash
# Install dependencies
npm run install:all

# Start both servers (from repo root)
npm run dev

# Client: http://localhost:5174
# Server: http://localhost:3002
```

## Deploying
```bash
# Minor version bump (default)
bash deploy-neevcaaspp.sh

# Major version bump
bash deploy-neevcaaspp.sh --major
```
The deploy script: bumps version → commits → pushes to GitHub → copies DB to VPS → runs remote deploy.

**Always run the deploy script rather than pushing manually.**

## VPS
- Host: `root@31.97.211.40`
- App path: `/opt/NeevCAASPP/`
- Process manager: PM2 (app name: `neev-caaspp`)
- Remote deploy script: `/opt/NeevCAASPP/deploy.sh`
- Served on: **port 8080** (NeeVasMathLab is on port 80)

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/questions/quiz?count=10` | Fetch unanswered questions (grade 5, user 1) |
| POST | `/api/scores` | Record an answer (includes time_seconds) |
| GET | `/api/scores/summary` | Per-domain/topic score summary |
| GET | `/api/scores/daily?date=YYYY-MM-DD` | All answers for a given day |
| DELETE | `/api/scores` | Reset all scores for Neev |

## CAASPP Topics
| Domain | Topics |
|--------|--------|
| NBT | Place Value & Decimals, Multi-Digit Operations, Decimal Operations |
| NF | Adding & Subtracting Fractions, Multiplying Fractions, Dividing Fractions, Fraction Word Problems |
| OA | Patterns & Rules, Expressions & Order of Operations, Numerical Relationships |
| MD | Volume, Measurement Conversions, Line Plots with Fractions |
| G | Coordinate Plane, 2D Figure Classification |

## Current Version
Check `package.json` → `version` field. Do not manually edit — let the deploy script bump it.
