import Fastify from 'fastify';

const fastify = Fastify({
	logger: true,
});

fastify.get('/', async (request, reply) => ({hello: 'world'}));

fastify.listen({port: 3000}, (error, address) => {
	if (error) {
		fastify.log.error(error);
		process.exit(1);
	}
});
