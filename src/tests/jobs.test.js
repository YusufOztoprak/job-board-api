const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

let accessToken;

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err.message);
});

beforeAll(async () => {
    try {
        await sequelize.sync({ force: true });
        console.log('DB synced successfully');
    } catch (err) {
        console.error('DB sync failed:', err.message);
        throw err;
    }

    try {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'employer@example.com', password: '123456', role: 'employer' });
        console.log('Register response:', res.statusCode, JSON.stringify(res.body));
        accessToken = res.body.data.accessToken;
    } catch (err) {
        console.error('Register failed:', err.message);
    }
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

        it('should return jobs list with valid token', async () => {
            const res = await request(app)
                .get('/api/v1/jobs')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('POST /api/v1/jobs', () => {
        it('should create a job with valid token', async () => {
            const res = await request(app)
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Backend Developer',
                    description: 'Looking for Node.js developer with experience',
                    company: 'TechCo',
                    location: 'Remote',
                    salary_min: 3000,
                    salary_max: 5000,
                });

            console.log('POST /jobs response:', res.statusCode, JSON.stringify(res.body));  // ekle

            expect(res.statusCode).toBe(201);
            expect(res.body.data.title).toBe('Backend Developer');
            expect(res.body.data.userId).toBeDefined();
        });

        it('should return 400 for missing required fields', async () => {
            const res = await request(app)
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ title: 'Incomplete Job' });

            expect(res.statusCode).toBe(400);
        });
    });
});