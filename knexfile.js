require('dotenv').config();

/** @type {import('knex').Knex.Config} */
const baseConnection = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

/** @type {import('knex').Knex.Config} */
module.exports = {
  development: {
    client: 'mysql2',
    connection: baseConnection,
    migrations: {
      directory: './dist/db/migrations',
      extension: 'js',
    },
    seeds: {
      directory: './dist/db/seeds',
      extension: 'js',
    },
  },

  test: {
    client: 'mysql2',
    connection: {
      ...baseConnection,
      database: `${process.env.DB_NAME}_test`,
    },
    migrations: {
      directory: './dist/db/migrations',
      extension: 'js',
    },
  },

  production: {
    client: 'mysql2',
    connection: baseConnection,
    migrations: {
      directory: './dist/db/migrations',
      extension: 'js',
    },
    pool: { min: 2, max: 10 },
  },
};

