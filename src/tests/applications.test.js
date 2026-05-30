const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

let employerToken;
let employer2Token;
let candidateToken;
let candidate2Token;
let jobId;
let applicationId;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const employerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'employer@apptest.com', password: '123456', role: 'employer' });
    employerToken = employerRes.body.data.accessToken;

    const employer2Res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'employer2@apptest.com', password: '123456', role: 'employer' });
    employer2Token = employer2Res.body.data.accessToken;

    const candidateRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'candidate@apptest.com', password: '123456', role: 'candidate' });
    candidateToken = candidateRes.body.data.accessToken;

    const candidate2Res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'candidate2@apptest.com', password: '123456', role: 'candidate' });
    candidate2Token = candidate2Res.body.data.accessToken;

    const jobRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
            title: 'Software Engineer',
            description: 'We are looking for a software engineer with 3+ years of experience.',
            company: 'TechCorp',
            location: 'Remote',
            salary_min: 5000,
            salary_max: 10000,
        });
    jobId = jobRes.body.data.id;
});

afterAll(async () => {
    await sequelize.close();
});

describe('Applications Endpoints', () => {
    describe('POST /api/v1/applications', () => {
        it('candidate can apply → 201 with status pending', async () => {
            const res = await request(app)
                .post('/api/v1/applications')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ jobId, cover_letter: 'I am very interested in this position and have the required experience.' });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('pending');
            expect(res.body.data.jobId).toBe(jobId);
            applicationId = res.body.data.id;
        });

        it('same candidate applying to same job twice → 409', async () => {
            const res = await request(app)
                .post('/api/v1/applications')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ jobId, cover_letter: 'I am very interested in this position and have the required experience.' });

            expect(res.statusCode).toBe(409);
            expect(res.body.message).toBe('You have already applied to this job');
        });

        it('employer trying to apply → 403', async () => {
            const res = await request(app)
                .post('/api/v1/applications')
                .set('Authorization', `Bearer ${employerToken}`)
                .send({ jobId, cover_letter: 'I am very interested in this position and have the required experience.' });

            expect(res.statusCode).toBe(403);
        });

        it('non-existent jobId → 404', async () => {
            const res = await request(app)
                .post('/api/v1/applications')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ jobId: '00000000-0000-0000-0000-000000000000', cover_letter: 'I am very interested in this position and have the required experience.' });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Job not found');
        });

        it('cover_letter under 10 chars → 400', async () => {
            const res = await request(app)
                .post('/api/v1/applications')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ jobId, cover_letter: 'short' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/v1/applications/me', () => {
        it('candidate gets own applications → 200 with pagination', async () => {
            const res = await request(app)
                .get('/api/v1/applications/me')
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBeDefined();
            expect(res.body.pagination.totalPages).toBeDefined();
            expect(res.body.data[0].job).toBeDefined();
        });
    });

    describe('GET /api/v1/jobs/:jobId/applications', () => {
        it('owning employer gets job applications → 200', async () => {
            const res = await request(app)
                .get(`/api/v1/jobs/${jobId}/applications`)
                .set('Authorization', `Bearer ${employerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.pagination).toBeDefined();
            const application = res.body.data[0];
            expect(application.candidate).toBeDefined();
            expect(application.candidate.email).toBeDefined();
            expect(application.candidate.password).toBeUndefined();
        });

        it('different employer gets job applications → 403', async () => {
            const res = await request(app)
                .get(`/api/v1/jobs/${jobId}/applications`)
                .set('Authorization', `Bearer ${employer2Token}`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe('PATCH /api/v1/applications/:id/status', () => {
        it('owning employer updates status → 200', async () => {
            const res = await request(app)
                .patch(`/api/v1/applications/${applicationId}/status`)
                .set('Authorization', `Bearer ${employerToken}`)
                .send({ status: 'reviewed' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('reviewed');
        });

        it('invalid status value → 400', async () => {
            const res = await request(app)
                .patch(`/api/v1/applications/${applicationId}/status`)
                .set('Authorization', `Bearer ${employerToken}`)
                .send({ status: 'invalid_status' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('DELETE /api/v1/applications/:id', () => {
        it('different candidate trying to withdraw → 403', async () => {
            const res = await request(app)
                .delete(`/api/v1/applications/${applicationId}`)
                .set('Authorization', `Bearer ${candidate2Token}`);

            expect(res.statusCode).toBe(403);
        });

        it('owner withdraws application → 200, then gone from GET /me', async () => {
            const deleteRes = await request(app)
                .delete(`/api/v1/applications/${applicationId}`)
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(deleteRes.statusCode).toBe(200);
            expect(deleteRes.body.message).toBe('Application withdrawn');

            const listRes = await request(app)
                .get('/api/v1/applications/me')
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(listRes.statusCode).toBe(200);
            const ids = listRes.body.data.map(a => a.id);
            expect(ids).not.toContain(applicationId);
        });
    });

    describe('Public route regression (Part 1 fix)', () => {
        it('GET /jobs without token → 200', async () => {
            const res = await request(app).get('/api/v1/jobs');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /jobs/:id without token → 200', async () => {
            const res = await request(app).get(`/api/v1/jobs/${jobId}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(jobId);
        });
    });
});
