# RootRise Gemma Hackathon Project

This folder contains the hackathon build for RootRise: a field-first crop decision tool that combines:

- direct field mapping on mobile
- deterministic crop, cost, yield, and profit calculations
- Gemma-powered farmer-friendly explanations through Ollama

## Submission summary

RootRise helps a farmer map a real field, calculate its size automatically, choose a farming goal, and receive a crop recommendation with:

- estimated seed and fertilizer needs
- projected cost, yield, revenue, and profit
- a clear explanation of why the crop was chosen
- a practical action plan

This is a guided decision workflow, not a generic chatbot.

## What this demo does

The farmer:

1. finds the field location
2. draws the field boundary
3. gets automatic field size estimation
4. chooses a farming goal
5. receives a crop recommendation, economics, and action plan

## Project structure

- `backend` contains the decision engine API
- `mobile` contains the Expo mobile app
- `architecture-plan.md` contains the implementation plan and system design
- `submission-kit.md` contains the pitch, judging story, and technical summary
- `demo-script.md` contains a concise demo walkthrough

## Current scope note

The field-mapping flow is geography-neutral, but the current hackathon crop dataset is centered on Nigerian crop contexts. That means the demo works best when evaluated with Nigerian crop/location examples.

## API keys and secrets (where to put them)

Do not commit real keys. Replace every `your_api_key_here` placeholder after cloning.

### Google Maps (same key in every place below)

Create one key in [Google Cloud Console](https://console.cloud.google.com/) with **Maps SDK for Android**, **Maps SDK for iOS**, and **Places API** (and any other APIs the app uses) enabled for your bundle IDs / package name.

| Location | What to set |
| -------- | ----------- |
| `mobile/app.json` | Under `expo.ios.config`, set `googleMapsApiKey`. Under `expo.android.config.googleMaps`, set `apiKey`. |
| `mobile/ios/RootRiseHackathon/AppDelegate.swift` | In `GMSServices.provideAPIKey("…")`, use the same key (iOS native Maps). |
| `mobile/android/app/src/main/AndroidManifest.xml` | In `<meta-data android:name="com.google.android.geo.API_KEY" …/>`, set `android:value` to the same key. |
| `mobile/.env` (create this file; keep it out of git) | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key` — used for Places / JS-side map config. Restart Metro after changes. |

After editing `app.json` or native files, run a fresh native build if needed (`npx expo prebuild` or `npx expo run:ios` / `run:android`).

### Backend URL for a physical device

| Location | What to set |
| -------- | ----------- |
| `mobile/.env` | `EXPO_PUBLIC_API_BASE_URL=http://YOUR_MAC_LAN_IP:5050` — phone and Mac must be on the same Wi‑Fi. For iOS Simulator on the same machine, you can omit this or use `http://127.0.0.1:5050`. |

Restart Metro after changing `.env`.

### Backend (Ollama — no cloud API key)

| Location | What to set |
| -------- | ----------- |
| `backend/.env` | See [Backend setup](#backend-setup): `AI_MODE`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, optional `PORT` / `HOST`. |

## Local setup

### 1. Prerequisites

Make sure these are installed on your Mac:

- Node.js and npm
- Ollama
- Expo Go on your phone, or an Expo-compatible local mobile workflow

### 2. Prepare Ollama

Start Ollama:

```bash
ollama serve
```

In another terminal, pull the Gemma model if you have not already:

```bash
ollama pull gemma3:1b
```

You can confirm the model is available with:

```bash
ollama list
```

## Backend setup

### 3. Install backend dependencies

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/backend
npm install
```

### 4. Configure backend environment

Create a `.env` file in `backend` using this shape:

```env
PORT=5050
AI_MODE=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma3:1b
```

If you want to test without Gemma, use:

```env
AI_MODE=mock
```

### 5. Verify the AI path

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/backend
npm run build
npm run test:ai
```

If this works, the backend can reach your local Gemma model.

### 6. Start the backend

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/backend
npm run dev
```

When it starts successfully, you should see the listen address and, on a normal machine, suggested **LAN / device base URLs** for phones on the same network.

### 7. Watch live backend logs

Every mobile recommendation request is now logged in the backend terminal.

You will see:

- the incoming request summary
- the generated response payload
- any validation or server errors

This is useful during demo testing because you can confirm:

- the phone is hitting the real backend
- the backend is using the expected location, goal, and season
- the returned recommendation matches what the app displays

## Mobile setup

### 8. Install mobile dependencies

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/mobile
npm install
```

### 9. Point the mobile app to your Mac

In `mobile/.env`, set your backend base URL (see [API keys and secrets](#api-keys-and-secrets-where-to-put-them)):

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.132:5050
```

Notes:

- use `127.0.0.1` or omit the variable only for an iOS Simulator on the same Mac
- for a physical phone, use your Mac's LAN IP (same Wi‑Fi as the phone)
- restart Metro after editing `.env`

### 10. Start the mobile app

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/mobile
npm run start
```

Then open it in Expo Go on your phone.

## End-to-end test

### 11. Test the full flow

1. map a field on the phone
2. choose a goal and season
3. submit the recommendation request
4. confirm the result screen says `Live backend result`
5. check the backend terminal for the logged request and response

If the app says `Demo-safe fallback result`, the phone did not reach the backend and the app used its built-in fallback mode.

## Troubleshooting

### Phone cannot reach the backend

Check these:

- the backend is still running
- `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env` uses your Mac's LAN IP, not `localhost` (physical devices)
- the phone and Mac are on the same Wi-Fi
- macOS firewall is not blocking Node
- `OLLAMA_BASE_URL` is still `http://127.0.0.1:11434`

### Gemma is not being used

Check these:

- `AI_MODE=ollama` in `backend/.env`
- `ollama serve` is running
- `ollama list` shows `gemma3:1b`
- `npm run test:ai` succeeds

### The app still works but says fallback

That means the mobile app is healthy, but the live backend connection failed. Check the network path first.

## Useful commands

Backend:

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/backend
npm run dev
```

Backend AI test:

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/backend
npm run build
npm run test:ai
```

Mobile:

```bash
cd /Users/jeffery.adolor/Documents/GitHub/RootRise/gemma-hackaton/mobile
npm run start
```
