import {emailAccountCreate, emailAccountExists, emailAccountLogin} from '#services/login-email.js';
import {getOrCreate} from '#services/login-device.js';

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const page = async (request, reply) => reply.view('pages/profile');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const me = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.view('partials/profile/unlogged');
  }

  return reply.view('partials/profile/me');
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const signupForm = async (request, reply) => reply.view('partials/profile/email-signup');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const loginForm = async (request, reply) => reply.view('partials/profile/email-login');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const login = async (request, reply) => {
  const {email, password} = request.body;
  const token = await emailAccountLogin({email, password});
  if (!token) {
    return reply.view('partials/profile/email-login', {error: 'Invalid email or password'});
  }

  return reply.view('partials/profile/set-token', {token});
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const signup = async (request, reply) => {
  const {name, email, password} = request.body;
  if (await emailAccountExists({email})) {
    return reply.view('partials/profile/email-signup', {error: 'Email already in use'});
  }

  // TODO both login and signup must ask for a challenge
  const token = await emailAccountCreate({name, email, password});
  if (!token) {
    return reply.view('partials/profile/signup.pug', {error: 'Account creation failed'});
  }

  return reply.view('partials/profile/set-token', {token});
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export async function signDevice(request, reply) {
  const {device} = request.body;
  // Check if device already exists, if not, create a user and link to it
  const token = await getOrCreate(device);
  return reply.view('partials/profile/set-token', {token});
}
