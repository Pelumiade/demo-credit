import * as WalletService from '../../src/services/wallet.service';
import { WalletModel } from '../../src/models/wallet.model';
import { TransactionModel } from '../../src/models/transaction.model';
import { UserModel } from '../../src/models/user.model';

jest.mock('../../src/models/wallet.model');
jest.mock('../../src/models/transaction.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/config/db', () => {
  const trx = {};
  const mockDb = jest.fn();
  (mockDb as any).transaction = jest.fn((cb: (trx: any) => Promise<any>) => cb(trx));
  (mockDb as any).fn = { now: jest.fn(() => new Date()) };
  return { __esModule: true, default: mockDb };
});

const mockWallet = { id: 'wallet-1', user_id: 'user-1', balance: 1000 };
const mockRecipientWallet = { id: 'wallet-2', user_id: 'user-2', balance: 500 };
const mockRecipient = { id: 'user-2', name: 'Tunde', email: 'tunde@test.com', phone: '0801' };

describe('WalletService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── getBalance ───────────────────────────────────────────────────────────

  describe('getBalance', () => {
    it('returns the wallet for a valid user', async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      const result = await WalletService.getBalance('user-1');
      expect(result.balance).toBe(1000);
    });

    it('throws 404 if wallet does not exist', async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(undefined);
      await expect(WalletService.getBalance('user-1')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── fundWallet ───────────────────────────────────────────────────────────

  describe('fundWallet', () => {
    it('increases the balance by the funded amount', async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({ ...mockWallet });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(undefined);

      const result = await WalletService.fundWallet('user-1', 500);
      expect(result.balance).toBe(1500);
      expect(WalletModel.updateBalance).toHaveBeenCalledWith('wallet-1', 1500, expect.anything());
    });

    it('creates a fund transaction record', async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({ ...mockWallet });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(undefined);

      await WalletService.fundWallet('user-1', 500);

      expect(TransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'fund', amount: 500 }),
        expect.anything()
      );
    });

    it('throws 400 if amount is zero', async () => {
      await expect(WalletService.fundWallet('user-1', 0)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 if amount is negative', async () => {
      await expect(WalletService.fundWallet('user-1', -100)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 404 if wallet is not found', async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue(undefined);
      await expect(WalletService.fundWallet('user-1', 500)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─── transferFunds ────────────────────────────────────────────────────────

  describe('transferFunds', () => {
    it('debits sender and credits recipient', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockRecipient);
      (WalletModel.findByUserIdForUpdate as jest.Mock)
        .mockResolvedValueOnce({ ...mockWallet })
        .mockResolvedValueOnce({ ...mockRecipientWallet });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(undefined);

      await WalletService.transferFunds('user-1', 'tunde@test.com', 200);

      expect(WalletModel.updateBalance).toHaveBeenCalledWith('wallet-1', 800, expect.anything());
      expect(WalletModel.updateBalance).toHaveBeenCalledWith('wallet-2', 700, expect.anything());
    });

    it('creates two transaction records with distinct references (unique constraint)', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockRecipient);
      (WalletModel.findByUserIdForUpdate as jest.Mock)
        .mockResolvedValueOnce({ ...mockWallet })
        .mockResolvedValueOnce({ ...mockRecipientWallet });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(undefined);

      await WalletService.transferFunds('user-1', 'tunde@test.com', 200);

      const calls = (TransactionModel.create as jest.Mock).mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0].reference).not.toBe(calls[1][0].reference);
    });

    it('throws 422 when sender has insufficient funds', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockRecipient);
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({ ...mockWallet });

      await expect(
        WalletService.transferFunds('user-1', 'tunde@test.com', 9999)
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('throws 400 when sender and recipient are the same user', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({ ...mockRecipient, id: 'user-1' });

      await expect(
        WalletService.transferFunds('user-1', 'tunde@test.com', 100)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 404 when recipient does not exist', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(undefined);

      await expect(
        WalletService.transferFunds('user-1', 'ghost@test.com', 100)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 if amount is zero or negative', async () => {
      await expect(
        WalletService.transferFunds('user-1', 'tunde@test.com', -50)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('does not update balances if wallet lock fails mid-transaction', async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockRecipient);
      (WalletModel.findByUserIdForUpdate as jest.Mock)
        .mockResolvedValueOnce({ ...mockWallet })
        .mockRejectedValueOnce(new Error('Lock timeout'));

      await expect(
        WalletService.transferFunds('user-1', 'tunde@test.com', 100)
      ).rejects.toThrow();

      expect(WalletModel.updateBalance).not.toHaveBeenCalled();
    });
  });

  // ─── withdrawFunds ────────────────────────────────────────────────────────

  describe('withdrawFunds', () => {
    it('reduces balance by the withdrawn amount', async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({ ...mockWallet });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(undefined);

      const result = await WalletService.withdrawFunds('user-1', 300);
      expect(result.balance).toBe(700);
    });

    it('creates a withdraw transaction record', async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({ ...mockWallet });
      (WalletModel.updateBalance as jest.Mock).mockResolvedValue(undefined);
      (TransactionModel.create as jest.Mock).mockResolvedValue(undefined);

      await WalletService.withdrawFunds('user-1', 300);

      expect(TransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'withdraw', amount: 300 }),
        expect.anything()
      );
    });

    it('throws 422 when balance is insufficient', async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue({ ...mockWallet });

      await expect(WalletService.withdrawFunds('user-1', 5000)).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it('throws 400 if amount is zero or negative', async () => {
      await expect(WalletService.withdrawFunds('user-1', 0)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('throws 404 if wallet is not found', async () => {
      (WalletModel.findByUserIdForUpdate as jest.Mock).mockResolvedValue(undefined);
      await expect(WalletService.withdrawFunds('user-1', 100)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ─── getTransactionHistory ────────────────────────────────────────────────

  describe('getTransactionHistory', () => {
    const mockTransactions = [
      { id: 'txn-1', wallet_id: 'wallet-1', type: 'fund', amount: 500, reference: 'ref-1' },
      { id: 'txn-2', wallet_id: 'wallet-1', type: 'withdraw', amount: 200, reference: 'ref-2' },
    ];

    it('returns transaction list for a valid user', async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (TransactionModel.findByWalletId as jest.Mock).mockResolvedValue(mockTransactions);

      const result = await WalletService.getTransactionHistory('user-1');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('fund');
    });

    it('throws 404 if wallet is not found', async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(undefined);

      await expect(WalletService.getTransactionHistory('user-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('returns an empty array when there are no transactions', async () => {
      (WalletModel.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
      (TransactionModel.findByWalletId as jest.Mock).mockResolvedValue([]);

      const result = await WalletService.getTransactionHistory('user-1');
      expect(result).toEqual([]);
    });
  });
});
