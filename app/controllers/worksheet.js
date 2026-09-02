import {format} from 'date-fns';
import database from '#configs/database.js';
import {Worksheets} from '#models/worksheets.js';

export const page = async (request, reply) => reply.view('pages/worksheet');

export const list = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.view('partials/shared/please-login');
  }

  const result = await database.db(Worksheets._name)
    .where({[Worksheets.owner_id]: user.id})
    .select();
  const sheet = result.reduce((acc, row) => {
    acc[row[Worksheets.day]] ??= {periods: [], total: {hours: 0, minutes: 0}};
    acc[row[Worksheets.day]].periods.push(row);
    acc[row[Worksheets.day]].total.hours += row[Worksheets.intv_time].hours ?? 0;
    acc[row[Worksheets.day]].total.minutes += row[Worksheets.intv_time].minutes ?? 0;
    return acc;
  }, {});
  return reply.view('partials/worksheet/list', {sheet, format});
};
