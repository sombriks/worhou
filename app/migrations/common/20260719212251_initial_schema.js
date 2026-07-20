/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async knex => {
  // table users
  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
  await knex.schema.createTable('logins_types', table => {
    table.increments('id').primary();
    table.string('description').notNullable().unique();
    table.timestamps(true, true);
  });
  await knex.schema.createTable('logins', table => {
    table.increments('id').primary();
    table.integer("logins_types_id").notNullable().references("logins_types.id")
    table.integer('users_id').notNullable().references('users.id').onDelete('CASCADE');
    table.string('identifier').notNullable();
    table.string('password').notNullable();
    table.string('challenge');
    table.timestamp("challenge_at");
    table.timestamps(true, true);
    table.unique(['users_id', 'identifier']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async knex => {
  await knex.schema.dropTable('logins');
  await knex.schema.dropTable('logins_types');
  await knex.schema.dropTable('users');
};
