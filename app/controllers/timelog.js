import {format} from 'date-fns';
import {clockInNow, getDetail, getTimeLogsForDay, replaceOrCancel,} from '#services/timelog.js';

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const page = async (request, reply) => reply.view('pages/timelog');

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const today = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.status(401).view('partials/shared/please-login');
  }

  const day = new Date();
  const stamps = await getTimeLogsForDay(user, day);
  return reply.view('partials/timelog/today', {stamps, day, format});
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const clockIn = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.status(401).view('partials/shared/please-login');
  }

  await clockInNow(user);
  return reply.code(303).redirect('/timelog/today');
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const detail = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.status(401).view('partials/shared/please-login');
  }

  const {id} = request.params;
  const {edit} = request.query;
  const timelog = await getDetail(user, id);
  return edit
    ? reply.view('partials/timelog/edit', {timelog})
    : reply.view('partials/timelog/detail', {timelog, format});
};

/**
 @param {import('fastify').FastifyRequest} request
 @param {import('fastify').FastifyReply} reply
 */
export const update = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.status(401).view('partials/shared/please-login');
  }

  const {id} = request.params;
  const {deactivate, time, note} = request.body;
  const isJustCancel = deactivate === 'on';
  await replaceOrCancel(user, {
    id, isJustCancel, time, note,
  });

  // The redirect alone isn't enough since the partial is in another dom node
  return reply.view('partials/shared/goto', {to: '/timelog'});
  // Return reply.code(303).redirect('/timelog/today');
};
