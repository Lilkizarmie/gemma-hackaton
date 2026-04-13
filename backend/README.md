# RootRise Hackathon Backend

This folder contains the hackathon-specific backend for the RootRise decision engine.

For the full local setup and end-to-end run guide, use:

- `/Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/README.md`

## Purpose

The backend will:

- accept mapped field input
- derive or validate field area
- evaluate crop candidates
- compute deterministic farm estimates
- generate AI explanation and action guidance

## Planned structure

- `src/data` for hackathon datasets
- `src/routes` for API routes
- `src/controllers` for request handlers
- `src/services` for scoring, calculators, and AI orchestration
- `src/utils` for geometry and validation helpers
- `src/types` for request and response contracts

## Run

1. Install dependencies with `npm install`
2. Start development mode with `npm run dev`
3. The API will run on `http://localhost:5050` by default
4. Live request and response payloads are logged to the backend terminal

## Ollama integration

The backend supports two AI modes:

- `AI_MODE=mock`
- `AI_MODE=ollama`

To use local Gemma through Ollama:

1. Make sure Ollama is running
2. Pull a model, for example `ollama pull gemma3:1b`
3. Set `AI_MODE=ollama`
4. Optionally set:
   - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
   - `OLLAMA_MODEL=gemma3:1b`

The current local setup has been verified with `gemma3:1b` through Ollama.

## Current endpoint

- `POST /api/v1/decision`
- `GET /health`

## AI smoke test

After building the backend, you can verify the explanation layer with:

1. `npm run build`
2. `npm run test:ai`

If `AI_MODE=ollama` and Ollama is running with the configured model available, this command will exercise the real local Gemma path.

## Verification status

- TypeScript build passes
- core decision service was smoke-tested directly
- Ollama-backed Gemma has been verified locally through `npm run test:ai`
- local port binding was blocked in the sandbox, so live HTTP verification should be done on a normal local machine
