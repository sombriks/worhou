import {endOfDay, format, parse, startOfDay} from 'date-fns';
import database from '../configs/database.js';

export const page = async (request, res) => res.view('pages/timelog');

export const today = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  const d = new Date();
  const stamps = await database.db('timelogs')
    .where('owner_id', user.id)
    .whereNull('cancelled_at')
    .whereBetween('stamp', [startOfDay(d), endOfDay(d)])
    .orderBy('stamp')
    .select();
  const day = format(d, 'yyyy-MM-dd');
  return res.view('partials/timelog/today', {stamps, day, format});
};

export const clockIn = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  await database.db('timelogs')
    .insert({owner_id: user.id, stamp: new Date(), creator_id: user.id});
  return res.code(303).redirect('/timelog/today');
};

export const detail = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  const {id} = request.params;
  const {edit} = request.query;

  // Todo more info for detail screen
  const timelog = await database.db('timelogs')
    .where({id, owner_id: user.id})
    .first();

  return edit
    ? res.view('partials/timelog/edit', {timelog})
    : res.view('partials/timelog/detail', {timelog});
};

export const update = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/shared/please-login');
  }

  const {id} = request.params;
  const {deactivate, time, note} = request.body;

  const newStamp = `${format(new Date(), 'yyyy-MM-dd')} ${time}`
  const stamp = parse(newStamp, 'yyyy-MM-dd HH:mm', new Date());

  const justCancel = 'on' === deactivate;

  await database.db.transaction(async tx => {
    const result = await tx('timelogs')
      .where({id, owner_id: user.id})
      .update({note, cancelled_at: new Date()});

    if (!justCancel) {
      const result2 = await tx('timelogs')
        .insert({stamp, owner_id: user.id, creator_id: user.id, replaced_id: id})
        .returning('id');
    }
  });

  return res.view('partials/shared/goto', {to: '/timelog'});
};
