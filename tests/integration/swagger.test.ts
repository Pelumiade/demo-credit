import request from 'supertest';
import app from '../../src/app';

describe('Swagger / OpenAPI', () => {
  it('serves Swagger UI HTML', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });
});
