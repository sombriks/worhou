/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const up = async knex => {
  await knex.schema.createTable('users_settings', table => {
    table.increments('id').primary();
    table.integer('users_id').notNullable().unique().references('users.id').onDelete('CASCADE');
    table.string('job_title');
    table.integer('shift_size').notNullable().defaultTo(4);
    table.integer('hours_per_day').notNullable().defaultTo(8);
    table.integer('hours_per_week').notNullable().defaultTo(40);
    table.integer('hours_per_month').notNullable().defaultTo(160);
    table.timestamps(true, true);
  });
};

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const down = async knex => {
  await knex.schema.dropTable('users_settings');
};
