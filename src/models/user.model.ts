import { Knex } from 'knex';
import db from '../config/db';
import { User } from '../types';

const TABLE = 'users';

export class UserModel {
  static findById(id: string): Promise<User | undefined> {
    return db(TABLE).where({ id }).first();
  }

  static findByEmail(email: string): Promise<User | undefined> {
    return db(TABLE).where({ email }).first();
  }

  static create(user: User, trx?: Knex.Transaction): Promise<number[]> {
    return (trx || db)(TABLE).insert(user);
  }
}