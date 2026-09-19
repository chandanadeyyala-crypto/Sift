# Sift — Contract Clarity for Freelancers

> Upload any freelance contract, answer a few quick questions, get a plain-language report: what it says, what's risky, what's missing, and what to ask a lawyer.

---

## Monorepo Structure

```
Sift/
├── frontend/          # Vite + React + TypeScript
│   └── src/
│       ├── pages/         # Landing, Upload, Questions, Report, NotFound
│       ├── components/    # Nav, RiskBadge
│       ├── hooks/         # useUpload, useReport
│       ├── lib/           # firebase.ts, api.ts
│       └── styles/        # global.css
│
├── backend/           # Node + Express + TypeScript
│   └── src/
│       ├── routes/        # contracts.ts
│       ├── services/      # firebase.ts, gemini.ts
│       ├── prompts/       # analysisPrompt.ts
│       ├── models/        # contract.ts
│       └── middleware/    # errorHandler.ts, requestLogger.ts, authenticate.ts
│
└── .gitignore
```

---

## Quick Start

### 1. Configure Environment Variables

**Frontend** — copy and fill in:
```bash
cp frontend/.env.example frontend/.env
```

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same |
| `VITE_FIREBASE_PROJECT_ID` | Same |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `VITE_FIREBASE_APP_ID` | Same |

**Backend** — copy and fill in:
```bash
cp backend/.env.example backend/.env
```

| Variable | Where to find it |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `GROQ_API_KEY` | https://console.groq.com/keys (reserved for future use) |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `FIREBASE_CLIENT_EMAIL` | Same JSON file |
| `FIREBASE_PRIVATE_KEY` | Same JSON file — keep quotes, literal `\n` |

### 2. Install Dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### 3. Run Dev Servers

```bash
# Terminal 1 — Backend (port 4000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Frontend proxies `/api/*` to `http://localhost:4000` automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite 5, React 18, TypeScript, react-router-dom v6 |
| Auth / DB | Firebase (client SDK + Admin SDK + Firestore) |
| AI | Gemini 1.5 Flash (OCR + analysis) |
| Backend | Node 20, Express 4, Multer, CORS, dotenv |
| Styling | Vanilla CSS (white + sage #445D48 + sand #D6CC99) |

---

## Flow

```
Upload contract (PDF / image / text)
        ↓
Gemini Vision extracts text (no local OCR)
        ↓
Session saved to Firestore
        ↓
User answers 4 quick questions
        ↓
Gemini analyses contract + context
        ↓
Plain-language report rendered
```

---

> **Not legal advice.** Sift helps freelancers understand contracts faster. For high-stakes agreements, consult a qualified lawyer.
