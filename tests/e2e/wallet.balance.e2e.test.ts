import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../src/app';
import db from '../../src/config/db';

const num = (v: unknown) => Number(v);

describe('Wallet balance E2E (real DB + HTTP)', () => {
  let userA: string;
  let userB: string;
  let emailA: string;
  let emailB: string;
  let walletA: string;
  let walletB: string;
  let authA: string;
  let authB: string;

  beforeAll(async () => {
    await db('transactions').del();
    await db('wallets').del();
    await db('users').del();

    const ts = Date.now();
    userA = uuidv4();
    userB = uuidv4();
    walletA = uuidv4();
    walletB = uuidv4();
    emailA = `e2e-a-${ts}@test.com`;
    emailB = `e2e-b-${ts}@test.com`;

    await db('users').insert([
      { id: userA, name: 'E2E Sender', email: emailA, phone: '08011111111' },
      { id: userB, name: 'E2E Recipient', email: emailB, phone: '08022222222' },
    ]);
    await db('wallets').insert([
      { id: walletA, user_id: userA, balance: 1000.0 },
      { id: walletB, user_id: userB, balance: 250.0 },
    ]);

    authA = `Bearer faux-token-${userA}`;
    authB = `Bearer faux-token-${userB}`;
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('GET /wallet/balance returns seeded balances', async () => {
    const a = await request(app).get('/wallet/balance').set('Authorization', authA);
    const b = await request(app).get('/wallet/balance').set('Authorization', authB);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(num(a.body.data.balance)).toBe(1000);
    expect(num(b.body.data.balance)).toBe(250);
  });

  it('POST /wallet/fund increases sender balance by funded amount', async () => {
    const res = await request(app)
      .post('/wallet/fund')
      .set('Authorization', authA)
      .send({ amount: 100 });

    expect(res.status).toBe(200);
    expect(num(res.body.data.balance)).toBe(1100);

    const check = await request(app).get('/wallet/balance').set('Authorization', authA);
    expect(num(check.body.data.balance)).toBe(1100);
  });

  it('POST /wallet/transfer debits sender and credits recipient by the same amount', async () => {
    const beforeB = num(
      (await request(app).get('/wallet/balance').set('Authorization', authB)).body.data.balance
    );
    const beforeA = num(
      (await request(app).get('/wallet/balance').set('Authorization', authA)).body.data.balance
    );

    const transferAmount = 50;
    const res = await request(app)
      .post('/wallet/transfer')
      .set('Authorization', authA)
      .send({ recipient_email: emailB, amount: transferAmount });

    expect(res.status).toBe(200);

    const afterA = num(
      (await request(app).get('/wallet/balance').set('Authorization', authA)).body.data.balance
    );
    const afterB = num(
      (await request(app).get('/wallet/balance').set('Authorization', authB)).body.data.balance
    );

    expect(afterA).toBeCloseTo(beforeA - transferAmount, 5);
    expect(afterB).toBeCloseTo(beforeB + transferAmount, 5);
  });

  it('POST /wallet/withdraw decreases balance by withdrawn amount', async () => {
    const before = num(
      (await request(app).get('/wallet/balance').set('Authorization', authA)).body.data.balance
    );
    const withdrawAmount = 25;

    const res = await request(app)
      .post('/wallet/withdraw')
      .set('Authorization', authA)
      .send({ amount: withdrawAmount });

    expect(res.status).toBe(200);
    expect(num(res.body.data.balance)).toBeCloseTo(before - withdrawAmount, 5);

    const after = num(
      (await request(app).get('/wallet/balance').set('Authorization', authA)).body.data.balance
    );
    expect(after).toBeCloseTo(before - withdrawAmount, 5);
  });

  it('GET /wallet/transactions lists fund, transfer, and withdraw activity', async () => {
    const res = await request(app).get('/wallet/transactions').set('Authorization', authA);
    expect(res.status).toBe(200);
    const tx = res.body.data.transactions as { type: string }[];
    const types = tx.map((t) => t.type);
    expect(types).toContain('fund');
    expect(types).toContain('transfer');
    expect(types).toContain('withdraw');
  });

  it('POST /wallet/transfer returns 422 when sender has insufficient funds', async () => {
    const res = await request(app)
      .post('/wallet/transfer')
      .set('Authorization', authA)
      .send({ recipient_email: emailB, amount: 999999999 });

    expect(res.status).toBe(422);
  });
});
