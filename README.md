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

## API configuration

All frontend API requests default to `https://api.fantasyfim.com`, in development
and production, without an `/api` path prefix. For example, leagues load from
`https://api.fantasyfim.com/leagues?year=2026`.

The shared URL helper is `src/api/config.ts`. Override the API origin with
`VITE_API_BASE_URL` in `.env.local` during development or in the build environment:

```sh
VITE_API_BASE_URL=https://api.fantasyfim.com
```

Restart the dev server or rebuild after changing this value. Use an origin without
an `/api` suffix. Requests go directly to that origin; no development API proxy is
needed. The API must allow the frontend origin via CORS.

API docs: https://api.fantasyfim.com/apidocs/.
Team avatars and event links continue to use The Blue Alliance.
