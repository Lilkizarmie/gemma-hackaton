# RootRise Hackathon Mobile

This folder contains the hackathon-specific mobile experience for the RootRise decision engine.

For the full local setup and end-to-end run guide, use:

- `/Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/README.md`

## Purpose

The mobile app will guide the farmer through:

- finding field location
- drawing the field boundary
- reviewing calculated field size
- selecting a planning goal
- viewing the recommendation, economics, and action plan

## Planned structure

- `src/screens` for flow screens
- `src/components` for reusable UI blocks
- `src/services` for API and mapping helpers
- `src/types` for shared client-side contracts

## Run

1. Install dependencies with `npm install`
2. Start Expo with `npm run start`
3. Start the backend in `../backend` with `npm run dev`
4. Keep `src/services/config.ts` on `http://localhost:5050` for an iOS simulator on the same Mac
5. If you test on a physical device or some Android setups, replace `localhost` with your Mac's LAN IP, for example `http://192.168.1.20:5050`
6. Keep `useMockFallback` enabled in `src/services/config.ts` if you want the app to remain demo-safe when the backend is unreachable

## Current flow

1. Map field boundary directly
2. Review auto-calculated field size
3. Choose recommendation goal
4. View recommendation, economics, and action plan

## Verification status

- TypeScript check passes
- the app has not yet been launched in Expo inside this sandbox
- update `src/services/config.ts` to match the machine running the backend before live testing on device or simulator
- if the backend cannot be reached or times out, the app falls back to a deterministic mock recommendation response
- the result screen now shows whether the recommendation came from the live backend or the mobile fallback
