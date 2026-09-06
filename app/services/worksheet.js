import {
  addDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  endOfDay,
  format,
  startOfDay,
} from 'date-fns';
import database from '#configs/database.js';
import {Worksheets} from '#models/worksheets.js';
import {Timelogs} from '#models/timelogs.js';

/**
 @param {{id:number}} user
 @param {{start:Date,end:Date}} filter
 */
export async function getSheetFor(user, filter) {
  const start = startOfDay(filter.start);
  const end = endOfDay(filter.end);
  const entries = await database.db.transaction(async tx => {
    const range = await tx(Timelogs._name)
      .whereBetween(Timelogs.stamp, [start, end])
      .select('id');
    const result = await tx(Worksheets._name)
      .where({[Worksheets.owner_id]: user.id})
      .whereNotNull(Worksheets.end_id)
      .whereIn(Worksheets.start_id, range.map(r => r.id))
      .select();
    const odds = result.filter((_, i) => i % 2 === 0);
    for (const odd of odds) {
      odd.start = await tx(Timelogs._name).where(Timelogs.id, odd.start_id).first();
      odd.end = await tx(Timelogs._name).where(Timelogs.id, odd.end_id).first();
    }

    return odds;
  });

  const sheet = {};
  let entry = start;
  while (entry <= end) {
    sheet[format(entry, 'yyyy-MM-dd')] = {periods: [], total: {hours: 0, minutes: 0, seconds: 0}};
    entry = addDays(entry, 1);
  }

  entries.reduce((acc, row) => {
    const day = format(row.start.stamp, 'yyyy-MM-dd');
    acc[day].periods.push(row);
    acc[day].total.hours += differenceInHours(row.end.stamp, row.start.stamp) ?? 0;
    acc[day].total.minutes += differenceInMinutes(row.end.stamp, row.start.stamp) ?? 0;
    acc[day].total.seconds += differenceInSeconds(row.end.stamp, row.start.stamp) ?? 0;
    return acc;
  }, sheet);

  for (const day of Object.values(sheet)) {
    day.total.minutes %= 60;
    day.total.seconds %= 60;
  }

  return sheet;
}
