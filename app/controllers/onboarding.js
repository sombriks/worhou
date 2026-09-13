import {getOrCreateUserSettings} from '#services/settings.js';

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const page = async (request, reply) => reply.view('index');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const welcome = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.status(401).view('partials/welcome/unlogged');
  }

  const userSettings = await getOrCreateUserSettings(user);
  return reply.view('partials/welcome/greet', {userSettings});
};
