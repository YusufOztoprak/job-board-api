# Task: Job applications module + public/protected route fix

## Context

Read `CLAUDE.md` at the repo root first. It documents the project's
architecture, conventions, and hard rules. Follow them exactly.

This task adds the **applications** feature end-to-end (model, controller,
routes, validator, association, tests) AND fixes a route-protection bug where
public job endpoints currently sit behind `authenticate` even though the
project spec says they must be public.

The `applications` table already exists in the database — it was created from
`schema.sql`. You do NOT need to write migrations or `sequelize.sync` logic.
Just add the Sequelize model that matches the existing table.

## Part 1 — Fix public/protected route split

**Problem.** In `src/routes/index.js`:

```js
router.use('/jobs', authenticate, jobRoutes);
router.use('/users', authenticate, userRoutes);
```

The blanket `authenticate` on `/jobs` makes `GET /jobs` and `GET /jobs/:id`
require a token. Per the project spec these MUST be public.

**Fix.** Remove `authenticate` from the `/jobs` mount, and apply
`authenticate` per-route inside `src/routes/jobRoutes.js` so only the
mutating routes (POST, PUT, DELETE) require a token. Keep `/users` protected.

Result:

- `GET /jobs` → public
- `GET /jobs/:id` → public
- `POST /jobs` → authenticate + requireRole('employer') + validate + handler
- `PUT /jobs/:id` → authenticate + requireRole('employer') + requireOwnership + validate + handler
- `DELETE /jobs/:id` → authenticate + requireRole('employer') + requireOwnership + handler

Update the Swagger JSDoc on the public routes: remove the `security` block and
the `401` response from `GET /jobs` and `GET /jobs/:id` only. Keep them on the
protected routes.

## Part 2 — Application model

Create `src/models/Application.js` matching the existing `applications` table
exactly (see `schema.sql`):

- `id`: UUID, primary key, default `DataTypes.UUIDV4`
- `cover_letter`: TEXT, not null, validate length 10–2000
- `status`: ENUM('pending', 'reviewed', 'accepted', 'rejected'), default 'pending', not null
- `userId`: UUID, not null (foreign key to users.id — Sequelize convention, camelCase)
- `jobId`: UUID, not null (foreign key to jobs.id)
- Default Sequelize timestamps (createdAt, updatedAt) — already on by default
- `tableName: 'applications'`
- Add a model-level unique index on `['userId', 'jobId']` to mirror the
  database constraint. Use `indexes: [{ unique: true, fields: ['userId', 'jobId'] }]`.

Add the model to `src/models/index.js` and register associations:

```js
User.hasMany(Application, { foreignKey: 'userId', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'userId', as: 'candidate' });

Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });
Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
```

Export `Application` from `src/models/index.js` alongside `User` and `Job`.

## Part 3 — Validator

Create `src/validators/applicationValidator.js`:

```js
const Joi = require('joi');

const createApplicationSchema = Joi.object({
    jobId: Joi.string().uuid().required(),
    cover_letter: Joi.string().min(10).max(2000).required(),
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'accepted', 'rejected').required(),
});

module.exports = { createApplicationSchema, updateStatusSchema };
```

## Part 4 — Controller

Create `src/controllers/applicationController.js`. Export five async handlers,
all following the existing controller style (try/catch + `next(err)`,
`{ success, data }` responses, `req.user.userId` for the authenticated user).

### `apply` — POST /api/v1/applications

Candidate creates an application.

- Reject if `req.user.role !== 'candidate'` → 403 `{ success: false, message: 'Only candidates can apply' }`.
- Look up the job by `req.body.jobId`. If not found OR `is_active === false` →
  404 `{ success: false, message: 'Job not found' }`.
- Reject self-application: if `job.userId === req.user.userId` → 400
  `{ success: false, message: 'You cannot apply to your own job' }`. (Edge case
  if an employer somehow has candidate role on another account — defensive.)
- Create the application with `userId: req.user.userId`, `jobId`, `cover_letter`,
  status defaults to 'pending'.
- Catch Sequelize `UniqueConstraintError` and return 409
  `{ success: false, message: 'You have already applied to this job' }`.
- On success: 201 `{ success: true, data: application }`.

### `getMyApplications` — GET /api/v1/applications/me

Candidate lists their own applications.

- Reject if `req.user.role !== 'candidate'` → 403 `{ success: false, message: 'Forbidden' }`.
- Paginated (page, limit query params; same shape as `getAllJobs`).
- `findAndCountAll` with `where: { userId: req.user.userId }`, ordered by
  `createdAt DESC`. Include the related Job (`as: 'job'`) so the UI can show job
  title/company without an extra request.
