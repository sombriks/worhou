import {endOfDay, format, startOfDay} from 'date-fns';
import database from '../configs/database.js';

export const page = async (request, res) => res.view('pages/timelog');

export const today = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/please-login');
  }

  const d = new Date();
  const stamps = await database.db('timelogs')
    .where('owner_id', user.id)
    .whereNull('cancelled_at')
    .whereBetween('stamp', [startOfDay(d), endOfDay(d)])
    .select();
  const day = format(d, 'yyyy-MM-dd');
  return res.view('partials/timelog/today', {stamps, day, format});
};

export const clockIn = async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/please-login');
  }
  await database.db('timelogs')
    .insert({owner_id: user.id, stamp: new Date(), creator_id: user.id});
  return res.code(303).redirect('/timelog/today')
}

export const detail =  async (request, res) => {
  const {user} = request;
  if (!user) {
    return res.view('partials/please-login');
  }
  const {params} = request;
  const {id} = params;
  const timelog = await database.db('timelogs')
    .where({id, owner_id: user.id})
    .first();
  return res.view('partials/timelog/detail', {timelog});
}
