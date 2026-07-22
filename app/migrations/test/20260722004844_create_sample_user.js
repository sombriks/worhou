import {LoginsTypes} from '../../models/logins.js';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async knex => {
	const [returnValue] = await knex('users').insert({
		name: 'Test User',
	}).returning('id');
	await knex('logins').insert({
		users_id: returnValue.id,
		identifier: 'test@example.com',
		logins_types_id: LoginsTypes.EMAIL,
		password: '0a93e3007e7c24b6897de10d943dc629:e0c7ceab576ff4129fe1cfd5facb84ec81b8302a0cbc13b97e7fcfdb546271df05f9b77c289878db9d9cc2011519d0d6dec28cd1dd5ecbc19287ce475ae39355',
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async knex => {
	await knex('logins').del();
	await knex('users').del();
};
