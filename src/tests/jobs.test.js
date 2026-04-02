const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

let employerToken;
let candidateToken;
let createdJobId;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const employerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'employer@example.com', password: '123456', role: 'employer' });
    employerToken = employerRes.body.data.accessToken;

    const candidateRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'candidate@example.com', password: '123456', role: 'candidate' });
    candidateToken = candidateRes.body.data.accessToken;

    // Seed jobs for pagination/filter tests
    await Promise.all([
        request(app).post('/api/v1/jobs').set('Authorization', `Bearer ${employerToken}`).send({
            title: 'Frontend Developer',
            description: 'Looking for a React developer with 2+ years of experience.',
            company: 'DesignCo',
            location: 'Istanbul',
            salary_min: 2000,
            salary_max: 4000,
        }),
        request(app).post('/api/v1/jobs').set('Authorization', `Bearer ${employerToken}`).send({
            title: 'DevOps Engineer',
            description: 'Looking for a DevOps engineer with Kubernetes experience.',
            company: 'CloudCo',
            location: 'Remote',
            salary_min: 5000,
            salary_max: 8000,
        }),
    ]);
});

afterAll(async () => {
    await sequelize.close();
});

describe('Jobs Endpoints', () => {
    describe('GET /api/v1/jobs', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/v1/jobs');
            expect(res.statusCode).toBe(401);
        });

        it('should return paginated jobs list', async () => {
            const res = await request(app)
                .get('/api/v1/jobs')
                .set('Authorization', `Bearer ${employerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
            expect(res.body.pagination.page).toBe(1);
        });

        it('should respect limit param', async () => {
            const res = await request(app)
                .get('/api/v1/jobs?limit=1')
                .set('Authorization', `Bearer ${employerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.pagination.limit).toBe(1);
        });

        it('should filter by title', async () => {
            const res = await request(app)
                .get('/api/v1/jobs?title=frontend')
                .set('Authorization', `Bearer ${employerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(j => j.title.toLowerCase().includes('frontend'))).toBe(true);
        });

        it('should filter by location', async () => {
            const res = await request(app)
                .get('/api/v1/jobs?location=remote')
                .set('Authorization', `Bearer ${employerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(j => j.location.toLowerCase().includes('remote'))).toBe(true);
        });

        it('should filter by salary_min', async () => {
            const res = await request(app)
                .get('/api/v1/jobs?salary_min=5000')
                .set('Authorization', `Bearer ${employerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(j => j.salary_min >= 5000)).toBe(true);
        });
    });

    describe('POST /api/v1/jobs', () => {
        it('should create a job as employer', async () => {
            const res = await request(app)
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${employerToken}`)
                .send({
                    title: 'Backend Developer',
                    description: 'Looking for a Node.js developer with experience.',
                    company: 'TechCo',
                    location: 'Remote',
                    salary_min: 3000,
                    salary_max: 5000,
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.data.title).toBe('Backend Developer');
            expect(res.body.data.company).toBe('TechCo');
            expect(res.body.data.userId).toBeDefined();
            createdJobId = res.body.data.id;
        });

        it('should return 403 for candidate role', async () => {
            const res = await request(app)
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({
                    title: 'Backend Developer',
                    description: 'Looking for a Node.js developer with experience.',
                    company: 'TechCo',
                });

            expect(res.statusCode).toBe(403);
        });

        it('should return 400 for missing required fields', async () => {
            const res = await request(app)
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${employerToken}`)
                .send({ title: 'Incomplete Job' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('PUT /api/v1/jobs/:id', () => {
        it('should update own job as employer', async () => {
            const res = await request(app)
                .put(`/api/v1/jobs/${createdJobId}`)
                .set('Authorization', `Bearer ${employerToken}`)
                .send({ description: 'Updated job description for the role.' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.description).toBe('Updated job description for the role.');
        });

        it('should return 403 for candidate trying to update', async () => {
            const res = await request(app)
                .put(`/api/v1/jobs/${createdJobId}`)
                .set('Authorization', `Bearer ${candidateToken}`)
                .send({ description: 'Unauthorized update attempt.' });

            expect(res.statusCode).toBe(403);
        });
    });

    describe('DELETE /api/v1/jobs/:id', () => {
        it('should return 403 for candidate trying to delete', async () => {
            const res = await request(app)
                .delete(`/api/v1/jobs/${createdJobId}`)
                .set('Authorization', `Bearer ${candidateToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should soft-delete own job as employer', async () => {
            const res = await request(app)
                .delete(`/api/v1/jobs/${createdJobId}`)
                .set('Authorization', `Bearer ${employerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Job removed successfully');
        });
    });
});
