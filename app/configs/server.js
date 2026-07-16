import path from 'node:path';
import Fastify from 'fastify';
import fastifyFormBody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import pug from 'pug';
import * as onboarding from '../controllers/onboarding.js';
import * as timelog from '../controllers/timelog.js';
import * as worksheet from '../controllers/worksheet.js';
import * as teams from '../controllers/teams.js';
import * as profile from '../controllers/profile.js';

// Expose the server
export const fastify = Fastify({
	logger: true,
});

// Support for regular HTNL forms
fastify.register(fastifyFormBody);
fastify.register(fastifyMultipart);

// Set up frontend libraries

const nodeModules = path.join(import.meta.dirname, '../../node_modules');
const statics = {
	[path.join(nodeModules, 'htmx.org/dist')]: '/htmx', // htmx/htmx.js
	[path.join(nodeModules, 'bulma/css')]: '/bulma', // bulma/bulma.css
	[path.join(nodeModules, '@date-fns/cdn')]: '/date-fns', // date-fns/cdn.js
	[path.join(nodeModules, 'jwt-decode/build/cjs')]: '/jwt-decode', // jwt-decode/index.js
	[path.join(nodeModules, '@mdi/font')]: '/mdi', // mdi/7/css/materialdesignicons.css
	[path.join(import.meta.dirname, '../static')]: '/static', // atatic/worhou.css
};

let decorateReply = true;
for (const root in statics) {
	const prefix = statics[root];
	fastify.register(fastifyStatic, {
		root, prefix, decorateReply,
	});
	decorateReply = false;
}

// Set up template engine

fastify.register(fastifyView, {
	root: path.join(import.meta.dirname, '../templates'),
	defaultContext: {
		base: process.env.BASE_URL ?? '',
	},
	viewExt: 'pug',
	engine: {pug},
});

// Wire routes with style

const api = {
	'/': {
		get: onboarding.page,
		profile: {
			get: profile.page,
			'/login': {
				put: profile.login,
				post: profile.signup,
			},
		},
		teams: {
			get: teams.page,
		},
		timelog: {
			get: timelog.page,
		},
		worksheet: {
			get: worksheet.page,
		},
	},
};

const methods = new Set(['get', 'post', 'put', 'delete']);

const buildApi = (fastify, routes = api, base = '') => {
	for (const key in routes) {
		if (methods.has(key)) {
			fastify[key](base, routes[key]);
		} else {
			buildApi(fastify, routes[key], base + key);
		}
	}
};

buildApi(fastify);
