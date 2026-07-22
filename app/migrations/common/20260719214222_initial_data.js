/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async knex => {
	await knex('logins_types').insert([
		{description: 'local'},
		{description: 'email'},
		{description: 'google'},
	]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async knex => {
	await knex('logins_types').del();
};
