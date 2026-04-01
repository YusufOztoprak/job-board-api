const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js
const { sequelize } = require('../models'); // Import your Sequelize instance

beforeAll(async () => {
  // Sync the database before running tests
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close the database connection after tests
  await sequelize.close();
});

describe('Auth Endpoints', () => {
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com', password: '123456', role: 'employer' });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('test@example.com');
            expect(res.body.data.accessToken).toBeDefined();
        });

        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email', password: '123456' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for short password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test2@example.com', password: '123' });

            expect(res.statusCode).toBe(400);
        });

        it('should return 409 for duplicate email', async () => {
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'duplicate@example.com', password: '123456' });

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'duplicate@example.com', password: '123456' });

            expect(res.statusCode).toBe(409);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeAll(async () => {
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'login@example.com', password: '123456', role: 'employer' });
    });

        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com', password: '123456' });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
        });

        it('should return 401 for incorrect password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@example.com', password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
        });

        it('should return 401 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'nobody@example.com', password: '123456' });

            expect(res.statusCode).toBe(401);
        });
    });
});
