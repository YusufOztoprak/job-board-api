const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

let accessToken;

beforeAll(async () => {
    await sequelize.sync({ force: true });

    const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'user@example.com', password: 'password123', role: 'candidate' });

    accessToken = res.body.data.accessToken;
});

afterAll(async () => {
    await sequelize.close();
});

describe('User Endpoints', () => {
    describe('GET /api/v1/users/me', () => {
        it('should return current user profile', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe('user@example.com');
            expect(res.body.data.role).toBe('candidate');
            expect(res.body.data.password).toBeUndefined();
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/v1/users/me');
            expect(res.statusCode).toBe(401);
        });
    });

    describe('PATCH /api/v1/users/me/password', () => {
        it('should update password with correct current password', async () => {
            const res = await request(app)
                .patch('/api/v1/users/me/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 401 for incorrect current password', async () => {
            const res = await request(app)
                .patch('/api/v1/users/me/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword456' });

            expect(res.statusCode).toBe(401);
        });

        it('should return 400 for short new password', async () => {
            const res = await request(app)
                .patch('/api/v1/users/me/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ currentPassword: 'newpassword456', newPassword: '123' });

            expect(res.statusCode).toBe(400);
        });
    });
});
