import path from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import pug from 'pug';
import {buildApi} from './api-builder.js';

// expose the server
export const fastify = Fastify({
  logger: true,
});

// set up frontend libraries

const nodeModules = path.join(import.meta.dirname, '../../node_modules');
const statics = {
  [path.join(nodeModules, 'htmx.org/dist')]: '/htmx/4', // Htmx/4/htmx.js
  [path.join(nodeModules, 'bulma/css')]: '/bulma/1', // Bulma/1/bulma.css
  [path.join(nodeModules, 'date-fns')]: '/date-fns/4', // Date-fns/4/cdn.js
  [path.join(nodeModules, '@mdi/font')]: '/mdi/7', // mdi/7/css/materialdesignicons.css
  [path.join(import.meta.dirname, '../static')]: '/static', // Static/worhou.css
}

let decorateReply = true;
for (let root in statics) {
  const prefix = statics[root];
  fastify.register(fastifyStatic, {
    root, prefix, decorateReply,
  });
  decorateReply = false;
}

// Set up template engine

fastify.register(fastifyView, {
  root: path.join(import.meta.dirname, '../templates'),
  viewExt: 'pug',
  engine: {pug},
});

// Wire routes with style
buildApi(fastify);
