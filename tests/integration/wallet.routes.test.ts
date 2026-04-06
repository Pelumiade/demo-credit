import request from 'supertest';
import app from '../../src/app';
import { UserModel } from '../../src/models/user.model';
import { WalletModel } from '../../src/models/wallet.model';
import * as WalletService from '../../src/services/wallet.service';

jest.mock('../../src/models/user.model');
jest.mock('../../src/models/wallet.model');
jest.mock('../../src/services/wallet.service');

const mockUser = { id: 'user-uuid', name: 'Ada Obi', email: 'ada@test.com', phone: '08012345678' };
const mockWallet = { id: 'wallet-uuid', user_id: 'user-uuid', balance: 1000 };
const AUTH = 'Bearer faux-token-user-uuid';

describe('Wallet Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
  });

  // ─── GET /balance ─────────────────────────────────────────────────────────

  describe('GET /wallet/balance', () => {
    it('returns balance for authenticated user', async () => {
      (WalletService.getBalance as jest.Mock).mockResolvedValue(mockWallet);

      const res = await request(app).get('/wallet/balance').set('Authorization', AUTH);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(1000);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/wallet/balance');
      expect(res.status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .get('/wallet/balance')
        .set('Authorization', 'Bearer faux-token-bad-id');
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /fund ───────────────────────────────────────────────────────────

  describe('POST /wallet/fund', () => {
    it('funds the wallet and returns the new balance', async () => {
      (WalletService.fundWallet as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 1500 });

      const res = await request(app)
        .post('/wallet/fund')
        .set('Authorization', AUTH)
        .send({ amount: 500 });

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(1500);
    });

    it('returns 400 when amount is missing', async () => {
      const res = await request(app)
        .post('/wallet/fund')
        .set('Authorization', AUTH)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when amount is not a positive number', async () => {
      const res = await request(app)
        .post('/wallet/fund')
        .set('Authorization', AUTH)
        .send({ amount: -100 });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /transfer ───────────────────────────────────────────────────────

  describe('POST /wallet/transfer', () => {
    it('transfers funds and returns 200', async () => {
      (WalletService.transferFunds as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/wallet/transfer')
        .set('Authorization', AUTH)
        .send({ recipient_email: 'tunde@test.com', amount: 200 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when recipient_email is missing', async () => {
      const res = await request(app)
        .post('/wallet/transfer')
        .set('Authorization', AUTH)
        .send({ amount: 200 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when recipient_email is not a valid email', async () => {
      const res = await request(app)
        .post('/wallet/transfer')
        .set('Authorization', AUTH)
        .send({ recipient_email: 'not-an-email', amount: 200 });

      expect(res.status).toBe(400);
    });

    it('returns 422 when service throws insufficient funds', async () => {
      (WalletService.transferFunds as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Insufficient funds'), { statusCode: 422 })
      );

      const res = await request(app)
        .post('/wallet/transfer')
        .set('Authorization', AUTH)
        .send({ recipient_email: 'tunde@test.com', amount: 99999 });

      expect(res.status).toBe(422);
    });
  });

  // ─── POST /withdraw ───────────────────────────────────────────────────────

  describe('POST /wallet/withdraw', () => {
    it('withdraws funds and returns the new balance', async () => {
      (WalletService.withdrawFunds as jest.Mock).mockResolvedValue({ ...mockWallet, balance: 700 });

      const res = await request(app)
        .post('/wallet/withdraw')
        .set('Authorization', AUTH)
        .send({ amount: 300 });

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(700);
    });

    it('returns 422 when balance is insufficient', async () => {
      (WalletService.withdrawFunds as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Insufficient funds'), { statusCode: 422 })
      );

      const res = await request(app)
        .post('/wallet/withdraw')
        .set('Authorization', AUTH)
        .send({ amount: 9999 });

      expect(res.status).toBe(422);
    });

    it('returns 400 when amount is missing', async () => {
      const res = await request(app)
        .post('/wallet/withdraw')
        .set('Authorization', AUTH)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
