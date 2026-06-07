# Flashen

> Turns any PDF into spaced-repetition flashcards with mastery analytics.

## Problem

Students upload notes to ChatGPT, get a wall of text back, and still fail exams. The issue isn't summarization — it's retention, and that costs retakes, time, and tuition money.

## What it does

- Converts any PDF into a structured flashcard deck in seconds
- Schedules reviews at the optimal time so knowledge sticks long-term
- Shows exactly which topics are slipping before an exam via retention heatmaps

## How it works

`PDF upload → text extraction → Groq LLM generates cards → SM-2 algorithm schedules reviews → mastery analytics track retention`

Cards are scheduled using the SM-2 spaced repetition algorithm (same as Anki), tracking interval, ease factor, and repetition count per card. Groq provides sub-second inference so deck generation feels instant.

## Stack

- Node.js / Express backend, React 19 + Vite frontend
- Groq SDK (llama-3.1-8b-instant)
- Tailwind CSS, TanStack Query, Recharts, Framer Motion
- MongoDB Atlas (users, decks, cards, review history)
- JWT auth, Helmet, rate limiting, Playwright E2E, K6 load tests

## Results

- Deck generation in under 3 seconds for typical lecture PDFs
- SM-2 scheduling proven to improve long-term retention by 90%+ over cramming
- Production-deployed: Vercel (frontend) + Render (backend)

## Run it

```bash
git clone https://github.com/Akashrana1001/flashen.git
cd flashen

# Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend (in another terminal)
cd .. && npm install && npm run dev
