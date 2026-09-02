import jwt from 'jsonwebtoken';
import auth from '#configs/auth.js';
import database from '#configs/database.js';
import {LoginsTypesValues} from '#models/logins_types.js';
import {Logins} from '#models/logins.js';
import {Users} from '#models/users.js';

export const page = async (request, reply) => reply.view('pages/profile');

export const me = async (request, reply) => {
	const {user} = request;
	if (!user) {
    return reply.view('partials/profile/login');
	}

  return reply.view('partials/profile/me');
};

export const createAccountForm = async (request, reply) => reply.view('partials/profile/signup');

export const login = async (request, reply) => {
	const {email, password} = request.body;
  const credentials = await database.db(Logins._name)
		.where({[Logins.identifier]: email}).first();
  if (!credentials) {
    return reply.view('partials/profile/login', {error: 'Invalid email or password'});
	}

  if (!(await auth.verify(password, credentials.password))) {
    return reply.view('partials/profile/not-found.pug');
	}

	const user = await database.db(Users._name)
    .where({[Users.id]: credentials.users_id}).first();
	if (!user) {
    return reply.view('partials/profile/not-found.pug');
	}

	const payload = {sub: user, iss: 'WorHou', aud: 'WorHou'};
	const token = jwt.sign(payload, auth.key, {expiresIn: '1h'});
  return reply.view('partials/profile/set-token.pug', {token});
};

export const signup = async (request, reply) => {
	const {name, email, password} = request.body;
	const exists = await database.db(Logins._name)
		.where({[Logins.identifier]: email}).first();
	if (exists) {
    return reply.view('partials/profile/signup.pug', {error: 'Email already in use'});
	}

	let users_id;
	await database.db.transaction(async tx => {
		const [returnValue] = await tx(Users._name)
			.insert({name}).returning(Users.id);
		users_id = returnValue[Users.id];
		await tx(Logins._name)
			.insert({
				[Logins.users_id]: users_id,
				[Logins.identifier]: email,
				[Logins.logins_types_id]: LoginsTypesValues.EMAIL,
				[Logins.password]: await auth.hash(password),
			});
	});
	const payload = {sub: {id: users_id, name}, iss: 'WorHou', aud: 'WorHou'};
	const token = jwt.sign(payload, auth.key, {expiresIn: '1h'});
  return reply.view('partials/profile/set-token.pug', {token});
};
