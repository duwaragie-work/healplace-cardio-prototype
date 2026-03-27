# Healplace Cardio Prototype — Technical Implementation Overview

This document outlines the current state of the Backend and Frontend implementations for the Elevance Health Foundation Patient Safety Prize prototype, along with a detailed breakdown of the application's data flow.

---

## Part 1: Backend Implementation Status

### 1. Architecture Overview
*   **Framework:** NestJS
*   **Database:** PostgreSQL, accessed via Prisma ORM
*   **Role:** The backend exclusively manages backend business logic including user management (JWT Auth/OTP), clinical data processing pipelines, AI contextualization, and persistent storage.
*   **Deployment:** Configured to deploy on Railway (root directory: `/backend`).

### 2. Core Event Pipeline
The cardiovascular monitoring relies heavily on an event-driven sequence triggered every time a patient logs their vitals. The pipeline flows via `@nestjs/event-emitter`: `ENTRY_CREATED` ➔ `BASELINE_COMPUTED` ➔ `DEVIATION_DETECTED` ➔ `ESCALATION_CREATED`

*   **Data Ingestion & Baseline:** Uses a 7-Day Rolling Baseline Algorithm to calculate a baseline for Systolic/Diastolic BP if sufficient data points are present.
*   **Deviation Detection:** Evaluates new entries against absolute clinical parameters and relative baseline parameters. Checks for deviations in `SYSTOLIC_BP`, `DIASTOLIC_BP`, `WEIGHT`, and `MEDICATION_ADHERENCE`.
*   **Escalation Routing:** Triggers alerts when deviations occur consecutively (e.g., 3+ occurrences in the last 3 days). Level 1 is a 24hr care team alert; Level 2 is an immediate intervention/911 prompt.

### 3. AI Chat Re-Architecture
*   **Retrieval-Augmented Context:** The system dynamically injects real-time patient history (recent BP/weight entries, computed baseline, active deviation alerts, communication preferences) into the context window before calling the LLM.

### 4. Fully Built vs. Removed
*   **Built:** Prisma Schema Migration for Cardio metrics, Check-in DTOs, Analytics Engine (Baseline, Deviation, Escalation), Auth Module (JWT/OTP/Social login).
*   **Removed:** SafePlace features have been completely cut from scope.

---

## Part 2: Frontend Implementation Status

### 1. Architecture Overview
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Role:** Mobile-responsive web app serving as the patient-facing interface and the simulated provider dashboard. Connects to the backend via `NEXT_PUBLIC_API_URL`.
*   **Deployment:** Configured to deploy on Vercel (root directory: `/frontend`).

### 2. Application Routes & Structure
The frontend application has routing set up for several key workflows:
*   `/onboarding` — Patient intake and setup.
*   `/auth` & `/register` — Authentication flows.
*   `/check-in` — The daily journal flow for logging BP and weight.
*   `/chat` — AI chatbot interface for retrieving health advice.
*   `/dashboard` — Patient-facing dashboard.
*   `/provider` — Care Team Portal dashboard (Simulated).

### 3. What is Fully Built vs. Simulated

**Fully Connected / Functional UI:**
*   **Check-in Submissions:** The daily journal check-in UI successfully maps to the backend DTO pipeline.
*   **Onboarding Intake:** UI collects initial patient baselines and routes them properly.
*   **AI Chat UI:** Interfaces directly with the heavily contextualized AI endpoints on the backend.

**Simulated ("Smoke and Mirrors" - Frontend Only):**
*   **Provider Dashboard (`ProviderDashboard.tsx`):** Provides realistic but entirely hardcoded Patient Alerts, BP Trends, and active patient statistics. It simulates Level 1 and Level 2 events but doesn't pull live data from `escalation.service.ts`.
*   **TTS / STT Capabilities:** Implemented as a functional-looking UI audio toggle button without an actual Speech API wired behind it. 
*   **Silent Literacy Detection:** Hardcoded triggers switch the interface to an "audio-first" mode for a specific demo patient. Real-time text comprehension analysis is not active.
*   **Multilingual Support:** Application toggling between EN/ES relies purely on hardcoded UI string swaps mapped to a frontend language toggle.

---

## Part 3: Backend Data & Event Flow

### 1. Initial Authentication & Intake
1.  **Auth Module (`src/auth`):** The user signs up or logs in via OTP or social login. The backend issues a JWT (JSON Web Token).
2.  **User Context:** The JWT is passed in the `Authorization: Bearer` header for all subsequent API calls.
3.  **Onboarding:** The patient submits initial medical history (CVD risk, communication preferences, baseline info) via user profile endpoints to instantiate their record.

### 2. Daily Check-In Workflow (The Engine)
When a patient logs their daily metrics (e.g., Blood Pressure, Weight, Symptoms, Medication Status) from the `/check-in` frontend page:

1.  **Gateway:** A request hits the `daily_journal` controller. Payload validation occurs strictly via DTOs mapping to the updated Cardio Prisma schema.
2.  **Entry Creation:** The new log is saved to the PostgreSQL database.
3.  **Event Emitted:** The system emits `JOURNAL_EVENTS.ENTRY_CREATED` via `EventEmitter2`.

### 3. The Cascading Event Pipeline
The remainder of the backend logic executes asynchronously as decoupled listener services:

1.  **Phase A: Baseline Computation (`baseline.service.ts`)**
    *   Listens to `ENTRY_CREATED`.
    *   Queries the last 7 days of BP logs for that user.
    *   Recalculates the moving average if conditions are met.
    *   Emits `JOURNAL_EVENTS.BASELINE_COMPUTED`.

2.  **Phase B: Deviation Detection (`deviation.service.ts`)**
    *   Listens to `BASELINE_COMPUTED`.
    *   Takes the new reading and compares it against:
        *   **Absolute Thresholds:** e.g., Is Systolic BP dangerously high (>180)?
        *   **Relative Thresholds:** e.g., Is Systolic BP > 20% higher than the patient's individual 7-day baseline?
    *   If a deviation is found, it logs an Anomaly/Deviation record.
    *   Emits `JOURNAL_EVENTS.ANOMALY_TRACKED`.

3.  **Phase C: Escalation Routing (`escalation.service.ts`)**
    *   Listens to `ANOMALY_TRACKED`.
    *   Checks historical frequency. *Rule:* Is this the 3rd occurrence of this deviation type in the last 3 days? If fewer, it's just tracked, not escalated.
    *   If the escalation threshold is met, it categorizes the severity:
        *   `LEVEL_1`: Standard alert requiring a 24-hour SLA from the care team.
        *   `LEVEL_2`: Emergency alert triggered immediately by `HIGH` severity deviations or critical emergency symptoms (e.g., chest pain, shortness of breath). Prompts immediate intervention/911.

### 4. AI Interaction Flow (`chat` module)
When a patient interacts with the AI Assistant on the frontend:
1.  **Request:** User sends a query to the chat endpoint.
2.  **Context Assembly (`system-prompt.service.ts`):** 
    *   The backend queries the latest check-in data.
    *   It extracts the computed baselines and active `LEVEL_1`/`LEVEL_2` alerts.
    *   It packages demographic context (language, preferences).
3.  **Prompt Construction:** The user's query is stitched together with this rich cardiovascular patient context.
4.  **LLM Execution:** The packaged prompt is sent to the LLM to yield a highly personalized, medically contextual response.
