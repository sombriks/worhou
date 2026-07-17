import Knex from 'knex';

const cfg = {
  development: {
    client: 'better-sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: './db.sqlite3',
    },
  },
};

export const db = Knex(cfg[process.env.NODE_ENV || 'development']);
