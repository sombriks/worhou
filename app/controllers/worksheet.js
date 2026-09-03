import {differenceInHours, differenceInMinutes, differenceInSeconds, format} from 'date-fns';
import database from '#configs/database.js';
import {Worksheets} from '#models/worksheets.js';
import {Timelogs} from "#models/timelogs.js";

export const page = async (request, reply) => reply.view('pages/worksheet');

export const list = async (request, reply) => {
  const {user} = request;
  if (!user) {
    return reply.view('partials/shared/please-login');
  }
  const entries = await database.db.transaction(async tx => {
    const result = await tx(Worksheets._name)
      .where({[Worksheets.owner_id]: user.id})
      .whereNotNull(Worksheets.end_id)
      .select();
    const odds = result.filter((_, i) => i % 2 === 0);
    for (let odd of odds) {
      odd.start = await tx(Timelogs._name).where(Timelogs.id, odd.start_id).first();
      odd.end = await tx(Timelogs._name).where(Timelogs.id, odd.end_id).first();
    }
    return odds;
  })

  const sheet = entries.reduce((acc, row) => {
    const day = format(row.start.stamp, 'yyyy-MM-dd')
    acc[day] ??= {periods: [], total: {hours: 0, minutes: 0, seconds: 0}};
    acc[day].periods.push(row);
    const h = differenceInHours(row.end.stamp, row.start.stamp);
    acc[day].total.hours += h ?? 0;
    const m = differenceInMinutes(row.end.stamp, row.start.stamp);
    acc[day].total.minutes += (m ?? 0) - 60 * h;
    const s = differenceInSeconds(row.end.stamp, row.start.stamp);
    acc[day].total.seconds += (s ?? 0) - 60 * m;
    return acc;
  }, {});
  return reply.view('partials/worksheet/list', {sheet, format});
};
