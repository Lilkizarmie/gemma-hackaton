# RootRise Hackathon — Architecture

**Repository:** `gemma-hackaton`  
**Stack:** Expo (React Native) mobile + Node.js (Express, TypeScript) backend  
**AI:** Local Gemma via Ollama, or mock mode for demos

This document describes how the hackathon app is structured and how data flows through it. It applies only to this project.

---

## 1. Purpose

The app helps a farmer:

1. Find and map a field boundary on a map  
2. Get an automatic field-size estimate from the polygon  
3. Choose a planning goal (e.g. profit, food security)  
4. Receive a crop recommendation with economics and a short action plan  

Numbers come from **deterministic** logic in the backend. **AI** only explains and plans in natural language; it does not invent yields, costs, or prices.

---

## 2. Product shape

**Input:** Field geometry, location context, land size/units, goal, season (and optional budget).  

**Output:** Top crop (with score), calculators (seed, fertilizer, cost, yield, revenue, profit), and an explanation block (summary, advice bullets, action steps).

This is a **guided decision workflow**, not an open-ended chatbot.

---

## 3. High-level architecture

```text
Mobile (Expo)
      |
      |  POST /api/v1/decision
      v
Hackathon Backend (Express)
      |
      +------------------+------------------+
      |                                     |
      v                                     v
Deterministic pipeline              AI explanation layer
(validation, geometry,            (Ollama Gemma or mock;
 scoring, calculations)           prompt built from final numbers)
      |                                     |
      +------------------+------------------+
                         |
                         v
              Single JSON response
```

---

## 4. Repository layout

```text
gemma-hackaton/
├── README.md                 # Run instructions, env vars, API keys
├── architecture-plan.md      # This file
├── backend/
│   ├── src/
│   │   ├── app.ts            # Express app, CORS, /health, mounts routes
│   │   ├── server.ts         # HTTP server (PORT, HOST, LAN hints)
│   │   ├── routes/           # decision.routes.ts → /decision
│   │   ├── controllers/      # decision.controller.ts
│   │   ├── services/
│   │   │   ├── decision.service.ts   # Orchestrates pipeline + response shape
│   │   │   ├── scoring.service.ts    # Candidate ranking
│   │   │   ├── calculation.service.ts
│   │   │   ├── ai.service.ts         # Mock vs Ollama
│   │   │   ├── ollama.service.ts
│   │   │   └── prompt-builder.service.ts
│   │   ├── utils/            # validation, geometry
│   │   ├── types/            # decision + AI contracts
│   │   └── data/             # crops.json, pricing.json (bundled inputs)
│   └── README.md
└── mobile/
    ├── App.tsx
    ├── src/
    │   ├── screens/          # Field setup, goal selection, recommendation
    │   ├── components/
    │   ├── services/         # api.ts, config, payload, geometry, mock fallback
    │   └── types/
    ├── app.json
    ├── ios/ / android/       # Native projects after prebuild
    └── README.md
```

---

## 5. Mobile layer

**Role:** Collect inputs, render maps and forms, call the backend, show results.  

**Notable pieces:**

- **Field mapping and area:** Map UI, polygon drawing, client-side area helpers (`geometry` / payload builders).  
- **API client:** `POST` to `{EXPO_PUBLIC_API_BASE_URL}/api/v1/decision` (see root `README.md`).  
- **Resilience:** If the request fails, a **mock decision** can be used so the demo still runs (`useMockFallback` in config).  

**Stack:** React Native, Expo, TypeScript. Maps and Places use Google APIs configured via `app.json`, native manifests, and `EXPO_PUBLIC_*` env vars (documented in `README.md`).

---

## 6. Backend layer

**Role:** Validate requests, run the decision pipeline, return one JSON body.

**Stack:** Node.js, Express, TypeScript. Configuration via `backend/.env` (`AI_MODE`, `OLLAMA_*`, `PORT`, `HOST`, etc.).

**Endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| POST | `/api/v1/decision` | Full recommendation |

---

## 7. Deterministic decision pipeline

Owned by services such as `decision.service`, `scoring.service`, `calculation.service`, plus `utils/geometry` and `utils/validation`.

**Responsibilities:**

- Parse and validate the request contract (`types/decision`).  
- Derive or check field area from polygon where applicable.  
- Filter and score crop candidates using bundled JSON data (`src/data/`).  
- Compute seed, fertilizer, cost, yield, revenue, profit — **these numbers are authoritative** for the API response.

---

## 8. AI layer

**Role:** Turn the **already computed** structured result into farmer-facing text: why this crop, short advice, and a step list.

**Modes:**

- **`AI_MODE=mock`** — Safe placeholder text for demos without Ollama.  
- **`AI_MODE=ollama`** — Calls a local Ollama chat endpoint (e.g. Gemma); prompts are built so the model must not invent new numeric facts (`prompt-builder.service` + `ollama.service`).

---

## 9. Data strategy

Hackathon data ships as **JSON** under `backend/src/data/` (e.g. crops and pricing), loaded by the services. No database is required for the MVP.

Benefits: easy to edit for demos, deterministic, simple to review in submissions.

---

## 10. Recommendation logic (conceptual)

1. **Normalize input** — Field, boundary, land size/units, location, season, goal.  
2. **Candidates** — Filter crops by region, season, goal compatibility.  
3. **Score** — Rank by fit and economics (see `scoring.service`).  
4. **Select** — Top crop drives calculations.  
5. **Calculate** — Seed, fertilizer, cost, yield, revenue, profit (`calculation.service`).  
6. **Explain** — AI service adds narrative only; inputs are the structured outputs from step 5.  
7. **Respond** — Single payload for the app.

---

## 11. API contract (summary)

Primary handler: **`POST /api/v1/decision`**.

Request and response shapes are defined in `backend/src/types/decision.ts` and mirrored for the mobile app under `mobile/src/types/decision.ts`. The README and backend README describe how to run and smoke-test the AI path (`npm run test:ai`).

Example request/response JSON in earlier docs may differ slightly from the live types — **TypeScript types in the repo are the source of truth**.

---

## 12. Configuration and secrets

- **Backend:** `backend/.env` — Ollama URL/model, `AI_MODE`, port/host.  
- **Mobile:** `mobile/.env` — `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, plus native Google Maps keys in `app.json` / iOS / Android as listed in root `README.md`.

Never commit real API keys; use placeholders in repo and local `.env` files.

---

## 13. Principles

- **Deterministic code owns all numbers.**  
- **AI explains and plans**, using provided structured values only.  
- **UX** should stay simple: map → goal → result.  
- **Demo stability** matters: mock AI and mock mobile fallback exist on purpose.

---

For commands, prerequisites, and key placement, use **`README.md`** at the repository root.
