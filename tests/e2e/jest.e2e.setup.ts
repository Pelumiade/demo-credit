import dotenv from 'dotenv';

dotenv.config();
// Isolated DB for E2E (must exist; run migrations: DB_NAME=demo_credit_test npx knex migrate:latest --knexfile knexfile.ts)
process.env.DB_NAME = process.env.E2E_DB_NAME || 'demo_credit_test';
