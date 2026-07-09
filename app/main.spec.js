import test from 'ava';
import {fastify} from './configs/servier.js';

test('should get index page', async t => {
	const response = await fastify.inject({
		method: 'GET',
		url: '/',
	});

	t.is(response.statusCode, 200);
	t.true(response.payload.includes('hello, stranger!'));
});
