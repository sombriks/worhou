import {fastify} from './configs/server.js';

fastify.listen({port: process.env.POET || 3000}, (error, address) => {
	if (error) {
		fastify.log.error(error);
		process.exit(1);
	}
});
