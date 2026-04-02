# Job Board API

A RESTful API for a job board platform built with Node.js and Express. Supports user authentication with JWT, job listing management, Redis caching, and input validation.

## Features

- JWT authentication with access & refresh tokens
- Role-based users: `employer` and `candidate`
- Full CRUD for job listings (soft delete via `is_active` flag)
- Redis caching on job listings (60-second TTL, auto-invalidated on write)
- Request validation with Joi
- Rate limiting: 100 req/15min globally, 10 req/15min on auth endpoints
- Swagger UI API documentation
- Docker & docker-compose support
- Integration tests with Jest + Supertest

## Tech Stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Runtime      | Node.js 18                     |
| Framework    | Express 4                      |
| Database     | PostgreSQL 16 + Sequelize ORM  |
| Cache        | Redis + ioredis                |
| Auth         | JSON Web Tokens (jsonwebtoken) |
| Validation   | Joi                            |
| Rate Limiting| express-rate-limit             |
| Docs         | Swagger UI (swagger-jsdoc)     |
| Testing      | Jest + Supertest               |
| Container    | Docker + docker-compose        |

## Project Structure

```
src/
├── config/
│   ├── database.js       # Sequelize connection
│   └── redis.js          # ioredis client
├── controllers/
│   ├── authController.js # register & login
│   └── jobController.js  # CRUD job operations
├── middleware/
│   ├── authenticate.js   # JWT verification
│   ├── cache.js          # Redis cache middleware
│   ├── errorHandler.js   # Global error handler
│   ├── rateLimiter.js    # Global & auth rate limiters
│   └── validate.js       # Joi validation middleware
├── models/
│   ├── index.js
│   ├── User.js
│   └── Job.js
├── routes/
│   ├── index.js
│   ├── authRoutes.js
│   └── jobRoutes.js
├── tests/
│   ├── auth.test.js
│   └── jobs.test.js
├── validators/
│   ├── authValidator.js
│   └── jobValidator.js
├── app.js
└── server.js
```

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

Or just Docker — see [Running with Docker](#running-with-docker).

## Environment Variables

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
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (with nodemon)
npm run dev

# Start production server
npm start
```

The API will be available at `http://localhost:3000`.

## Running with Docker

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

**Response**
```json
{ "status": "ok" }
```

---

### Authentication

All auth endpoints are rate-limited to **10 requests per 15 minutes**.

#### Register

```
POST /api/v1/auth/register
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "role": "employer"
}
```

| Field      | Type   | Required | Notes                              |
|------------|--------|----------|------------------------------------|
| `email`    | string | yes      | Valid email format                 |
| `password` | string | yes      | Minimum 6 characters               |
| `role`     | string | no       | `employer` or `candidate` (default: `candidate`) |

**Response** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "role": "employer" },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

#### Login

```
POST /api/v1/auth/login
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "role": "employer" },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

---

### Jobs

All job endpoints require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

#### List Jobs

```
GET /api/v1/jobs
```

Returns all active jobs ordered by newest first. Response is **cached in Redis for 60 seconds**.

**Response** `200 OK`
```json
{
  "success": true,
  "data": [ { "id": "uuid", "title": "...", "company": "...", ... } ]
}
```

#### Get Job by ID

```
GET /api/v1/jobs/:id
```

**Response** `200 OK`
```json
{
  "success": true,
  "data": { "id": "uuid", "title": "...", "company": "...", ... }
}
```

#### Create Job

```
POST /api/v1/jobs
```

**Request Body**
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

| Field         | Type    | Required | Notes                                |
|---------------|---------|----------|--------------------------------------|
| `title`       | string  | yes      | 3–100 characters                     |
| `description` | string  | yes      | 10–1000 characters                   |
| `company`     | string  | yes      | 2–100 characters                     |
| `location`    | string  | no       | Max 100 characters                   |
| `salary_min`  | integer | no       | Non-negative                         |
| `salary_max`  | integer | no       | Must be >= `salary_min`              |

**Response** `201 Created`
```json
{
  "success": true,
  "data": { "id": "uuid", "title": "Backend Developer", ... }
}
```

> Creating a job invalidates the Redis cache for the job list.

#### Update Job

```
PUT /api/v1/jobs/:id
```

Accepts the same fields as Create (all optional except `description`). Invalidates the Redis cache on success.

**Response** `200 OK`
```json
{
  "success": true,
  "data": { "id": "uuid", "title": "Updated Title", ... }
}
```

#### Delete Job

```
DELETE /api/v1/jobs/:id
```

Performs a **soft delete** by setting `is_active` to `false`. The job is no longer returned in the list but remains in the database. Invalidates the Redis cache on success.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Job removed successfully"
}
```

---

### Error Responses

| Status | Meaning                          |
|--------|----------------------------------|
| `400`  | Validation error (invalid input) |
| `401`  | Missing or invalid JWT           |
| `404`  | Resource not found               |
| `409`  | Conflict (e.g. duplicate email)  |
| `429`  | Rate limit exceeded              |

All error responses follow this shape:
```json
{ "success": false, "message": "Error description" }
```

## Rate Limiting

| Limiter | Scope              | Limit             |
|---------|--------------------|-------------------|
| Global  | All routes         | 100 req / 15 min  |
| Auth    | `/api/v1/auth/*`   | 10 req / 15 min   |

## Caching

`GET /api/v1/jobs` responses are cached in Redis with a **60-second TTL**. The cache is automatically invalidated whenever a job is created, updated, or deleted.

## Running Tests

Tests use a separate database configured via `.env.test`.

```bash
npm test
```

Test suites:
- `auth.test.js` — register & login flows (success, validation errors, duplicate email)
- `jobs.test.js` — job CRUD flows (authentication guard, create, validation errors)

> The test database is synced with `{ force: true }` before each suite, so it starts clean every run.

## API Documentation

Swagger UI is available at:

```
http://localhost:3000/api-docs
```
