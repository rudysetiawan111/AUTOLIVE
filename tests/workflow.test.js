const request = require('supertest');
const app = require('../app');
const { MongoClient } = require('mongodb');

describe('AutoLive Complete Workflow Tests', () => {
    let server;
    let connection;
    let db;
    let authToken;
    let testStreamId;

    beforeAll(async () => {
        server = app.listen(3002);
        
        // Setup test database
        connection = await MongoClient.connect(process.env.MONGODB_TEST_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        db = await connection.db('autolive_test');
    });

    afterAll(async () => {
        await connection.close();
        server.close();
    });

    beforeEach(async () => {
        // Clear test data
        await db.collection('users').deleteMany({});
        await db.collection('streams').deleteMany({});
    });

    describe('User Registration and Authentication Flow', () => {
        test('Complete user lifecycle', async () => {
            // 1. Register new user
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'workflowuser',
                    email: 'workflow@test.com',
                    password: 'TestPass123!'
                })
                .expect(201);

            expect(registerResponse.body).toHaveProperty('userId');
            expect(registerResponse.body).toHaveProperty('message', 'User created successfully');

            // 2. Login with new user
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'workflowuser',
                    password: 'TestPass123!'
                })
                .expect(200);

            expect(loginResponse.body).toHaveProperty('token');
            expect(loginResponse.body.user).toHaveProperty('username', 'workflowuser');
            
            authToken = loginResponse.body.token;

            // 3. Get user profile
            const profileResponse = await request(app)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(profileResponse.body).toHaveProperty('username', 'workflowuser');
            expect(profileResponse.body).toHaveProperty('email', 'workflow@test.com');

            // 4. Update user profile
            const updateResponse = await request(app)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    displayName: 'Workflow User',
                    bio: 'Testing workflows'
                })
                .expect(200);

            expect(updateResponse.body).toHaveProperty('displayName', 'Workflow User');
            expect(updateResponse.body).toHaveProperty('bio', 'Testing workflows');
        });
    });

    describe('Live Stream Creation and Management Flow', () => {
        beforeEach(async () => {
            // Create user and get token for stream tests
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'streamer',
                    email: 'streamer@test.com',
                    password: 'StreamPass123!'
                });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'streamer',
                    password: 'StreamPass123!'
                });
            
            authToken = loginResponse.body.token;
        });

        test('Complete stream workflow', async () => {
            // 1. Schedule a stream
            const scheduleResponse = await request(app)
                .post('/api/live/schedule')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Integration Test Stream',
                    description: 'Testing complete workflow',
                    scheduledStart: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
                    duration: 120, // minutes
                    category: 'gaming'
                })
                .expect(201);

            expect(scheduleResponse.body).toHaveProperty('streamId');
            expect(scheduleResponse.body.status).toBe('scheduled');
            
            testStreamId = scheduleResponse.body.streamId;

            // 2. Get scheduled streams
            const scheduledResponse = await request(app)
                .get('/api/live/scheduled')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(scheduledResponse.body)).toBe(true);
            expect(scheduledResponse.body.length).toBeGreaterThan(0);
            expect(scheduledResponse.body[0]).toHaveProperty('title', 'Integration Test Stream');

            // 3. Start the stream (simulate stream start time)
            const startResponse = await request(app)
                .post(`/api/live/start/${testStreamId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(startResponse.body.status).toBe('live');
            expect(startResponse.body).toHaveProperty('streamKey');
            expect(startResponse.body).toHaveProperty('rtmpUrl');

            // 4. Get active stream details
            const activeResponse = await request(app)
                .get(`/api/live/${testStreamId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(activeResponse.body.streamId).toBe(testStreamId);
            expect(activeResponse.body.viewerCount).toBeDefined();
            expect(activeResponse.body.duration).toBeDefined();

            // 5. Update stream metadata
            const updateResponse = await request(app)
                .put(`/api/live/${testStreamId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Updated Stream Title',
                    tags: ['test', 'integration']
                })
                .expect(200);

            expect(updateResponse.body.title).toBe('Updated Stream Title');
            expect(updateResponse.body.tags).toContain('test');

            // 6. Add chat message
            const chatResponse = await request(app)
                .post(`/api/live/${testStreamId}/chat`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Hello world!',
                    timestamp: new Date().toISOString()
                })
                .expect(201);

            expect(chatResponse.body).toHaveProperty('messageId');
            expect(chatResponse.body.message).toBe('Hello world!');

            // 7. Get chat history
            const chatHistoryResponse = await request(app)
                .get(`/api/live/${testStreamId}/chat`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(chatHistoryResponse.body)).toBe(true);
            expect(chatHistoryResponse.body.length).toBeGreaterThan(0);

            // 8. End the stream
            const endResponse = await request(app)
                .post(`/api/live/end/${testStreamId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(endResponse.body.status).toBe('ended');
            expect(endResponse.body).toHaveProperty('recordingUrl');
            expect(endResponse.body).toHaveProperty('totalViewers');

            // 9. Get stream analytics
            const analyticsResponse = await request(app)
                .get(`/api/live/${testStreamId}/analytics`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(analyticsResponse.body).toHaveProperty('peakViewers');
            expect(analyticsResponse.body).toHaveProperty('averageWatchTime');
            expect(analyticsResponse.body).toHaveProperty('chatCount');
            expect(analyticsResponse.body).toHaveProperty('duration');
        });
    });

    describe('Error Recovery and Edge Cases', () => {
        test('Handle concurrent stream starts', async () => {
            // Try to start multiple streams simultaneously
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    request(app)
                        .post('/api/live/start')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({ title: `Concurrent Stream ${i}` })
                );
            }

            const responses = await Promise.all(promises);
            const successfulStarts = responses.filter(r => r.statusCode === 201);
            
            // Should only allow one active stream per user
            expect(successfulStarts.length).toBe(1);
        });

        test('Recover from stream interruption', async () => {
            // Start a stream
            const startResponse = await request(app)
                .post('/api/live/start')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Interruption Test' })
                .expect(201);

            const streamId = startResponse.body.streamId;

            // Simulate connection loss (server restart)
            server.close();
            server = app.listen(3002);

            // Reconnect and recover stream
            const recoverResponse = await request(app)
                .post(`/api/live/recover/${streamId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(recoverResponse.body.status).toBe('live');
            expect(recoverResponse.body).toHaveProperty('recovered', true);
        });
    });
});
