import path from 'node:path';
import Fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import pug from 'pug';
import {format} from 'date-fns';
import * as onboarding from '#controllers/onboarding.js';
import * as timelog from '#controllers/timelog.js';
import * as worksheet from '#controllers/worksheet.js';
import * as teams from '#controllers/teams.js';
import * as profile from '#controllers/profile.js';
import {getUser} from '#services/auth.js';

// Expose the server
/** @type {import('fastify').FastifyInstance} */
export const fastify = Fastify({
  logger: true,
});

// Support for regular HTNL forms
fastify.register(fastifyFormBody);
fastify.register(fastifyMultipart);

// Expose frontend libraries
const nodeModules = path.join(import.meta.dirname, '../../node_modules');
const statics = {
  [path.join(nodeModules, 'htmx.org/dist')]: '/htmx', // -htmx/htmx.js
  [path.join(nodeModules, 'bulma/css')]: '/bulma', // -bulma/bulma.css
  [path.join(nodeModules, '@date-fns/cdn')]: '/date-fns', // -date-fns/cdn.js
  [path.join(nodeModules, 'jwt-decode/build/cjs')]: '/jwt-decode', // -jwt-decode/index.js
  [path.join(nodeModules, '@mdi/font')]: '/mdi', // -mdi/css/materialdesignicons.css
  [path.join(nodeModules, 'alpinejs/dist')]: '/alpinejs', // -alpinejs/cdn.js
  [path.join(import.meta.dirname, '../static')]: '/static', // -static/worhou.css
};
let isDecorateReply = true;
for (const root in statics) {
  const prefix = statics[root];
  fastify.register(fastifyStatic, {
    root, prefix, decorateReply: isDecorateReply,
  });
  isDecorateReply = false;
}

// Set up template engine
fastify.register(fastifyView, {
  root: path.join(import.meta.dirname, '../templates'),
  defaultContext: {
    base: process.env.BASE_URL ?? '',
    dateFns: {
      format,
    },
  },
  viewExt: 'pug',
  engine: {pug},
});

// Custom request objects
fastify.decorateRequest('user', null);
fastify.addHook('preHandler', async (request, reply) => {
  const user = await getUser(request.headers.authorization);
  if (user) {
    request.user = user;
    reply.locals = {
      ...reply.locals,
      user,
    };
  }
});

// Wire routes with style
const api = {
  '/': {
    get: onboarding.page,
    profile: {
      get: profile.page,
      '/me': {
        get: profile.currentUser,
      },
      '/email': {
        '/login': {
          get: profile.loginForm,
          put: profile.login,
        },
        '/signup': {
          get: profile.signupForm,
          post: profile.signup,
        },
      },
      '/device': {
        post: profile.signDevice,
      },
    },
    teams: {
      get: teams.page,
    },
    timelog: {
      get: timelog.page,
      '/today': {
        get: timelog.today,
      },
      '/clock-in': {
        post: timelog.clockIn,
      },
      '/:id': {
        get: timelog.detail,
        put: timelog.update,
      },
    },
    welcome: {
      get: onboarding.welcome,
    },
    worksheet: {
      get: worksheet.page,
      '/list': {
        get: worksheet.list,
      },
      '/csv': {
        get: worksheet.csv,
      }
    },
  },
};

const methods = new Set(['get', 'post', 'put', 'delete']);

const buildApi = (fast, routes = api, base = '') => {
  for (const key in routes) {
    if (methods.has(key)) {
      fast[key](base, routes[key]);
    } else {
      buildApi(fast, routes[key], base + key);
    }
  }
};

buildApi(fastify);
