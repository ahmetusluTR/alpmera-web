import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../routes';

describe('API Integration Tests', () => {
    let app: express.Express;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        const httpServer = createServer(app);
        await registerRoutes(httpServer, app);
    });

    it('GET /health - returns system status', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('ok', true);
        // APP_ENV might be 'dev' or 'development' in local setups
        expect(['dev', 'development']).toContain(res.body.env);
        expect(res.body).toHaveProperty('uptimeSeconds');
    });

    it('GET /api/campaigns - returns list of campaigns', async () => {
        const res = await request(app).get('/api/campaigns');

        // If 500, log the body to surface the error during test failures
        if (res.status === 500) {
            console.error('API Error Response:', res.body);
        }

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
