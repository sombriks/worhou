import {createEmailAccount, getToken, userExists} from '#services/auth.js';

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
    return reply.view('partials/profile/email-login');
  }

  return reply.view('partials/profile/me');
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const createAccountForm = async (request, reply) => reply.view('partials/profile/signup');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const login = async (request, reply) => {
  const {email, password} = request.body;
  const token = await getToken({email, password});
  if (!token) {
    return reply.view('partials/profile/email-login', {error: 'Invalid email or password'});
  }

  return reply.view('partials/profile/set-token.pug', {token});
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const signup = async (request, reply) => {
  const {name, email, password} = request.body;
  if (await userExists({email})) {
    return reply.view('partials/profile/signup.pug', {error: 'Email already in use'});
  }

  const token = await createEmailAccount({name, email, password});
  if (!token) {
    return reply.view('partials/profile/signup.pug', {error: 'Account creation failed'});
  }

  return reply.view('partials/profile/set-token.pug', {token});
};
