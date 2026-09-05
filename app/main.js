import database from './configs/database.js';
import {fastify} from '#configs/server.js';

const port = process.env.PORT || 3000;
fastify.log.info('Starting database migrations...');
await database.db.migrate.latest();
fastify.log.info('Starting server...');
fastify.listen({port}, error => {
  if (error) {
    fastify.log.error(error);
    throw error;
  }

  fastify.log.info('Server open to business!');
});
