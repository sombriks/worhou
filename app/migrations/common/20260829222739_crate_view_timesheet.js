/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const up = async knex => knex.raw(`
    create or replace view worksheets as
    select owner_id,
           id                  as start_id,
           lead(id) over (
               partition by owner_id
               order by stamp) as end_id
    from timelogs
    where cancelled_at is null  
  `);

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const down = async knex => knex.raw(`
    drop view if exists worksheets; 
  `);
