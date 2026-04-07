import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('wallets', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').unique().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('balance', 15, 2).notNullable().defaultTo(0.00);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    // Some hosted MySQL variants only allow one TIMESTAMP column
    // with CURRENT_TIMESTAMP default; keep this nullable for portability.
    table.timestamp('updated_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('wallets');
}
