# Orbital — 3D Data Surface (Frontend)

React + Vite + Three.js (via React Three Fiber) frontend for the MERN
prototype. Pairs with the backend in the sibling workspace
(`t_f339b03a`). The expected REST + Socket.IO contract is documented in
[`CONTRACT.md`](./CONTRACT.md).

## Stack

- **React 18** + **Vite 5**
- **Three.js** + **@react-three/fiber** + **@react-three/drei** for the 3D scene
- **Zustand** for state (auth, viz data, live stream, toasts)
- **Axios** for REST, **socket.io-client** for the realtime channel
- **react-router-dom** for `/` ↔ `/login`
- Design language: Linear-inspired dark canvas, indigo-violet accent

## What's in here

```
src/
  api/
    client.js          # axios instance + JWT interceptor + REST methods
    socket.js          # Socket.IO wrapper + demo-mode fallback
  state/
    store.js           # zustand store (auth, items, connection, toasts)
  scene/
    VisualizationSurface.jsx   # <Canvas> root, mouse capture, lighting
    PrimaryMesh.jsx            # nested icosahedrons + torus ring (mouse-driven)
    DataNodes.jsx              # per-record floating nodes driven by `vector`
  components/
    TopBar.jsx         # brand mark, connection status, user, logout
    Sidebar.jsx        # grouped-by-category record list, live stats
    AuthScreen.jsx     # login / register card
    CanvasOverlay.jsx  # metric cards + toasts over the 3D canvas
  styles/
    tokens.css         # Linear-style design tokens (CSS custom properties)
    app.css            # component styles
  config.js            # env-driven config + localStorage keys
  types.js             # Visualization shape + ConnectionStatus enum
  App.jsx              # router + auth gate + session restore
  main.jsx             # React entry

index.html             # Inter + JetBrains Mono via Google Fonts
vite.config.js         # dev server on :5173
```

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The app starts at `/login`. After a successful
login it routes to `/` and connects to the live stream.

By default it points at `http://localhost:4000` for both REST and
Socket.IO. Override with `VITE_API_URL`:

```bash
VITE_API_URL=https://staging.example.com npm run dev
```

## Demo mode

If the Socket.IO server can't be reached after a few attempts the client
falls back to a local "demo mode" that emits synthetic
`visualization:update` payloads so the 3D scene stays alive during
development. A warning banner appears at the top of the canvas. This is
strictly a developer-experience fallback — production requires a real
backend.

## Build

```bash
npm run build      # outputs dist/
npm run preview    # serves the production build on :5173
```

## Acceptance criteria

The task (`t_9ea5e83e`) requires:

- [x] App loads at `/` and `/login`
- [x] 3D scene renders (nested icosahedrons + torus ring + per-record nodes)
- [x] Scene responds to mouse (rotation + scale pulse)
- [x] State layer in Zustand (auth, items, connection, toasts)
- [x] REST wired (login + register + me + visualizations)
- [x] Socket.IO live channel wired (snapshot + update events)
- [x] Live payloads feed the scene visibly (DataNodes position from `vector`,
      PrimaryMesh pulse from latest `value`)
- [x] Falls back to demo mode when backend unreachable

End-to-end integration (auth → REST → live socket → scene update with no
console errors) is the responsibility of `t_ab7762fe`, which validates both
ends against `CONTRACT.md`.