# Healplace Cardio Prototype — AI Build Context

## Monorepo structure
- /backend  → NestJS + Prisma + PostgreSQL
- /frontend → Next.js + Tailwind CSS

## What this project is
A cardiovascular patient monitoring prototype adapted from the Healplace 
menopause/sleep platform. Built for the Elevance Health Foundation Patient 
Safety Prize (deadline April 7, 2026).

## Backend (NestJS)
Key modules in src/:
- auth/           → JWT auth, OTP, social login (reuse as-is)
- daily_journal/  → check-in flow, baseline, deviation, escalation (adapt for cardio)
- chat/           → AI chatbot with RAG (rewrite system prompt, add health data injection)
- users/          → user profiles (add BP history, CVD risk fields)
- prisma/         → database service

Event pipeline: ENTRY_CREATED → BASELINE_COMPUTED → DEVIATION_DETECTED → ESCALATION_CREATED

Old migrations deleted. After schema changes run:
cd backend && npx prisma migrate dev --name <migration_name>

## Frontend (Next.js App Router + Tailwind)
Mobile-responsive web app. Connects to backend via NEXT_PUBLIC_API_URL.

## What is BUILT vs SIMULATED
BUILT:
- Schema migration (sleep fields → BP/cardio fields)
- Check-in DTO and submission pipeline
- Baseline algorithm (7-day rolling BP window)
- Deviation detection (cardiovascular thresholds)
- Escalation L1 (24hr care team alert) and L2 (immediate 911 message)
- AI system prompt rewrite + patient health data injection into context
- Onboarding intake

SIMULATED (frontend UI only, no real integration):
- TTS/STT → audio toggle button, no real Speech API
- Silent literacy detection → one hardcoded demo patient flips to audio-first
- Provider dashboard → frontend mock with Chart.js BP trend chart, hardcoded data
- Multilingual → EN/ES string toggle, hardcoded strings only

REMOVED:
- SafePlace (out of scope entirely)

## Deployment
Backend → Railway (set root directory to: backend)
Frontend → Vercel (set root directory to: frontend)

## Build phases (always work on phase/X branch, never main or dev)
1. Schema migration — backend/prisma/schema/
2. Check-in DTO — backend/src/daily_journal/dto/
3. Baseline algorithm — backend/src/daily_journal/services/baseline.service.ts
4. Deviation detection — backend/src/daily_journal/services/deviation.service.ts
5. Escalation L1/L2 — backend/src/daily_journal/services/escalation.service.ts
6. AI context injection — backend/src/chat/services/system-prompt.service.ts
7. Onboarding intake — backend/src/users/ and frontend pages
8. Provider dashboard mock — frontend only
9. Simulation layer — frontend audio/language toggles
10. Demo data seeding — backend/prisma/seed.ts

## Rules for AI
- Always work on phase/X branch, never main or dev
- Backend changes: cd backend first
- Frontend changes: cd frontend first
- After schema changes always run: npx prisma migrate dev && npx prisma generate