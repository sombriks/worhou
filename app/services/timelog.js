import {endOfDay, format, parse, startOfDay,} from 'date-fns';
import database from '#configs/database.js';
import {Timelogs} from '#models/timelogs.js';
import {Users} from '#models/users.js';

/**
 @param {{id:number}} user
 @param {Date} day
 */
export async function getTimeLogsForDay(user, day) {
  return await database.db(Timelogs._name)
    .where(Timelogs.owner_id, user.id)
    .whereNull(Timelogs.cancelled_at)
    .whereBetween(Timelogs.stamp, [startOfDay(day), endOfDay(day)])
    .orderBy(Timelogs.stamp)
    .select();
}

/**
 @param {{id:number}} user
 */
export async function clockInNow(user) {
  await database.db(Timelogs._name)
    .insert({
      [Timelogs.stamp]: new Date(),
      [Timelogs.owner_id]: user.id,
      [Timelogs.creator_id]: user.id,
    });
}

/**
 @param {{id:number}} user
 @param {number} id
 */
export async function getDetail(user, id) {
  const detail = await database.db(Timelogs._name)
    .where({
      [Timelogs.id]: id,
      [Timelogs.owner_id]: user.id,
    })
    .first();
  if (detail?.replaced_id) {
    detail.replaced = await database.db(Timelogs._name)
      .where({
        [Timelogs.id]: detail.replaced_id,
        [Timelogs.owner_id]: user.id,
      })
      .first();
  }

  if (detail?.creator_id) {
    detail.creator = await database.db(Users._name)
      .where({[Users.id]: detail.creator_id})
      .first();
  }

  return detail;
}

/**
 @param {{id:number}} user
 @param {{id:number,isJustCancel:boolean,time:string,note:string}} info
 */
export async function replaceOrCancel(user, info) {
  const {id, isJustCancel, time, note} = info;
  const newStamp = `${format(new Date(), 'yyyy-MM-dd')} ${time}`;
  const stamp = parse(newStamp, 'yyyy-MM-dd HH:mm', new Date());
  await database.db.transaction(async tx => {
    await tx(Timelogs._name)
      .where({[Timelogs.id]: id, [Timelogs.owner_id]: user.id})
      .update({[Timelogs.note]: note, [Timelogs.cancelled_at]: new Date()});
    if (!isJustCancel) {
      await tx(Timelogs._name)
        .insert({
          [Timelogs.stamp]: stamp,
          [Timelogs.owner_id]: user.id,
          [Timelogs.creator_id]: user.id,
          [Timelogs.replaced_id]: id,
        })
        .returning(Timelogs.id);
    }
  });
}
