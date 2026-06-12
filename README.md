# JobHub — Job Board Platform

![Node.js](https://img.shields.io/badge/Node.js-18-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-Cache-red)
![Tests](https://img.shields.io/badge/Tests-54%20passing-brightgreen)
![Deployed](https://img.shields.io/badge/API-Render-46E3B7)

## Live demo

| Service | URL |
|-------|--|
| Frontend | https://jobhub-frontend-beta.vercel.app |
| Backend API | https://job-board-api-ghrj.onrender.com |
| Swagger docs | https://job-board-api-ghrj.onrender.com/api-docs |
| Video |https://www.youtube.com/watch?v=MViEzKxPxOQ|


## About

Full-stack job board with a React frontend and an Express REST API. Employers post and manage listings; candidates browse, search, and apply. Features JWT auth, role-based access, Redis caching, and an employer admin dashboard.

## Monorepo structure

```
job-board-api/
├── src/                  # Express backend
├── frontend/             # React + Vite frontend
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/    # CI/CD
```

## Frontend

See [`frontend/README.md`](frontend/README.md) for setup, scripts, and deployment instructions.

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/ci.yml` | Push / PR to `main` | Runs backend Jest integration tests (Postgres + Redis) |
| `.github/workflows/frontend.yml` | Push / PR to `main` touching `frontend/**` | Lint, build, and Vitest component tests |

Production deployments are handled automatically:
- **Backend** — Render redeploys on push to `main` via the connected GitHub repo
- **Frontend** — Vercel redeploys on push to `main` (root directory: `frontend`)

---

## Backend

Express 4 REST API with PostgreSQL (Sequelize ORM) and Redis caching.

### Tech stack

| Layer         | Technology                     |
|---------------|--------------------------------|
| Runtime       | Node.js 18                     |
| Framework     | Express 4                      |
| Database      | PostgreSQL 16 + Sequelize ORM  |
| Cache         | Redis + ioredis                |
| Auth          | JSON Web Tokens (jsonwebtoken) |
| Validation    | Joi                            |
| Rate Limiting | express-rate-limit             |
| Docs          | Swagger UI (swagger-jsdoc)     |
| Testing       | Jest + Supertest               |
| Container     | Docker + docker-compose        |

### Features

- JWT authentication with access & refresh tokens
- Role-based access: `employer` and `candidate`
- Full CRUD for job listings (soft delete via `is_active` flag)
- Public job browsing — `GET /jobs` and `GET /jobs/:id` require no token
- Pagination and filtering on job listings (title, company, location, salary range)
- Redis caching on job listings (60-second TTL, auto-invalidated on write)
- Role + ownership enforcement (only employers can post, only the owner can edit/delete)
- Job applications — candidates apply, employers review and update status
- Employer admin endpoints: stats, job management, application review
- User profile endpoint with password update
- Request validation with Joi
- Rate limiting: 100 req/15min globally, 10 req/15min on auth endpoints
- Swagger UI API documentation at `/api-docs`
- Docker & docker-compose support
- Integration tests with Jest + Supertest (54 tests)

### Project structure

```
src/
├── config/
│   ├── database.js       # Sequelize connection
│   ├── redis.js          # ioredis client
│   └── swagger.js        # Swagger spec
├── controllers/
│   ├── adminController.js        # employer admin stats / jobs / applications
│   ├── authController.js         # register, login, refresh
│   ├── applicationController.js  # apply, list, status update, withdraw
│   ├── jobController.js          # CRUD + pagination + filtering
│   └── userController.js         # profile, password update
├── middleware/
│   ├── authenticate.js   # JWT verification
│   ├── authorize.js      # role & ownership checks
│   ├── cache.js          # Redis cache middleware
│   ├── errorHandler.js   # Global error handler
│   ├── rateLimiter.js    # Global & auth rate limiters
│   └── validate.js       # Joi validation middleware
├── models/
│   ├── index.js
│   ├── Application.js
│   ├── User.js
│   └── Job.js
├── routes/
│   ├── index.js
│   ├── adminRoutes.js
│   ├── applicationRoutes.js
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   └── userRoutes.js
├── tests/
│   ├── admin.test.js
│   ├── applications.test.js
│   ├── auth.test.js
│   ├── jobs.test.js
│   └── users.test.js
├── validators/
│   ├── applicationValidator.js
│   ├── authValidator.js
│   ├── jobValidator.js
│   └── userValidator.js
├── app.js
└── server.js
```

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

Or just Docker — see [Running with Docker](#running-with-docker).

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobboard_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

See `.env.example` for a full template.

### Running Locally

```bash
# Install dependencies
npm install

# Start development server (with nodemon)
npm run dev

# Start production server
npm start
```

The API will be available at `http://localhost:3000`.

### Running with Docker

```bash
docker-compose up --build
```

This starts three containers:
- `app` — Node.js API on port `3000`
- `postgres` — PostgreSQL on port `5433`
- `redis` — Redis on port `6380`

> The app container waits for PostgreSQL to be healthy before starting.

## API Endpoints

### Health Check

```
GET /health
```

---

### Authentication

All auth endpoints are rate-limited to **10 requests per 15 minutes**.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login and receive tokens |
| `POST` | `/api/v1/auth/refresh` | Get a new access token via refresh token |

#### Register

```
POST /api/v1/auth/register
```

```json
{
  "email": "employer@example.com",
  "password": "secret123",
  "role": "employer"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | yes | Valid email |
| `password` | string | yes | Min 6 characters |
| `role` | string | no | `employer` or `candidate` (default: `candidate`) |

#### Login

```
POST /api/v1/auth/login
```

```json
{ "email": "employer@example.com", "password": "secret123" }
```

#### Refresh Token

```
POST /api/v1/auth/refresh
```

```json
{ "refreshToken": "<your-refresh-token>" }
```

**All token responses follow this shape:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "role": "employer" },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

---

### Users

All user endpoints require a valid JWT: `Authorization: Bearer <accessToken>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/me` | Get current user profile |
| `PATCH` | `/api/v1/users/me/password` | Update password |

#### Update Password

```
PATCH /api/v1/users/me/password
```

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

---

### Jobs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/jobs` | — | List active jobs (paginated + filterable) |
| `GET` | `/api/v1/jobs/:id` | — | Get a single job |
| `GET` | `/api/v1/jobs/:jobId/applications` | employer + owner | List applications for a job |
| `POST` | `/api/v1/jobs` | employer | Create a job listing |
| `PUT` | `/api/v1/jobs/:id` | employer + owner | Update a job listing |
| `DELETE` | `/api/v1/jobs/:id` | employer + owner | Soft-delete a job listing |

#### List Jobs — Query Parameters

```
GET /api/v1/jobs?page=1&limit=10&title=developer&company=techco&location=remote&salary_min=3000&salary_max=8000
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Results per page (max 100) |
| `title` | string | — | Case-insensitive partial match |
| `company` | string | — | Case-insensitive partial match |
| `location` | string | — | Case-insensitive partial match |
| `salary_min` | integer | — | Jobs where `salary_min >= value` |
| `salary_max` | integer | — | Jobs where `salary_max <= value` |
| `sort` | string | `createdAt` | Sort field: `createdAt`, `salary_min`, or `salary_max` |
| `order` | string | `desc` | Sort direction: `asc` or `desc` |

**Response:**
```json
{
  "success": true,
  "data": [ { "id": "uuid", "title": "...", "company": "..."} ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Create Job

```
POST /api/v1/jobs
```

```json
{
  "title": "Backend Developer",
  "description": "Looking for a Node.js developer with 3+ years of experience.",
  "company": "TechCo",
  "location": "Remote",
  "salary_min": 3000,
  "salary_max": 5000
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | 3–100 characters |
| `description` | string | yes | 10–1000 characters |
| `company` | string | yes | 2–100 characters |
| `location` | string | no | Max 100 characters |
| `salary_min` | integer | no | Non-negative |
| `salary_max` | integer | no | Must be >= `salary_min` |

#### Delete Job

`DELETE /api/v1/jobs/:id` performs a **soft delete** — sets `is_active` to `false`. The job is excluded from listings but remains in the database.

---

### Applications

Candidates apply to jobs; employers manage application status. Requires `Authorization: Bearer <accessToken>` on all endpoints.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/applications` | candidate | Submit an application |
| `GET` | `/api/v1/applications/me` | candidate | List my applications (paginated) |
| `PATCH` | `/api/v1/applications/:id/status` | employer + job owner | Update application status |
| `DELETE` | `/api/v1/applications/:id` | candidate + owner | Withdraw an application |

#### Submit an Application

```
POST /api/v1/applications
```

```json
{
  "jobId": "uuid-of-the-job",
  "cover_letter": "I am excited about this opportunity because..."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `jobId` | UUID | yes | Must be an active job |
| `cover_letter` | string | yes | 10–2000 characters |

**Rules:**
- Only `candidate` role can apply.
- The job must exist and be active (`is_active: true`).
- A candidate may not apply to the same job twice (returns `409`).

#### List My Applications

```
GET /api/v1/applications/me?page=1&limit=10
```

Returns paginated applications with the associated job object embedded in each row.

#### Update Application Status

```
PATCH /api/v1/applications/:id/status
```

```json
{ "status": "reviewed" }
```

| Value | Description |
|-------|-------------|
| `pending` | Initial state |
| `reviewed` | Employer has reviewed |
| `accepted` | Offer extended |
| `rejected` | Not moving forward |

Only the employer who owns the job the application is for can change its status.

#### Withdraw an Application

```
DELETE /api/v1/applications/:id
```

Hard-deletes the application record. The candidate may re-apply to the same job afterwards.

---

### Admin

Employer-only endpoints for managing jobs and reviewing applications. All require `Authorization: Bearer <accessToken>` and the `employer` role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/stats` | Aggregate stats for the employer's jobs and applications |
| `GET` | `/api/v1/admin/jobs` | List all employer's jobs, including soft-deleted ones (paginated) |
| `GET` | `/api/v1/admin/applications` | List all applications across employer's jobs (paginated, filterable by `jobId`) |

#### GET /api/v1/admin/stats

Returns counts scoped to the requesting employer's data only.

```json
{
  "success": true,
  "data": {
    "jobs": { "active": 4, "inactive": 1, "total": 5 },
    "applications": {
      "total": 12,
      "byStatus": { "pending": 5, "reviewed": 3, "accepted": 2, "rejected": 2 }
    }
  }
}
```

#### GET /api/v1/admin/jobs

Lists all jobs owned by the employer (including `is_active: false`). Supports `page` and `limit` query params. Response shape is identical to `GET /jobs`.

#### GET /api/v1/admin/applications

Lists all applications for any of the employer's jobs. Supports `page`, `limit`, and optional `jobId` filter. Each application includes nested `job` and `candidate` objects (`candidate` exposes only `id` and `email`).

---

### Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Validation error |
| `401` | Missing/invalid JWT or wrong password |
| `403` | Forbidden (wrong role or not the owner) |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `429` | Rate limit exceeded |

All errors follow this shape:
```json
{ "success": false, "message": "Error description" }
```

## Rate Limiting

| Limiter | Scope | Limit |
|---------|-------|-------|
| Global | All routes | 100 req / 15 min |
| Auth | `/api/v1/auth/*` | 10 req / 15 min |

## Caching

Job listing responses are cached in Redis with a **60-second TTL per unique URL** (including query params). The cache is automatically invalidated across all cached job queries whenever a job is created, updated, or deleted.

## Running Tests

Tests use a separate database configured via `.env.test`.

```bash
npm test
```

| Test file | Coverage |
|-----------|----------|
| `auth.test.js` | Register, login (success, validation errors, duplicates) |
| `jobs.test.js` | CRUD, role enforcement, ownership, pagination, filtering, public access |
| `users.test.js` | Profile retrieval, password update |
| `applications.test.js` | Apply, duplicate prevention, role checks, list, status update, withdraw |
| `admin.test.js` | Stats, admin job list, admin applications, cross-employer isolation |

> The test database is re-created with `{ force: true }` before each suite.

## API Documentation

Swagger UI is available at:

**Local:** `http://localhost:3000/api-docs`

**Production:** https://job-board-api-ghrj.onrender.com/api-docs
