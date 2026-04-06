import { v4 as uuidv4 } from 'uuid';
import db from '../config/db';
import { WalletModel } from '../models/wallet.model';
import { TransactionModel } from '../models/transaction.model';
import { UserModel } from '../models/user.model';
import { Wallet, Transaction } from '../types';
import { createError, assertPositiveAmount } from '../utils/errors';

export const getBalance = async (userId: string): Promise<Wallet> => {
  const wallet = await WalletModel.findByUserId(userId);
  if (!wallet) throw createError('Wallet not found', 404);
  return wallet;
};

export const fundWallet = async (userId: string, amount: number): Promise<Wallet> => {
  assertPositiveAmount(amount);

  return db.transaction(async (trx) => {
    const wallet = await WalletModel.findByUserIdForUpdate(userId, trx);
    if (!wallet) throw createError('Wallet not found', 404);

    const newBalance = Number(wallet.balance) + amount;
    await WalletModel.updateBalance(wallet.id, newBalance, trx);

    await TransactionModel.create(
      { id: uuidv4(), wallet_id: wallet.id, type: 'fund', amount, reference: uuidv4() },
      trx
    );

    return { ...wallet, balance: newBalance };
  });
};

export const transferFunds = async (
  senderId: string,
  recipientEmail: string,
  amount: number
): Promise<void> => {
  assertPositiveAmount(amount);

  const recipient = await UserModel.findByEmail(recipientEmail);
  if (!recipient) throw createError('Recipient not found', 404);
  if (recipient.id === senderId) throw createError('Cannot transfer to yourself', 400);

  await db.transaction(async (trx) => {
    const senderWallet = await WalletModel.findByUserIdForUpdate(senderId, trx);
    if (!senderWallet) throw createError('Sender wallet not found', 404);

    if (Number(senderWallet.balance) < amount) throw createError('Insufficient funds', 422);

    const recipientWallet = await WalletModel.findByUserIdForUpdate(recipient.id, trx);
    if (!recipientWallet) throw createError('Recipient wallet not found', 404);

    await WalletModel.updateBalance(senderWallet.id, Number(senderWallet.balance) - amount, trx);
    await WalletModel.updateBalance(recipientWallet.id, Number(recipientWallet.balance) + amount, trx);

    // Each row needs its own `reference` — the column is unique.
    await TransactionModel.create(
      { id: uuidv4(), wallet_id: senderWallet.id, type: 'transfer', amount, reference: uuidv4(), counterparty_id: recipientWallet.id },
      trx
    );
    await TransactionModel.create(
      { id: uuidv4(), wallet_id: recipientWallet.id, type: 'transfer', amount, reference: uuidv4(), counterparty_id: senderWallet.id },
      trx
    );
  });
};

export const withdrawFunds = async (userId: string, amount: number): Promise<Wallet> => {
  assertPositiveAmount(amount);

  return db.transaction(async (trx) => {
    const wallet = await WalletModel.findByUserIdForUpdate(userId, trx);
    if (!wallet) throw createError('Wallet not found', 404);

    if (Number(wallet.balance) < amount) throw createError('Insufficient funds', 422);

    const newBalance = Number(wallet.balance) - amount;
    await WalletModel.updateBalance(wallet.id, newBalance, trx);

    await TransactionModel.create(
      { id: uuidv4(), wallet_id: wallet.id, type: 'withdraw', amount, reference: uuidv4() },
      trx
    );

    return { ...wallet, balance: newBalance };
  });
};

export const getTransactionHistory = async (userId: string): Promise<Transaction[]> => {
  const wallet = await WalletModel.findByUserId(userId);
  if (!wallet) throw createError('Wallet not found', 404);
  return TransactionModel.findByWalletId(wallet.id);
};