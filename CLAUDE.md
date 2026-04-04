# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # development server with nodemon (auto-restart)
npm start         # production server
npm test          # run all Jest integration tests (requires Postgres + Redis)
```

To run a single test file:
```bash
cross-env NODE_ENV=test npx jest src/tests/jobs.test.js --forceExit
```

## Architecture

Express 4 REST API with PostgreSQL (Sequelize ORM) and Redis caching. Entry point is `src/server.js` which starts the HTTP server immediately (for Railway health checks), then connects to the DB with retry logic. `src/app.js` wires together middleware and routes.

**Request lifecycle for a protected route:**
1. `globalLimiter` (rate limit) → `authenticate` (JWT verify, attaches `req.user`) → `requireRole` (checks `req.user.role`) → `requireOwnership` (fetches Job from DB, attaches `req.job`) → `validate` (Joi schema) → controller → `errorHandler`

**Data model:**
- `User`: UUID pk, email (unique), bcrypt-hashed password, role ENUM(`employer`|`candidate`)
- `Job`: UUID pk, title/description/company/location/salary_min/salary_max, `is_active` bool (soft delete), `userId` FK
- Association: `User.hasMany(Job)` / `Job.belongsTo(User)` — defined in `src/models/index.js`

**Cache pattern:** `GET /api/v1/jobs*` responses are cached in Redis with a 60s TTL keyed by full URL including query params. Any write operation (create/update/delete) calls `clearJobsCache()` which deletes all keys matching `cache:/api/v1/jobs*`. Cache failures are silently swallowed so the app degrades gracefully.

**Swagger docs** are generated from JSDoc comments in route files and served at `/api-docs`.

## Testing

Tests are integration tests (hit real DB and Redis). Each test file calls `sequelize.sync({ force: true })` in `beforeAll` to reset the schema.

A `.env.test` file is required locally — copy `.env.example` and set `DB_NAME=jobboard_test` (a separate database from dev). CI uses environment variables from the workflow.

`jest.maxWorkers=1` ensures test suites run serially to avoid DB conflicts.

## Environment

- `.env` — local development
- `.env.test` — loaded automatically when `NODE_ENV=test`
- Production uses `DATABASE_URL` and `REDIS_URL` env vars (Railway injects these); individual `DB_*`/`REDIS_*` vars are used otherwise
- In non-production, `sequelize.sync({ alter: true })` runs on startup to auto-migrate schema changes
- In production, schema changes must be applied manually (no auto-sync)

## Deployment

Deployed on Railway. `Dockerfile` runs `src/server.js` on port 8080 (overridden by `PORT` env var). `docker-compose.yml` runs the full stack locally on port 3000 with Postgres on 5433 and Redis on 6380.
