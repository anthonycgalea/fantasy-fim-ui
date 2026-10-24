# Fantasy FiM

Fantasy FIRST Robotics Competition in Michigan, built with React, TanStack Start, Vite, and Tailwind CSS.

## Development

Requires Node.js 22.12+ (or 24+).

```sh
npm ci
npm run dev
```

## Checks and production build

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

The production Node server runs with `node .output/server/index.mjs`.

## Appearance

Use the theme button in the header to switch between light and dark mode.
The first visit follows your system preference; your choice is saved in this browser.

Run development commands from the repository root. Open http://localhost:3000 after Vite reports it is ready.

## League API

The Leagues page reuses the original frontend’s `GET /api/leagues` contract
and displays entries where `is_fim` is true.

Production requests default to `https://fantasyfim.com/api`.
In development, requests use `/api` on the UI’s origin, and Vite proxies
these requests to `https://fantasyfim.com` (preserving `/api/leagues`). Set
`API_PROXY_TARGET` to another backend origin when needed.

For a separately hosted API, set `VITE_API_BASE_URL` to its full API base URL
(including `/api`) before building. That API must allow the UI origin via CORS.
For same-origin production hosting, set `VITE_API_BASE_URL=/api` and route
`/api/*` to the backend in your reverse
proxy; the Vite development proxy does not run in production.
