import { Request } from 'express';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at?: Date;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at?: Date;
  updated_at?: Date;
}

export type TransactionType = 'fund' | 'transfer' | 'withdraw';

export interface Transaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  reference: string;
  counterparty_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: Date;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}