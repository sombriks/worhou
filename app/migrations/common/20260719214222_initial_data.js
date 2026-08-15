import {LoginsTypes} from "#models/logins_types.js";

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const up = async knex => {
	await knex(LoginsTypes._name).insert([
		{description: 'local'},
		{description: 'email'},
		{description: 'google'},
	]);
};

/**
 @param { import("knex").Knex } knex
 @returns { Promise<void> }
 */
export const down = async knex => {
	await knex(LoginsTypes._name).del();
};
