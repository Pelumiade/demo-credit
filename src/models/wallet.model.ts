import { Knex } from 'knex';
import db from '../config/db';
import { Wallet } from '../types';

const TABLE = 'wallets';

export class WalletModel {
  static findByUserId(userId: string, trx?: Knex.Transaction): Promise<Wallet | undefined> {
    return (trx || db)(TABLE).where({ user_id: userId }).first();
  }

  // FOR UPDATE locks the row within a transaction to prevent concurrent balance mutations
  static findByUserIdForUpdate(userId: string, trx: Knex.Transaction): Promise<Wallet | undefined> {
    return trx(TABLE).where({ user_id: userId }).forUpdate().first();
  }

  static create(wallet: Wallet, trx?: Knex.Transaction): Promise<number[]> {
    return (trx || db)(TABLE).insert(wallet);
  }

  static updateBalance(id: string, balance: number, trx: Knex.Transaction): Promise<number> {
    return trx(TABLE).where({ id }).update({ balance, updated_at: db.fn.now() });
  }
}