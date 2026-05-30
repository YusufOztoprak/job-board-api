# JobHub Frontend

React + Vite frontend for the JobHub job board API.

## Prerequisites

- Node.js >= 18

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `VITE_API_BASE_URL` to your backend URL.

## Scripts

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## Production

Set the `VITE_API_BASE_URL` environment variable on Vercel to the deployed backend URL:

```
VITE_API_BASE_URL=https://job-board-api-ghrj.onrender.com/api/v1
```
