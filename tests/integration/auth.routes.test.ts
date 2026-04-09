import request from 'supertest';
import app from '../../src/app';
import { UserModel } from '../../src/models/user.model';
import { WalletModel } from '../../src/models/wallet.model';
import * as AuthService from '../../src/services/auth.service';

jest.mock('../../src/services/auth.service');

describe('Auth Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /auth/register', () => {
    const validPayload = { name: 'Ada Obi', email: 'ada@test.com', phone: '08012345678', password: 'password123' };
    const mockResult = {
      user: { id: 'user-uuid', ...validPayload },
      token: 'faux-token-user-uuid',
    };

    it('creates an account and returns a token', async () => {
      (AuthService.registerUser as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).post('/auth/register').send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toMatch(/^faux-token-/);
      expect(res.body.data.user.email).toBe(validPayload.email);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'ada@test.com', phone: '08012345678', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ ...validPayload, password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/password/i);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Ada', email: 'not-an-email', phone: '08012345678', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when phone is missing', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Ada', email: 'ada@test.com', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('returns 409 when email is already registered', async () => {
      (AuthService.registerUser as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Email already registered'), { statusCode: 409 })
      );

      const res = await request(app).post('/auth/register').send(validPayload);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already registered');
    });

    it('returns 403 when user is on the Karma blacklist', async () => {
      (AuthService.registerUser as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Account creation denied'), { statusCode: 403 })
      );

      const res = await request(app).post('/auth/register').send(validPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 500 when the Karma service is unavailable', async () => {
      (AuthService.registerUser as jest.Mock).mockRejectedValue(
        new Error('Karma service unavailable')
      );

      const res = await request(app).post('/auth/register').send(validPayload);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /auth/login', () => {
    const validPayload = { email: 'ada@test.com', password: 'password123' };
    const mockResult = {
      user: { id: 'user-uuid', name: 'Ada Obi', email: 'ada@test.com', phone: '08012345678' },
      token: 'faux-token-user-uuid',
    };

    it('logs in and returns a token', async () => {
      (AuthService.loginUser as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).post('/auth/login').send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toMatch(/^faux-token-/);
      expect(res.body.data.user.email).toBe(validPayload.email);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'ada@test.com' });
      expect(res.status).toBe(400);
    });

    it('returns 401 for invalid credentials', async () => {
      (AuthService.loginUser as jest.Mock).mockRejectedValue(Object.assign(new Error('Invalid credentials'), { statusCode: 401 }));

      const res = await request(app).post('/auth/login').send(validPayload);
      expect(res.status).toBe(401);
    });
  });
});
