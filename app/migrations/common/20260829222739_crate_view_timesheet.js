/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const up = async knex => knex.raw(`
    create or replace view worksheets as
      with sheet as
               (select owner_id,
                       id,
                       date(stamp)         as day,
                       cast(stamp as time) as hour
                from timelogs
                where cancelled_at is null),
           ordered_sheet as
               (select *,
                       lag(id) over (partition by owner_id order by day, hour)   as prev_id,
                       lag(day) over (partition by owner_id order by day, hour)  as prev_day,
                       lag(hour) over (partition by owner_id order by day, hour) as prev_hour
                from sheet),
           per_day_sheet as
               (select *,
                       count(*) over (partition by owner_id, day order by day, hour) as day_period,
                       extract(epoch from (hour - prev_hour)) / 3600.0               as intv
                from ordered_sheet
                where day = prev_day),
           intervaled_sheet as
               (select *
                from per_day_sheet
                where day_period % 2 = 1)
      select id,
             prev_id,
             owner_id,
             day,
             prev_hour                  as start,
             hour                       as end,
             (intv * interval '1' hour) as intv_time
      from intervaled_sheet;
  `);

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const down = async knex => knex.raw(`
    drop view worksheets;
  `);
