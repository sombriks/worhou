import database from './configs/database.js';
import {fastify} from '#configs/server.js';

const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 3000;
fastify.log.info('Starting database migrations...');
await database.db.migrate.latest();
fastify.log.info('Starting server...');
fastify.listen({host, port}, error => {
  if (error) {
    fastify.log.error(error);
    throw error;
  }

  fastify.log.info('Server open to business!');
});
