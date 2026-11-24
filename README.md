# BarberPro Studio

Booking and management application for a barbershop, developed for the M13 DAM final project. The frontend uses Astro, TypeScript and Tailwind CSS; Firebase Authentication, Firestore and Cloud Functions handle the application data and booking operations.

Customers can check availability, book, reschedule or cancel appointments. Barbers manage their calendars and time blocks; managers and administrators have separate access to services, staff and reporting. Booking locks and server-side checks are part of the reservation flow.

## Running the local demo

Requirements: Node 22.23.4, npm 10+ and Java 21.

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
Copy-Item app/.env.example app/.env.local
```

In `app/.env.local`, set `PUBLIC_USE_FIREBASE_EMULATORS=1` and `PUBLIC_USE_FUNCTIONS_EMULATOR=1`. Keep the example project and localhost settings.

Start the emulators in one terminal:

```powershell
npm run emulators
```

In another terminal:

```powershell
npm run datos:local
npm run dev
```

Open http://127.0.0.1:4321. The seed command resets demo booking data; only run it against disposable local emulators.

Sample accounts, the four roles and the booking walkthrough are listed in [the setup guide](docs/ENTREGA-LEER-PRIMERO.md).

## Code and verification

The frontend lives in `app/`, backend functions in `functions/`, and Firestore access rules and indexes in the repository root.

```powershell
npm run check
npm run test:unit
npm run build
```

For emulator integration and browser tests, follow the prerequisites in the setup guide before running `npm run test:emuladores`. These tests reset the demo data.

This repository is a local demonstration, not a deployed production service. The academic release and its validation are available under [the final release](https://github.com/sergilo1906/BarberPro-M13/releases/tag/cierre-definitivo-2026-11-11). See also [architecture](docs/arquitectura.md), [verification notes](docs/cierre-definitivo/resultado-final.md) and [academic record, including Codex assistance](docs/registro-academico.md).
