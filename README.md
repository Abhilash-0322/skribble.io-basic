# Skribble.io Clone

Multiplayer drawing and guessing game built with **React + Vite**, **Node.js + Express**, and **Socket.IO**.

## Live URL

**Vercel (recommended):** import the repo on [Vercel](https://vercel.com) — the root `vercel.json` defines **two services** (`client` + `server`) and routes `/api/*` and `/socket.io/*` to the backend. Enable **Fluid Compute** for WebSockets. Then put your URL here:

**https://your-app.vercel.app**

**Render (alternative):** use `render.yaml` for a traditional Node server + WebSockets.

## Local setup

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- Backend + WebSockets: http://localhost:3100 (see root `.env`; port **3001** is avoided because it is often already taken)

Optional env (root `.env`):

- `PORT` — game server port (default **3100** in dev)
- `VITE_DEV_API_URL` — must match `PORT` (Vite proxies `/socket.io` and `/api` here)
- `CLIENT_ORIGIN` — default `http://localhost:5173`
- `VITE_SOCKET_URL` — leave empty in dev; set only for split production deploy

## Production build

```bash
npm run build
npm start
```

The server serves the built client from `client/dist` and handles Socket.IO on the same port.

## Architecture overview

```
Browser (React)
  ├─ Canvas: normalized stroke coordinates (800×500 logical space)
  ├─ UI: lobby, word pick, chat/guesses, scoreboard
  └─ socket.io-client ──WebSocket──► Express HTTP server
                                        ├─ RoomManager / Room / Game / Player (OOP)
                                        └─ MessageHandler (event routing)
```

### Drawing sync

1. **Drawer** pointer events map to logical canvas coordinates.
2. `draw_start` creates a stroke on the server (`Game.addStroke`) and broadcasts `draw_data` (`action: add`).
3. `draw_move` appends points; server broadcasts `action: move`.
4. All clients repaint from the `strokes` array in `game_state` / incremental `draw_data` updates.
5. Undo/clear mutate server stroke list and broadcast to the room.

### Game state

- **Room**: players, settings, chat history.
- **Game**: phase (`lobby` → `word_select` → `drawing` → `round_end` → `game_over`), round index, drawer rotation, timer, hints, current word.
- Turn order: each player draws once per “round” setting; total turns = `rounds × playerCount`.
- Scoring: guessers earn points based on time left; drawer gets bonus on correct guesses.

### Word matching

Guesses are `trim()` + `toLowerCase()` + collapsed whitespace, compared to the chosen word (exact match).

### WebSocket events

See assignment spec — implemented: `create_room`, `join_room`, `start_game`, `round_start`, `word_chosen`, `draw_*`, `guess`, `chat`, `game_state`, `round_end`, `game_over`, `lobby_state`, `list_public_rooms`.

## Code walkthrough tips

- Server entry: `server/src/index.ts`
- OOP core: `server/src/Room.ts`, `Game.ts`, `Player.ts`, `MessageHandler.ts`
- Client canvas: `client/src/components/DrawingCanvas.tsx`
- Socket state: `client/src/GameContext.tsx`

## Deployment notes

### Vercel (Services: client + server)

1. Push to GitHub and **Import** on Vercel (root directory = repo root; `vercel.json` is auto-detected).
2. **Services:** `client` (Vite → `client/dist`), `server` (Express + Socket.IO → `server/dist/index.js`).
3. **Public routes:** everything → `client`; `/api/*` and `/socket.io/*` → `server` (see rewrites in `vercel.json`).
4. Optional env on **server** service: `CLIENT_ORIGIN` = `https://your-app.vercel.app` (CORS; auto-set from `VERCEL_URL` if omitted).
5. Test locally with all services: `vercel dev` (from repo root).
6. Rooms are **in-memory per server instance** — fine for demos; use Redis for production scale.

### Render / Railway

- `npm run build && npm start` — Express serves the built client and Socket.IO on one port (`render.yaml` included).

### Split frontend + backend

- Set `VITE_SOCKET_URL` to your API host if the client is not same-origin.
