# JobHub Frontend

React + Vite frontend for the JobHub job board platform. Connects to the [JobHub API](../README.md) for all data.

## Prerequisites

- Node.js >= 18

## Local setup

```bash
npm install
```

Create a `.env` file (git-ignored) with:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Scripts

```bash
npm run dev        # dev server at http://localhost:5173 (hot reload)
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run lint       # ESLint
npm test           # Vitest unit/component tests (single run)
npm run test:watch # Vitest in watch mode
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Full base URL of the backend API, no trailing slash |

Vite inlines env variables at build time. Variables prefixed `VITE_` are
embedded in the compiled bundle — do not store secrets here.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Routing | React Router v7 |
| HTTP client | Axios |
| Styling | Tailwind CSS v3 |
| Build | Vite 5 |
| Tests | Vitest + React Testing Library |

## Testing

```bash
npm test
```

Tests live in `src/__tests__/`. They use Vitest with jsdom and React Testing
Library. No backend or browser needed — everything runs in Node.

## Deployment (Vercel)

1. Import the GitHub repo in the Vercel dashboard.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build` (auto-detected).
4. Output directory: `dist` (auto-detected).
5. Add environment variable `VITE_API_BASE_URL` pointing to the live API.

`vercel.json` configures the SPA rewrite rule so client-side routes like
`/admin/jobs` don't 404 on page refresh.

Vercel re-deploys automatically on every push to `main` that touches the
`frontend/` directory.
