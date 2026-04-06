import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/user.model';
import { WalletModel } from '../models/wallet.model';
import { isBlacklisted } from './karma.service';
import db from '../config/db';
import { User } from '../types';
import { createError } from '../utils/errors';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
}

export const registerUser = async (payload: RegisterPayload): Promise<{ user: User; token: string }> => {
  const existing = await UserModel.findByEmail(payload.email);
  if (existing) throw createError('Email already registered', 409);

  const blacklisted = await isBlacklisted(payload.email);
  if (blacklisted) throw createError('Account creation denied', 403);

  const userId = uuidv4();
  const walletId = uuidv4();

  await db.transaction(async (trx) => {
    await UserModel.create({ id: userId, ...payload }, trx);
    await WalletModel.create({ id: walletId, user_id: userId, balance: 0 }, trx);
  });

  const user = (await UserModel.findById(userId)) as User;
  const token = `faux-token-${userId}`;

  return { user, token };
};