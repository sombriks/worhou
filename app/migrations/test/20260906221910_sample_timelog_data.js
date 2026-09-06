import {Users} from '#models/users.js';
import {Timelogs} from '#models/timelogs.js';

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const up = async knex => {
  const user = await knex(Users._name).where(Users.name, 'Test User').first();
  if (!user) {
    return;
  }

  const makeDate = (daysAgo, hours, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const sampleLogs = [
    // Dia 1
    {stamp: makeDate(4, 8, 0)},
    {stamp: makeDate(4, 12, 0)},
    {stamp: makeDate(4, 13, 0)},
    {stamp: makeDate(4, 17, 0)},
    // Dia 2
    {stamp: makeDate(3, 8, 0)},
    {stamp: makeDate(3, 12, 0)},
    {stamp: makeDate(3, 13, 0)},
    {stamp: makeDate(3, 17, 0)},
    // Dia 3
    {stamp: makeDate(2, 8, 0)},
    {stamp: makeDate(2, 12, 0)},
    {stamp: makeDate(2, 13, 0)},
    {stamp: makeDate(2, 17, 0)},
    // Dia 4
    {stamp: makeDate(1, 8, 0)},
    {stamp: makeDate(1, 12, 0)},
    {stamp: makeDate(1, 13, 0)},
    {stamp: makeDate(1, 17, 0)},
  ];

  await knex(Timelogs._name).insert(sampleLogs.map(log => ({
    [Timelogs.owner_id]: user.id,
    [Timelogs.creator_id]: user.id,
    [Timelogs.stamp]: log.stamp,
  })));
};

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const down = async knex => {
  const user = await knex(Users._name).where(Users.name, 'Test User').first();
  if (user) {
    await knex(Timelogs._name).where(Timelogs.owner_id, user.id).del();
  }
};
