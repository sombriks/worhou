import {fastify} from './configs/server.js';
import database from './configs/database.js';

const port = process.env.PORT || 3000;
fastify.log.info('Starting database migrations...');
await database.db.migrate.latest();
fastify.log.info('Starting server...');
fastify.listen({port}, error => {
	if (error) {
		fastify.log.error(error);
		process.exit(1);
	} else {
		fastify.log.info('Server open to business!');
	}
});
