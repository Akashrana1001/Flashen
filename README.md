# Flashen

**Turns any PDF into a spaced-repetition flashcard deck in seconds — with mastery analytics, retention heatmaps, and an integrated study assistant.**

🔴 **[Live App →](https://flashen-one.vercel.app/)**

> 🎥 **[Watch 60-sec Demo →](#)** ← add your Loom link here

---

## The Problem

Students upload notes to ChatGPT, get a wall of text back, and still fail exams.

The real problem is not summarization — it is retention. Reading a summary once does nothing. You need to be tested on the right card at the right time, repeatedly, until it sticks.

---

## The Solution

Flashen takes any PDF — textbook chapter, lecture notes, research paper — and converts it into a flashcard deck via Groq LLM. Cards are then scheduled using the **SM-2 spaced repetition algorithm**, the same algorithm behind Anki, tracking interval, ease factor, and repetition count per card.

Study in Theater Mode, grade yourself, and let the algorithm decide when you see each card next. Mastery analytics and retention heatmaps show exactly where you stand.

---

## Architecture

```
React (Vite) ──► Node.js / Express ──► Groq LLM API
                       │
                  MongoDB Atlas
                (User / Deck / Card)
                       │
                  SM-2 Engine
               (scheduling logic)
```

---

## Key Engineering Decisions

**SM-2 spaced repetition engine** — not a wrapper around someone else's library. Implemented from scratch. Tracks `interval`, `repetitions`, and `easeFactor` per card. `nextReview` updates on every grade so the algorithm always knows what to serve next.

**Groq for fast inference** — PDF text is extracted server-side, chunked, and sent to Groq. Cards come back structured and ready to persist. Fast enough to feel instant.

**Mastery analytics** — review history is stored as telemetry per card. The backend aggregates it into retention heatmaps and forecast graphs so students can see which topics are slipping before an exam.

**Production-grade security** — JWT auth, Helmet headers, CORS allowlist, route-level rate limiting, owner-scoped MongoDB queries. No user can touch another user's data.

**Validated with real QA** — Playwright E2E golden-path tests cover the full study flow. K6 load tests validate the auth, chat, and study routes under configurable concurrent load.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, TanStack Query, Recharts, Framer Motion |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs |
| AI | Groq SDK (llama-3.1-8b-instant) |
| File Handling | multer, pdf-parse |
| Security | Helmet, express-rate-limit, CORS allowlist |
| QA | Playwright (E2E), K6 (load testing) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Core Flows

**PDF Ingestion**
1. User uploads PDF
2. Backend extracts text, prompts Groq for structured flashcards
3. Deck and cards are persisted and returned to the client

**Study and Scheduling**
1. User grades a card in Theater Mode
2. SM-2 algorithm updates interval, repetitions, and ease factor
3. nextReview is set — card returns at the optimal time

**Analytics**
1. Frontend queries mastery endpoint with browser timezone
2. Backend aggregates review history and due forecasts
3. UI renders retention heatmap and forecast graph

---

## Local Setup

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend
npm install && npm run dev
```

Minimum env values:

```env
# root .env
VITE_API_URL=http://localhost:5000/api

# backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/flashcard-engine
JWT_SECRET=dev_secret
GROQ_API_KEY=your_key
GROQ_MODEL=llama-3.1-8b-instant
CLIENT_URL=http://localhost:5173
```

---

## Testing

```bash
# E2E
npm run test:e2e:golden

# Load test (requires K6 installed globally)
npm run test:load
```

---

## What I Can Build For You

If you need an LLM-powered learning tool, a document ingestion pipeline, or a production Node.js + AI backend — [let's talk](mailto:sandeepakash537@gmail.com).
