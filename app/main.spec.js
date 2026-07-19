import test from 'ava';
import {PostgreSqlContainer} from '@testcontainers/postgresql';
import {fastify} from './configs/server.js';
import database from './configs/database.js';

let container;

test.before(async () => {
	container = await new PostgreSqlContainer('postgres:16-alpine').start();
	// db override
	await database.initDb({
		host: container.getHost(),
		port: container.getPort(),
		user: container.getUsername(),
		password: container.getPassword(),
		database: container.getDatabase(),
	});
	await database.db.migrate.latest();
});

test.after.always(async () => {
	await database.db.destroy();
	await container.stop();
});

test('should get index/onboarding page', async t => {
	const response = await fastify.inject({
		method: 'GET',
		url: '/',
	});

	t.is(response.statusCode, 200);
	t.regex(response.payload, /welcome/i);
});
