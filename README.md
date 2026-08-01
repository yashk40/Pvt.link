# Pvt.link

Remote control your Windows PC from anywhere using the Pvt.link Android app. Devices pair through a short-lived code, stay connected over a real-time channel, and respond to commands like **lock, unlock, restart, shutdown, sleep, screenshot, and webcam** — relayed securely through the Pvt.link backend.

## Components

This repository contains three parts of the Pvt.link system:

| Folder | What it is | Stack |
| --- | --- | --- |
| [`android app/`](android%20app/) | Controller app you run on your phone | Expo (React Native), TypeScript, Firebase, Socket.IO |
| [`windows app/`](windows%20app/) | Agent installed on the Windows PC you control | Electron, Socket.IO |
| [`backend/`](backend/) | Central API + realtime relay | Node.js, Express, Socket.IO, Firebase (Firestore) |

> A separate `worker-backend` is under development and is **not** part of this repository.

## How it works

1. Launch the **Windows app** → it registers with the backend and shows a **2-minute pair code**.
2. Sign in to the **Android app** → enter that code → the desktop is attached to your account.
3. The Windows agent keeps a live Socket.IO connection (30-second heartbeat); your phone connects the same way.
4. Tap a command in the app → the backend relays it to your PC → the agent executes it and reports back.
5. The backend **never executes OS commands** — it only relays. The Windows agent performs the actual actions locally.

Commands supported: `lock`, `unlock`, `restart`, `shutdown`, `sleep`, `screenshot`, `webcam`.

## Repository structure

```
pvtlink/
├── android app/          # Expo (React Native) controller — phone UI
│   └── src/
│       ├── screens/      # Onboarding, auth, dashboard, devices, activity, gallery, settings
│       ├── navigation/   # React Navigation stacks/tabs
│       ├── lib/          # api client, firebase, realtime (Socket.IO), settings
│       ├── components/   # shared UI
│       └── theme/        # design system
├── windows app/          # Electron agent for Windows
│   ├── main.js           # main process: pairing, socket, command execution
│   ├── preload.js
│   └── renderer/         # tray UI (index.html / app.js / style.css)
└── backend/              # Node API + realtime relay
    └── src/
        ├── server.js     # entry point
        ├── app.js        # Express app (cors, helmet, rate-limit, routes)
        ├── config/       # firebase (Admin SDK + in-memory fallback), socket
        ├── controllers/  # auth, devices, pair, commands
        ├── routes/       # REST route definitions
        ├── sockets/      # Socket.IO server logic
        └── middleware/   # auth, error handling
```

## Getting started

### 1. Backend

Prereq: Node.js 20+, and a Firebase project with Firestore enabled.

```bash
cd backend
cp .env.example .env   # fill in Firebase service-account values + secrets
npm install
npm run dev            # or: npm start
```

The health endpoint is `GET /health`.

**Environment variables** (`backend/.env`):

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP + Socket.IO port (default `5000`) |
| `CLIENT_ORIGINS` | Comma-separated allowed origins for CORS |
| `JWT_AGENT_SECRET` | Secret used to sign desktop-agent tokens |
| `FIREBASE_PROJECT_ID` | Firebase project id |
| `FIREBASE_CLIENT_EMAIL` | Firebase service-account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service-account private key |
| `IMGHOSTING_API_KEY` | Optional key for screenshot uploads (fallback: base64) |

> **Firestore fallback:** if Firestore is unreachable or quota-limited, the backend automatically switches to an in-memory store so local development keeps working. Note that data is lost on restart while running in fallback mode.

### 2. Windows app

```bash
cd "windows app"
npm install
npm start              # runs electron . in development
```

Set the backend URL in `windows app/.env` (optional — defaults to the hosted backend):

```
PVTLINK_SERVER_URL=http://localhost:5000
```

### 3. Android app

Prereq: Node.js, and either the Expo Go app or an Android emulator/device.

```bash
cd "android app"
npm install
npx expo start         # scan the QR code with Expo Go, or press 'a' for an emulator
```

Set your API base URL in `android app/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
```

- The Android **emulator** reaches your host machine via `http://10.0.2.2:5000`.
- A **physical phone** needs your PC's LAN address (`http://192.168.x.x:5000`) and the backend listening on all interfaces.

Firebase client config also lives in `android app/.env` as `EXPO_PUBLIC_FIREBASE_*` (copy `android app/.env.example` for the full list). The values are inlined at build time and never committed.

## REST API

Authentication:
- **Controller (phone) requests** use `Authorization: Bearer <Firebase ID token>` (login happens in the app via Firebase).
- **Agent (desktop) requests** use `Authorization: Bearer <agentToken>` returned by `/pair/desktop/session`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/pair/desktop/session` | – | Desktop registers itself; returns pair code + agent token |
| POST | `/pair/desktop/code` | agent | Refresh the desktop's pair code |
| GET | `/pair/desktop/status` | agent | Desktop status |
| POST | `/pair/desktop/unpair` | agent | Unpair the desktop |
| POST | `/pair/create` | user | Create a 2-minute pair code for a device |
| POST | `/pair/verify` | user | Consume a code and attach the device to your account |
| POST | `/commands/:type` | user | Send `lock`, `unlock`, `restart`, `shutdown`, `sleep`, `screenshot`, or `webcam` |
| GET | `/commands/history` | user | Most recent 100 commands |
| POST | `/devices/register` | user | Register/update a device |
| GET | `/devices` | user | List your devices |
| PATCH / DELETE | `/devices/:id` | user | Update or remove a device |
| GET | `/auth/profile` | user | Current user profile |

## Real-time protocol (Socket.IO)

- The Windows agent connects with `auth: { agentToken }`; the phone connects with `auth: { token: <firebase id token> }`.
- The device emits `device:identify`, then a heartbeat every 30 seconds.
- The server emits `command:receive` to the device; the device responds with `command:acknowledge`.
- Controllers receive `device:online`, `device:offline`, and `command:status` events.

## Security notes

- The backend only **relays** commands — the Windows agent decides whether/how to execute them.
- Commands are delivered only to devices registered to the authenticated user.
- Deploy `backend/firestore.rules` so Firestore denies direct client access — all access goes through the backend's Admin SDK.
- Keep service-account credentials and `.env` files out of version control (they are gitignored).
- A composite index on `commands` (`userId` ASC, `createdAt` DESC) is defined in `backend/firestore.indexes.json`.

## License

The Expo template license (`android app/LICENSE`, MIT) applies to the generated Expo scaffolding. No separate project-wide license is set yet.
