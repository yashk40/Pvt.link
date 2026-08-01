# Pvt.link backend

Production-oriented Express and Socket.IO backend for the Android controller and Windows device agent. It stores users, devices, pair codes, commands, refresh sessions, notifications, and audit logs in Firestore.

## Setup

1. Install Node.js 20+ and create a Firebase project with Firestore enabled.
2. In `backend`, copy `.env.example` to `.env` and fill the Firebase service-account values plus strong, distinct JWT secrets.
3. Install and run:

```bash
npm install
npm run dev
```

The health endpoint is `GET /health`.

For local testing, start the backend first, then launch the Windows app with `PVTLINK_SERVER_URL` set to the backend URL (for example `http://192.168.1.10:5000`). Set the same URL in Android as `EXPO_PUBLIC_API_URL`. `localhost` and Android emulator `10.0.2.2` only work when the backend is on that same machine; a physical phone needs the PC's reachable LAN address or a deployed HTTPS backend.

## REST API

All endpoints except registration/login/refresh require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a user (`name`, `email`, `password`) |
| POST | `/auth/login` | Obtain access and refresh tokens |
| POST | `/auth/refresh` | Rotate a refresh token |
| GET | `/auth/profile` | Current profile |
| POST | `/devices/register` | Create/update a device |
| GET | `/devices` | List the caller's devices |
| PATCH/DELETE | `/devices/:id` | Rename/update or remove a device |
| POST | `/pair/create` | Create a two-minute code for `deviceId` |
| POST | `/pair/verify` | Consume a code for the same signed-in user |
| POST | `/commands/:type` | `lock`, `unlock`, `restart`, `shutdown`, `sleep`, or `screenshot`; body includes `deviceId` |
| GET | `/commands/history` | Most recent 100 commands |

## Socket.IO protocol

The Windows app calls `POST /pair/desktop/session` when it first starts and displays the resulting pair code. A signed-in Android user consumes that code with `POST /pair/verify`; this securely attaches the desktop to their account. The desktop connects with `auth: { agentToken }`; controller clients connect with `auth: { token: accessToken }`. A device emits `device:identify` then a heartbeat every 30 seconds. The server emits `command:receive`, and the device responds with `command:acknowledge`. Controllers receive `device:online`, `device:offline`, and `command:status` events.

Commands are only relayed to an online device registered to the authenticated user; this service never executes OS commands itself. The Windows agent must implement its own platform-specific, user-authorized command handling.

## Firestore security and indexes

Deploy `firestore.rules` to deny direct client access; all Firestore access is through this server's Admin SDK. Create a composite Firestore index for the `commands` collection: `userId` ascending, `createdAt` descending. Keep Firebase service-account credentials and `.env` out of version control and restrict `CLIENT_ORIGINS` to trusted app origins in production.
