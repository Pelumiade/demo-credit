import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary();
    table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
    table.enum('type', ['fund', 'transfer', 'withdraw']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('reference').unique().notNullable();
    table.uuid('counterparty_id').nullable().references('id').inTable('wallets');
    table.text('metadata', 'longtext').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['wallet_id']);
    table.index(['reference']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('transactions');
}
