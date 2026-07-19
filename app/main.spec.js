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
  await database.db.migrate.rollback({}, true);
  await database.db.destroy();
  await container.stop();
});

/**
 * @param {import('ava').ExecutionContext} t
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
 * @param {import('ava').ExecutionContext} t
 */
test('should login', async t => {
  const response = await fastify.inject({
		method: 'PUT',
		url: '/profile/login',
    body: {
      username: 'test',
      password: 'test',
    }
	});

	t.is(response.statusCode, 200);
  t.regex(response.body, /token/i)
});
