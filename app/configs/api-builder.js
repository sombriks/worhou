import * as onboarding from '../controllers/onboarding.js';
import * as timelog from '../controllers/timelog.js';
import * as worksheet from '../controllers/worksheet.js';
import * as profile from '../controllers/profile.js';

const api = {
  '/': {
    get: onboarding.page,
  },
  '/timelog': {
    get: timelog.page,
  },
  '/worksheet': {
    get: worksheet.page,
  },
  '/profile': {
    get: profile.page,
  },
  '/teams': {
    get: profile.page,
  },
};

const methods = ['get', 'post', 'put', 'delete'];

export const buildApi = (fastify, routes = api, base = '') => {
  for (const key in routes) {
    if (methods.includes(key)) {
      fastify[key](base, routes[key]);
    } else {
      buildApi(fastify, routes[key], base + key);
    }
  }
};
