# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js 22.12+ (or 20.19+) and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev -- --port 5173
```

Run these commands from the repository root, where `package.json` and
`vite.config.ts` live. Open http://localhost:5173 after Vite reports it is ready.
This is a TanStack Start app: running a plain Vite server from `src/` will not
load the application correctly.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## League API

The Leagues page reuses the original frontend’s `GET /api/leagues` contract
and displays entries where `is_fim` is true.

Production requests default to `https://www.fantasyfim.com/api`.
In development, requests use `/api` on the UI’s origin, and Vite proxies
these requests to `https://www.fantasyfim.com` (preserving `/api/leagues`). Set
`API_PROXY_TARGET` to another backend origin when needed.

For a separately hosted API, set `VITE_API_BASE_URL` to its full API base URL
(including `/api`) before building. That API must allow the UI origin via CORS.
For same-origin production hosting, set `VITE_API_BASE_URL=/api` and route
`/api/*` to the backend in your reverse
proxy; the Vite development proxy does not run in production.
