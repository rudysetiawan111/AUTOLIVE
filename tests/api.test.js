const request = require('supertest');
const app = require('../app'); // Assuming your main app file

describe('AutoLive API Tests', () => {
    let server;

    beforeAll(() => {
        server = app.listen(3001);
    });

    afterAll((done) => {
        server.close(done);
    });

    describe('Health Check Endpoint', () => {
        test('GET /health - Should return 200 OK', async () => {
            const response = await request(app)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });

        test('GET /health - Should include system metrics', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('metrics');
            expect(response.body.metrics).toHaveProperty('memory');
            expect(response.body.metrics).toHaveProperty('cpu');
        });
    });

    describe('Authentication Endpoints', () => {
        test('POST /api/auth/login - Valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'testpass123'
                })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });

        test('POST /api/auth/login - Invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'wrong',
                    password: 'wrong'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });
    });

    describe('Live Stream Endpoints', () => {
        let authToken;

        beforeEach(async () => {
            // Get auth token before each test
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'testpass123'
                });
            authToken = loginResponse.body.token;
        });

        test('POST /api/live/start - Start new live stream', async () => {
            const response = await request(app)
                .post('/api/live/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Stream',
                    description: 'Testing API',
                    scheduledTime: new Date().toISOString()
                })
                .expect(201);

            expect(response.body).toHaveProperty('streamId');
            expect(response.body).toHaveProperty('streamKey');
            expect(response.body.title).toBe('Test Stream');
        });

        test('GET /api/live/active - Get active streams', async () => {
            const response = await request(app)
                .get('/api/live/active')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('404 - Non-existent endpoint', async () => {
            const response = await request(app)
                .get('/api/non-existent')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });

        test('500 - Server error handling', async () => {
            // Trigger a server error
            const response = await request(app)
                .get('/api/trigger-error')
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('timestamp');
        });
    });
});
