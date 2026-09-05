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
  if (user) {
    return reply.view('partials/welcome/greet');
  }

  return reply.view('partials/welcome/unlogged');
};
