import {challengeCheck, emailAccountCreate, emailAccountExists, emailAccountLogin,} from '#services/login-email.js';
import {getOrCreate} from '#services/login-device.js';
import {getOrCreateUserSettings} from '#services/settings.js';
import {sendEmailChallenge} from '#services/email.js';
import database from '#configs/database.js';
import {Users} from '#models/users.js';

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const page = async (request, reply) => reply.view('pages/profile');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const currentUser = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.status(401).view('partials/profile/unlogged');
  }

  const userSettings = await getOrCreateUserSettings(user);

  return reply.view('partials/profile/current-user', {userSettings});
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
  const result = await emailAccountLogin({email, password});
  if (!result) {
    return reply.view('partials/profile/email-login', {error: 'Invalid email or password'});
  }

  const user = await database.db(Users._name).where(Users.id, result.userId).first();
  sendEmailChallenge({email, ...user, ...result});
  return reply.view('partials/profile/email-challenge', {...result, email});
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

  const result = await emailAccountCreate({name, email, password});
  if (!result) {
    return reply.view('partials/profile/signup.pug', {error: 'Account creation failed'});
  }

  sendEmailChallenge({email, name, ...result});
  return reply.view('partials/profile/email-challenge', {...result, email});
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export async function challengeAnswer(request, reply) {
  const {userId, challenge} = request.body;
  const token = await challengeCheck(userId, challenge);
  if (!token) {
    return reply.view('partials/profile/email-challenge', {userId, error: 'Challenge invalid or expired'});
  }

  return reply.view('partials/profile/set-token', {token});
}

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
