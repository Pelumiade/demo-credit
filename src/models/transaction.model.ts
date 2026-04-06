import { Knex } from 'knex';
import db from '../config/db';
import { Transaction } from '../types';

const TABLE = 'transactions';

export class TransactionModel {
  static create(transaction: Transaction, trx: Knex.Transaction): Promise<number[]> {
    return trx(TABLE).insert(transaction);
  }

  static findByWalletId(walletId: string): Promise<Transaction[]> {
    return db(TABLE).where({ wallet_id: walletId }).orderBy('created_at', 'desc');
  }
}