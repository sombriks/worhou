import {format, subMonths, subWeeks} from 'date-fns';
import {getSheetFor} from '#services/worksheet.js';

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const page = async (request, reply) => reply.view('pages/worksheet');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const list = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.status(401).view('partials/shared/please-login');
  }

  const {period, sorting} = request.query;
  const end = new Date();
  const start = period === 'lastMonth' ? subMonths(end, 1) : subWeeks(end, 1);
  const sheet = await getSheetFor(user, {start, end});
  return reply.view('partials/worksheet/list', {
    period, sorting, sheet, format,
  });
};
