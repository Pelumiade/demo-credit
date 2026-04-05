import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: `${process.env.DB_NAME}_test`,
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
    },
  },

  production: {
    client: 'mysql2',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/db/migrations',
    },
    pool: { min: 2, max: 10 },
  },
};

export default config;
