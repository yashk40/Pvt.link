# Firestore data model

This project uses Firestore collections rather than ORM model classes. Their shapes are owned by the controllers/services:

- `users`: profile and bcrypt password hash
- `devices`: owner, hardware metadata, online status, and last-seen time
- `pairCodes`: short-lived, one-time device pairing codes
- `commands`: command queue and execution result
- `sessions`: hashed refresh-token sessions
- `notifications` and `logs`: user notifications and audit records

All client access is denied by `firestore.rules`; the API uses Firebase Admin credentials.
