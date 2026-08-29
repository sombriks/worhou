import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import {PostgreSqlContainer} from '@testcontainers/postgresql';
import test from 'ava';
import {fastify} from './configs/server.js';
import database from './configs/database.js';

// Extract database image from infra/database.yml
const databaseYmlPath = path.join(import.meta.dirname, 'infra/database.yml');
const databaseYml = yaml.load(fs.readFileSync(databaseYmlPath, 'utf8'));
const {image} = databaseYml.services.db;

let container;

test.before(async () => {
	container = await new PostgreSqlContainer(image).start();
	// Db override
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
	await database.db.migrate.rollback({});
	await database.db.destroy();
	await container.stop();
});

/**
 @param {import('ava').ExecutionContext} t
 */
test('should get index/onboarding page', async t => {
	const response = await fastify.inject({
		method: 'GET',
		url: '/',
	});

	t.is(response.statusCode, 200);
	t.regex(response.payload, /welcome/i);
});

/**
 @param {import('ava').ExecutionContext} t
 */
test('should login', async t => {
	const response = await fastify.inject({
		method: 'PUT',
		url: '/profile/login',
		body: {
			email: 'test@example.com',
			password: 'e1e2e3e4',
		},
	});

	t.is(response.statusCode, 200);
	t.regex(response.body, /token/i);
});

test('should create user, save timelog and list result', async t => {
  const email = `timelog-${Date.now()}@example.com`;

  const signupResponse = await fastify.inject({
		method: 'POST',
		url: '/profile/signup',
		body: {
      name: 'Timelog Test User',
      email,
			password: 'e1e2e3e4',
		},
	});

  t.is(signupResponse.statusCode, 200);

  const token = signupResponse.body.match(/w\.token = '([^']+)'/)?.[1];

  t.truthy(token);

  const clockInResponse = await fastify.inject({
    method: 'POST',
    url: '/timelog/clock-in',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(clockInResponse.statusCode, 303);
  t.is(clockInResponse.headers.location, '/timelog/today');

  const todayResponse = await fastify.inject({
    method: 'GET',
    url: '/timelog/today',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(todayResponse.statusCode, 200);
  t.regex(todayResponse.body, /timelogs for/i);
  t.regex(todayResponse.body, /\d{2}:\d{2}/);
  t.notRegex(todayResponse.body, /nothing clocked today/i);
});

