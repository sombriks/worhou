import {endOfDay, format, parse, startOfDay,} from 'date-fns';
import database from '#configs/database.js';
import {Timelogs} from '#models/timelogs.js';

export const page = async (request, res) => res.view('pages/timelog');

export const today = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  const d = new Date();
  const stamps = await database.db(Timelogs._name)
    .where(Timelogs.owner_id, user.id)
    .whereNull(Timelogs.cancelled_at)
    .whereBetween(Timelogs.stamp, [startOfDay(d), endOfDay(d)])
    .orderBy(Timelogs.stamp)
    .select();
  const day = format(d, 'yyyy-MM-dd');
  return res.view('partials/timelog/today', {stamps, day, format});
};

export const clockIn = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  await database.db(Timelogs._name)
    .insert({
      [Timelogs.stamp]: new Date(),
      [Timelogs.owner_id]: user.id,
      [Timelogs.creator_id]: user.id,
    });
  // Restful babe
  return res.code(303).redirect('/timelog/today');
};

export const detail = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  const {id} = request.params;
  const {edit} = request.query;

  // TODO gather more info for detail screen
  const timelog = await database.db(Timelogs._name)
    .where({
      [Timelogs.id]: id,
      [Timelogs.owner_id]: user.id,
    })
    .first();

  return edit
    ? res.view('partials/timelog/edit', {timelog})
    : res.view('partials/timelog/detail', {timelog, format});
};

export const update = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  const {id} = request.params;
  const {deactivate, time, note} = request.body;

  const newStamp = `${format(new Date(), 'yyyy-MM-dd')} ${time}`;
  const stamp = parse(newStamp, 'yyyy-MM-dd HH:mm', new Date());

  const isJustCancel = deactivate === 'on';

  await database.db.transaction(async tx => {
    const result = await tx(Timelogs._name)
      .where({[Timelogs.id]: id, [Timelogs.owner_id]: user.id})
      .update({[Timelogs.note]: note, [Timelogs.cancelled_at]: new Date()});

    if (!isJustCancel) {
      const result2 = await tx(Timelogs._name)
        .insert({
          [Timelogs.stamp]: stamp,
          [Timelogs.owner_id]: user.id,
          [Timelogs.creator_id]: user.id,
          [Timelogs.replaced_id]: id
        })
        .returning(Timelogs.id);
    }
  });

  return res.view('partials/shared/goto', {to: '/timelog'});
};
