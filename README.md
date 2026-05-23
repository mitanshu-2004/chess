# Chesstra

Multiplayer + single-player chess. React + Vite frontend; Firestore for real-time multiplayer; a separate Stockfish-backed FastAPI service powers bot mode.

**Live:** [chesstra.vercel.app](https://chesstra.vercel.app/)

## Features

- **Bot mode** — play against Stockfish, served from a separate FastAPI engine (configurable via `VITE_API`). On app load, the client wakes the engine with a health ping so the first move isn't blocked by a cold-start dyno.
- **Multiplayer mode** — Firestore-backed real-time games with shareable room links, ready-up flow, host/guest color swap, configurable time control, forfeit, rematch.
- **Move history, captured pieces, last-move highlight, in-check indicator, and a game-over modal** that surfaces the exact reason (checkmate, stalemate, insufficient material, threefold repetition, timeout, forfeit).

## Architecture

The multiplayer sync layer is intentionally simple but defensive.

- **`onSnapshot` + a monotonic `version` counter** for idempotent dedup. Every write bumps `version`; clients skip already-seen updates. This is not conflict resolution (Firestore's last-write-wins handles ordering) — it prevents redundant re-renders and stale-snapshot echoes during rapid bursts.
- **Server-authoritative game-over with client fallback.** If the moving client crashes before writing the end-state, the opponent's client detects it locally via `chess.js` and writes the resolution back so the game can't get stuck.
- **Presence heartbeats.** Each player writes `hostLastSeen` / `guestLastSeen` every 5 s; the opponent is shown as disconnected after a 15 s gap.
- **Throttled timer writes.** Countdown updates only every 3 s to keep Firestore document writes low.
- **Optimistic UI with rollback.** Local mutations apply immediately and revert on Firestore failure (time-control changes, color swap, ready state).
- **Debounced snapshot processing.** A 50 ms `setTimeout` coalesces rapid Firestore bursts.

## Backend

The Stockfish engine lives in a separate FastAPI repo deployed independently. Configure via the `VITE_API` env var pointing at the engine host. The client uses a `/api/health` ping on mount to warm the dyno; `/api/bestmove` returns the engine's reply.

## Stack

React 19 · Vite 7 · React Router · Firebase (Firestore) · chess.js · Axios · Lucide React. ESLint 9 flat config.

## Running locally

```bash
npm install
# add .env with VITE_API + Firebase config
npm run dev    # http://localhost:5173
npm run lint
npm run build
```

A Firebase project (Firestore enabled) and a deployed Stockfish FastAPI endpoint are required for full functionality. The single-player engine UI also works locally against a self-hosted backend.
