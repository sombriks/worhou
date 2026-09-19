import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import {PostgreSqlContainer} from '@testcontainers/postgresql';
import test from 'ava';
import database from './configs/database.js';
import {fastify} from '#configs/server.js';
import {Logins} from '#models/logins.js';
import {Timelogs} from '#models/timelogs.js';

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
 Helper for email logins
 @param {import('ava').ExecutionContext} t
 @param {string} email
 @returns {Promise<string>} auth token
 */
async function answerEmailChallenge(t, email) {
  const login = await database.db(Logins._name)
    .where({[Logins.identifier]: email})
    .first();

  t.truthy(login);
  t.truthy(login.challenge);

  const challengeResponse = await fastify.inject({
    method: 'POST',
    url: '/profile/email/challenge',
    body: {
      userId: login.users_id,
      challenge: login.challenge,
    },
  });

  t.is(challengeResponse.statusCode, 200);

  const token = challengeResponse.body.match(/w\.token = '([^']+)'/v)?.[1];

  t.truthy(token);

  return token;
}

test('should get index/onboarding page', async t => {
  const response = await fastify.inject({
    method: 'GET',
    url: '/',
  });

  t.is(response.statusCode, 200);
  t.regex(response.payload, /welcome/iv);
});

test.serial('should login using email', async t => {
  const email = 'test@example.com';
  const response = await fastify.inject({
    method: 'PUT',
    url: '/profile/email/login',
    body: {
      email,
      password: 'e1e2e3e4',
    },
  });
  t.is(response.statusCode, 200);
  t.regex(response.body, /challenge/iv);
  const token = await answerEmailChallenge(t, email);
  t.truthy(token);

  // Check welcome partial
  const welcome = await fastify.inject({
    method: 'GET',
    url: '/welcome',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.regex(welcome.body, /test/iv);
});

test('should create user, save timelog and list result', async t => {
  const email = `timelog-${Date.now()}@example.com`;

  const signupResponse = await fastify.inject({
    method: 'POST',
    url: '/profile/email/signup',
    body: {
      name: 'Timelog Test User',
      email,
      password: 'e1e2e3e4',
    },
  });

  t.is(signupResponse.statusCode, 200);

  t.is(signupResponse.statusCode, 200);
  t.regex(signupResponse.body, /challenge/iv);

  const token = await answerEmailChallenge(t, email);

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
  t.regex(todayResponse.body, /timelogs for/iv);
  t.regex(todayResponse.body, /\d{2}:\d{2}/v);
  t.notRegex(todayResponse.body, /nothing clocked today/iv);
});

test.serial('should get worksheet for test user with registered hours', async t => {
  const email = 'test@example.com';
  const loginResponse = await fastify.inject({
    method: 'PUT',
    url: '/profile/email/login',
    body: {
      email,
      password: 'e1e2e3e4',
    },
  });

  t.is(loginResponse.statusCode, 200);
  t.regex(loginResponse.body, /challenge/iv);

  const token = await answerEmailChallenge(t, email);

  t.truthy(token);

  const worksheetResponse = await fastify.inject({
    method: 'GET',
    url: '/worksheet/list',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(worksheetResponse.statusCode, 200);
  t.regex(worksheetResponse.body, /line-sheet/v);
  t.regex(worksheetResponse.body, /\d{1,2}h \d{1,2}m \d{1,2}s/v);
  t.regex(worksheetResponse.body, /\d{2}:\d{2} - \d{2}:\d{2}/v);
});

test('should login using device', async t => {
  const device = crypto.randomUUID();
  const response = await fastify.inject({
    method: 'POST',
    url: '/profile/device',
    body: {
      device,
    },
  });

  t.is(response.statusCode, 200);
  t.regex(response.body, /token/iv);
});

test.serial('should login using device, save timelog and visit timelog detail', async t => {
  const device = crypto.randomUUID();

  const loginResponse = await fastify.inject({
    method: 'POST',
    url: '/profile/device',
    body: {
      device,
    },
  });

  t.is(loginResponse.statusCode, 200);

  const token = loginResponse.body.match(/w\.token = '([^']+)'/v)?.[1];

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

  const timelog = await database.db(Timelogs._name)
    .orderBy(Timelogs.id, 'desc')
    .first();

  t.truthy(timelog);

  const detailResponse = await fastify.inject({
    method: 'GET',
    url: `/timelog/${timelog.id}`,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(detailResponse.statusCode, 200);
  t.regex(detailResponse.body, /timelog details/iv);
  t.regex(detailResponse.body, /clock time/iv);
  t.regex(detailResponse.body, /created by/iv);
});

test('should login using device, save timelog and update it', async t => {
  const device = crypto.randomUUID();

  const loginResponse = await fastify.inject({
    method: 'POST',
    url: '/profile/device',
    body: {
      device,
    },
  });

  t.is(loginResponse.statusCode, 200);

  const token = loginResponse.body.match(/w\.token = '([^']+)'/v)?.[1];

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

  const originalTimelog = await database.db(Timelogs._name)
    .orderBy(Timelogs.id, 'desc')
    .first();

  t.truthy(originalTimelog);
  t.falsy(originalTimelog.cancelled_at);

  const updateResponse = await fastify.inject({
    method: 'PUT',
    url: `/timelog/${originalTimelog.id}`,
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: {
      time: '10:30',
      note: 'Adjusted by test',
    },
  });

  t.is(updateResponse.statusCode, 200);
  t.regex(updateResponse.body, /timelog/iv);

  const cancelledTimelog = await database.db(Timelogs._name)
    .where({[Timelogs.id]: originalTimelog.id})
    .first();

  t.truthy(cancelledTimelog);
  t.truthy(cancelledTimelog.cancelled_at);
  t.is(cancelledTimelog.note, 'Adjusted by test');

  const replacementTimelog = await database.db(Timelogs._name)
    .where({[Timelogs.replaced_id]: originalTimelog.id})
    .first();

  t.truthy(replacementTimelog);
  t.is(replacementTimelog.owner_id, originalTimelog.owner_id);
  t.is(replacementTimelog.creator_id, originalTimelog.creator_id);
  t.falsy(replacementTimelog.cancelled_at);

  const detailResponse = await fastify.inject({
    method: 'GET',
    url: `/timelog/${replacementTimelog.id}`,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(detailResponse.statusCode, 200);
  t.regex(detailResponse.body, /timelog details/iv);
  t.regex(detailResponse.body, /clock time/iv);
  t.regex(detailResponse.body, new RegExp(`#${originalTimelog.id}`, 'v'));
});

test('should login using device, save timelogs and download worksheet csv', async t => {
  const device = crypto.randomUUID();

  const loginResponse = await fastify.inject({
    method: 'POST',
    url: '/profile/device',
    body: {
      device,
    },
  });

  t.is(loginResponse.statusCode, 200);

  const token = loginResponse.body.match(/w\.token = '([^']+)'/v)?.[1];

  t.truthy(token);

  const firstClockInResponse = await fastify.inject({
    method: 'POST',
    url: '/timelog/clock-in',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(firstClockInResponse.statusCode, 303);
  t.is(firstClockInResponse.headers.location, '/timelog/today');

  const secondClockInResponse = await fastify.inject({
    method: 'POST',
    url: '/timelog/clock-in',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(secondClockInResponse.statusCode, 303);
  t.is(secondClockInResponse.headers.location, '/timelog/today');

  const csvResponse = await fastify.inject({
    method: 'GET',
    url: '/worksheet/csv?period=lastWeek',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.is(csvResponse.statusCode, 200);
  t.regex(csvResponse.headers['content-type'], /text\/csv/iv);
  t.regex(csvResponse.body, /^WorHou;/v);
  t.regex(csvResponse.body, /Date;Periods;Total Time;/v);
  t.regex(csvResponse.body, /\d{4}-\d{2}-\d{2};\d+;\d+:\d+:\d+/v);
});