- Response: `{ success: true, data: [...], pagination: { total, page, limit, totalPages } }`.

### `getJobApplications` — GET /api/v1/jobs/:jobId/applications

Employer lists applications submitted to a job they own.

- Look up the job by `req.params.jobId`. If not found → 404.
- Verify ownership: `job.userId === req.user.userId`. Otherwise 403
  `{ success: false, message: 'Forbidden' }`. (Role is already checked by middleware.)
- Paginated, ordered by `createdAt DESC`. Include the related User
  (`as: 'candidate'`) but project only safe fields: `attributes: ['id', 'email']`.
  Never expose the password hash.
- Response shape identical to `getMyApplications`.

### `updateStatus` — PATCH /api/v1/applications/:id/status

Employer updates the status of an application on a job they own.

- Find the application by `req.params.id`, include the Job (`as: 'job'`). If
  application not found → 404.
- Verify the application's job belongs to the requester:
  `application.job.userId === req.user.userId`. Otherwise 403.
- Update `application.status = req.body.status`, save, return updated row.
- Response: `{ success: true, data: application }`.

### `withdraw` — DELETE /api/v1/applications/:id

Candidate withdraws their own application.

- Find the application by `req.params.id`. If not found → 404.
- Verify ownership: `application.userId === req.user.userId`. Otherwise 403.
- Hard delete (`destroy()`). The unique (userId, jobId) constraint then allows
  the candidate to re-apply if they want.
- Response: `{ success: true, message: 'Application withdrawn' }`.

## Part 5 — Routes

Create `src/routes/applicationRoutes.js` with full Swagger JSDoc blocks
matching the style of `jobRoutes.js` (every route documented).

```js
router.post('/',
    authenticate, requireRole('candidate'),
    validate(createApplicationSchema), apply);

router.get('/me',
    authenticate, requireRole('candidate'),
    getMyApplications);

router.patch('/:id/status',
    authenticate, requireRole('employer'),
    validate(updateStatusSchema), updateStatus);

router.delete('/:id',
    authenticate, requireRole('candidate'),
    withdraw);
```

Then `GET /jobs/:jobId/applications` lives inside `jobRoutes.js` (because the
URL is nested under jobs), not in applicationRoutes.js. Add it there with:

```js
router.get('/:jobId/applications',
    authenticate, requireRole('employer'),
    getJobApplications);
```

Mount in `src/routes/index.js`:

```js
router.use('/applications', applicationRoutes);
```

(No blanket `authenticate` — each route declares its own, just like the fixed
jobs router.)

## Part 6 — Tests

Create `src/tests/applications.test.js` following the style of the existing
test files. The CI workflow already provisions postgres:16 and redis:7, so
tests run against a real DB. Tests must cover:

1. Candidate can POST /applications → 201, returns application with status 'pending'.
2. Same candidate posting to the same job twice → 409 (unique constraint).
3. Employer trying to POST /applications → 403.
4. POST with invalid jobId (non-existent UUID) → 404.
5. POST with cover_letter under 10 chars → 400 validation error.
6. GET /applications/me as candidate → 200, returns own applications, pagination shape correct.
7. GET /jobs/:jobId/applications as the owning employer → 200, returns applications for that job.
8. GET /jobs/:jobId/applications as a different employer → 403.
9. PATCH /applications/:id/status as the owning employer → 200, status updated.
10. PATCH with an invalid status value → 400.
11. DELETE /applications/:id as the owner → 200, then GET /applications/me no longer contains it.
12. DELETE /applications/:id as a different candidate → 403.
13. After fix: GET /jobs (no token) → 200 (regression test for Part 1).
14. After fix: GET /jobs/:id (no token) → 200 (regression test for Part 1).

Use the existing test helpers / patterns (register → login → use token).

## Acceptance criteria

- `npm test` passes locally with all tests green (existing + new).
- `GET /api/v1/jobs` works without a token.
- `GET /api/v1/jobs/:id` works without a token.
- All new endpoints behave per the spec above.
- No new dependencies added unless absolutely necessary (justify in commit message).
- Swagger UI at `/api-docs` lists all new routes with documentation.
- Commit message is a single descriptive line in English, conventional commits style
  (e.g., `feat(applications): add full applications module and fix public job routes`).

## Out of scope

- No frontend changes.
- No deployment changes (Render auto-deploys on push to main).
- No README update yet (that comes later).
- No schema changes (schema.sql already covers the applications table).