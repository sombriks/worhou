import Knex from 'knex';
import cfg from '../migrations/knexfile.js';

let database = Knex(cfg[process.env.NODE_ENV || 'development']);
export default {
  get db() {
    return database;
  },
  async initDb(connection) {
    if (database) {
      await database.destroy();
    }
    // override database connection
    const config = cfg[process.env.NODE_ENV || 'development'];
    if (connection) {
      config.connection = connection;
    }
    database = Knex(config);
  }
}
