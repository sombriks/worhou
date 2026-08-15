import {LoginsTypes} from '#models/logins_types.js';
import {Users} from "#models/users.js";
import {Logins} from "#models/logins.js";
import {Timelogs} from "#models/timelogs.js";

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const up = async knex => {
	// Users and logins
	await knex.schema.createTable('users', table => {
		table.increments('id').primary();
		table.string('name').notNullable();
		table.timestamps(true, true);
	});
	await knex.schema.createTable(LoginsTypes._name, table => {
		table.increments(LoginsTypes.id).primary();
		table.string(LoginsTypes.description).notNullable().unique();
		table.timestamps(true, true);
	});
	await knex.schema.createTable('logins', table => {
		table.increments('id').primary();
		table.integer('logins_types_id').notNullable().references('logins_types.id');
		table.integer('users_id').notNullable().references('users.id').onDelete('CASCADE');
		table.string('identifier').notNullable();
		table.string('password').notNullable();
		table.string('challenge');
		table.timestamp('challenge_at');
		table.timestamps(true, true);
		table.unique(['users_id', 'identifier']);
	});
	// Timelogs
	await knex.schema.createTable('timelogs', table => {
		table.increments('id').primary();
		table.integer('owner_id').notNullable().references('users.id').onDelete('CASCADE');
		table.timestamp('stamp').notNullable();
		table.string('note');
		table.timestamps(true, true);
		table.timestamp('cancelled_at');
		table.integer('replaced_id').references('timelogs.id').onDelete('SET NULL');
		table.integer('creator_id').references('users.id').onDelete('SET NULL');
	});
};

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const down = async knex => {
	await knex.schema.dropTable(Timelogs._name);
	await knex.schema.dropTable(Logins._name);
	await knex.schema.dropTable(LoginsTypes._name);
	await knex.schema.dropTable(Users._name);
};
