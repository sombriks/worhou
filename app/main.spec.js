import test from 'ava';
import {fastify} from './configs/server.js';

test('should get index/onboarding page', async t => {
	const response = await fastify.inject({
		method: 'GET',
		url: '/',
	});

	t.is(response.statusCode, 200);
	t.regex(response.payload, /welcome/i);
});
