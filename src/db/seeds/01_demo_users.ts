import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

const userAId = uuidv4();
const userBId = uuidv4();
const walletAId = uuidv4();
const walletBId = uuidv4();

export async function seed(knex: Knex): Promise<void> {
  await knex('transactions').del();
  await knex('wallets').del();
  await knex('users').del();

  await knex('users').insert([
    { id: userAId, name: 'Fola Pena', email: 'fola@demo.com', phone: '08012345678' },
    { id: userBId, name: 'Pelumi Ade', email: 'pelumi@demo.com', phone: '08087654321' },
  ]);

  await knex('wallets').insert([
    { id: walletAId, user_id: userAId, balance: 10000.0 },
    { id: walletBId, user_id: userBId, balance: 5000.0 },
  ]);

  console.log('─────────────────────────────────────────');
  console.log('Seed complete. Test tokens:');
  console.log(`Fola:   faux-token-${userAId}`);
  console.log(`Pelumi: faux-token-${userBId}`);
  console.log('─────────────────────────────────────────');
}
