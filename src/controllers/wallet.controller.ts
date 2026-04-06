import { Request, Response, NextFunction } from 'express';
import * as WalletService from '../services/wallet.service';
import { sendSuccess } from '../utils/response';

export const getBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wallet = await WalletService.getBalance((req as any).user.id);
    sendSuccess(res, 'Balance retrieved', { balance: wallet.balance });
  } catch (err) {
    next(err);
  }
};

export const fund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wallet = await WalletService.fundWallet((req as any).user.id, Number(req.body.amount));
    sendSuccess(res, 'Wallet funded', { balance: wallet.balance });
  } catch (err) {
    next(err);
  }
};

export const transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recipient_email, amount } = req.body;
    await WalletService.transferFunds((req as any).user.id, recipient_email, Number(amount));
    sendSuccess(res, 'Transfer successful');
  } catch (err) {
    next(err);
  }
};

export const withdraw = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wallet = await WalletService.withdrawFunds((req as any).user.id, Number(req.body.amount));
    sendSuccess(res, 'Withdrawal successful', { balance: wallet.balance });
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transactions = await WalletService.getTransactionHistory((req as any).user.id);
    sendSuccess(res, 'Transactions retrieved', { transactions });
  } catch (err) {
    next(err);
  }
};
