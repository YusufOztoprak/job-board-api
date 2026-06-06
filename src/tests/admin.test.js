const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

let employerAToken;
let employerBToken;
let candidateToken;
let jobActiveId;
let jobInactiveId;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const empARes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'employer-a@admintest.com', password: '123456', role: 'employer' });
    employerAToken = empARes.body.data.accessToken;

    const empBRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'employer-b@admintest.com', password: '123456', role: 'employer' });
    employerBToken = empBRes.body.data.accessToken;

    const candRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'candidate@admintest.com', password: '123456', role: 'candidate' });
    candidateToken = candRes.body.data.accessToken;

    const job1Res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${employerAToken}`)
        .send({
            title: 'Active Job',
            description: 'This is the active job description with enough characters.',
            company: 'CompanyA',
        });
    jobActiveId = job1Res.body.data.id;

    const job2Res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${employerAToken}`)
        .send({
            title: 'Inactive Job',
            description: 'This is the inactive job description with enough characters.',
            company: 'CompanyA',
        });
    jobInactiveId = job2Res.body.data.id;

    await request(app)
        .delete(`/api/v1/jobs/${jobInactiveId}`)
        .set('Authorization', `Bearer ${employerAToken}`);

    await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
            jobId: jobActiveId,
            cover_letter: 'I am very interested in this position and have all the required skills.',
        });
});

afterAll(async () => {
    await sequelize.close();
});

describe('Admin Endpoints', () => {
    describe('Authentication guard', () => {
        it('GET /admin/stats without token → 401', async () => {
            const res = await request(app).get('/api/v1/admin/stats');
            expect(res.statusCode).toBe(401);
        });

        it('GET /admin/jobs without token → 401', async () => {
            const res = await request(app).get('/api/v1/admin/jobs');
            expect(res.statusCode).toBe(401);
        });

        it('GET /admin/applications without token → 401', async () => {
            const res = await request(app).get('/api/v1/admin/applications');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('Role guard (candidate)', () => {
        it('GET /admin/stats as candidate → 403', async () => {
            const res = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${candidateToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('GET /admin/jobs as candidate → 403', async () => {
            const res = await request(app)
                .get('/api/v1/admin/jobs')
                .set('Authorization', `Bearer ${candidateToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('GET /admin/applications as candidate → 403', async () => {
            const res = await request(app)
                .get('/api/v1/admin/applications')
                .set('Authorization', `Bearer ${candidateToken}`);
            expect(res.statusCode).toBe(403);
        });
    });

    describe('GET /api/v1/admin/stats', () => {
        it('returns correct stats for employer A', async () => {
            const res = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${employerAToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.jobs.active).toBe(1);
            expect(res.body.data.jobs.inactive).toBe(1);
            expect(res.body.data.jobs.total).toBe(2);
            expect(res.body.data.applications.total).toBe(1);
            expect(res.body.data.applications.byStatus.pending).toBe(1);
            expect(res.body.data.applications.byStatus.reviewed).toBe(0);
            expect(res.body.data.applications.byStatus.accepted).toBe(0);
            expect(res.body.data.applications.byStatus.rejected).toBe(0);
        });
    });

    describe('GET /api/v1/admin/jobs', () => {
        it('returns all employer A jobs including soft-deleted', async () => {
            const res = await request(app)
                .get('/api/v1/admin/jobs')
                .set('Authorization', `Bearer ${employerAToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
            expect(res.body.pagination.total).toBe(2);
        });
    });

    describe('GET /api/v1/admin/applications', () => {
        it('returns 1 application with nested job and candidate (no password)', async () => {
            const res = await request(app)
                .get('/api/v1/admin/applications')
                .set('Authorization', `Bearer ${employerAToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.pagination.total).toBe(1);

            const application = res.body.data[0];
            expect(application.job).toBeDefined();
            expect(application.candidate).toBeDefined();
            expect(application.candidate.email).toBeDefined();
            expect(application.candidate.password).toBeUndefined();
        });

        it('?jobId=<inactive-job-id> returns 0 rows (filter respected)', async () => {
            const res = await request(app)
                .get(`/api/v1/admin/applications?jobId=${jobInactiveId}`)
                .set('Authorization', `Bearer ${employerAToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(0);
        });
    });

    describe('Cross-employer isolation', () => {
        it('employer B sees no jobs', async () => {
            const res = await request(app)
                .get('/api/v1/admin/jobs')
                .set('Authorization', `Bearer ${employerBToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(0);
        });

        it('employer B sees no applications', async () => {
            const res = await request(app)
                .get('/api/v1/admin/applications')
                .set('Authorization', `Bearer ${employerBToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(0);
        });

        it('employer B stats show all zeros', async () => {
            const res = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${employerBToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.jobs.total).toBe(0);
            expect(res.body.data.applications.total).toBe(0);
        });
    });
});
