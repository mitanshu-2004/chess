# Chesstra

Multiplayer chess in the browser, plus a single-player mode against a Stockfish engine that runs in a separate FastAPI service. React + Vite for the frontend, Firestore for the multiplayer sync, `chess.js` for rule validation.

Live at https://chesstra.vercel.app.

## How the multiplayer sync actually works

Firestore is last-write-wins, which is fine for chess (moves are atomic and turn-ordered), but you still get spurious re-renders from echoed snapshots and write-bursts during fast play. Each game document carries a monotonic `version` counter; every client tracks the last version it processed and drops snapshots with a version it has already seen. State application is idempotent — the same incoming write applied twice doesn't move the game forward twice.

Same idea covers presence and the clock. Each player writes `hostLastSeen` / `guestLastSeen` every 5 seconds; the opponent is shown as disconnected if more than 15 seconds pass without an update. Timer state is throttled to one Firestore write every 3 seconds — without that, a one-minute bullet game would burn a few hundred document writes for no reason.

There's a fallback for the "moving player crashes mid-move" case too. Opponent's client runs `chess.js` locally and detects the end-state itself; if the document was never updated by the original mover, the opponent's client writes the resolution back. Without that, a disconnected player would leave the game in a half-finished state forever.

## Bot mode

`POST /api/bestmove` on a separate FastAPI service. Cold-start dynos take a few seconds to wake, so the client hits `/api/health` once on app mount — by the time the user actually plays a move against the bot, the engine is already warm. The backend URL is configurable via `VITE_API`.

## Running locally

```bash
npm install
# .env with VITE_API= (Stockfish backend URL) and Firebase config
npm run dev
```

Multiplayer needs a Firebase project with Firestore enabled. Bot mode needs the Stockfish service running somewhere reachable; the engine lives in its own repo.
