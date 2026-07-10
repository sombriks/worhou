import path from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import pug from 'pug';

// Expose the server
export const fastify = Fastify({
  logger: true,
});

// Expose some frontend libraries

fastify.register(fastifyStatic, {
  root: path.join(import.meta.dirname || __dirname, '../../node_modules/htmx.org/dist'),
  prefix: '/htmx/4', // Htmx/4/htmx.js
});

fastify.register(fastifyStatic, {
  root: path.join(import.meta.dirname || __dirname, '../../node_modules/bulma/css'),
  prefix: '/bulma/1', // Bulma/1/bulma.css
  decorateReply: false,
});

fastify.register(fastifyStatic, {
  root: path.join(import.meta.dirname || __dirname, '../../node_modules/date-fns'),
  prefix: '/date-fns/4', // Date-fns/4/cdn.js
  decorateReply: false,
});

fastify.register(fastifyStatic, {
  root: path.join(import.meta.dirname || __dirname, '../static'),
  prefix: '/static', // static/worhou.css
  decorateReply: false,
});

// Set up template engine

fastify.register(fastifyView, {
  root: path.join(import.meta.dirname || __dirname, '../templates'),
  viewExt: 'pug',
  engine: {pug},
});

// Routes mapping

fastify.get('/', async (request, reply) => reply.view('index', {message: 'hello, stranger!'}));
fastify.get('/timelog', async (request, reply) => reply.view('pages/timelog', {message: 'hello, stranger!'}));
fastify.get('/timesheet', async (request, reply) => reply.view('pages/timesheet', {message: 'hello, stranger!'}));
fastify.get('/profile', async (request, reply) => reply.view('pages/profile', {message: 'hello, stranger!'}));
fastify.get('/teams', async (request, reply) => reply.view('pages/teams', {message: 'hello, stranger!'}));
