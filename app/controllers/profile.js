import jwt from 'jsonwebtoken';
import auth from '../configs/auth.js';
import database from '../configs/database.js';
import {LoginsTypes} from '../models/logins.js';

export const page = async (request, res) => res.view('pages/profile');

export const me = async (request, response) => {
	const bearerToken = request.headers.authorization;
	if (!bearerToken) {
		return response.view('partials/profile/login');
	}

	const token = bearerToken.split(' ')[1];
	if (!token) {
		return response.view('partials/profile/login');
	}

	try {
		jwt.verify(token, auth.key);
		return response.view('partials/profile/me');
	} catch (error) {
		return response.view('partials/profile/login', {error});
	}
};

export const createAccountForm = async (request, response) => response.view('partials/profile/signup');

export const login = async (request, res) => {
	const {email, password} = request.body;
	const login = await database.db('logins')
		.where({identifier: email}).first();
	if (!login) {
		return res.view('partials/profile/login', {error: 'Invalid email or password'});
	}

	if (!(await auth.verify(password, login.password))) {
		return res.view('partials/profile/not-found.pug');
	}

	const user = await database.db('users')
		.where({id: login.users_id}).first();
	if (!user) {
		return res.view('partials/profile/not-found.pug');
	}

	const payload = {sub: user, iss: 'WorHou', aud: 'WorHou'};
	const token = jwt.sign(payload, auth.key, {expiresIn: '1h'});
	return res.view('partials/profile/set-token.pug', {token});
};

export const signup = async (request, res) => {
	const {name, email, password} = request.body;
	const exists = await database.db('logins')
		.where({identifier: email}).first();
	if (exists) {
		return res.view('partials/profile/signup.pug', {error: 'Email already in use'});
	}

	await database.db.transaction(async tx => {
		const [returnValue] = await tx('users')
			.insert({name}).returning('id');
		await tx('logins')
			.insert({
				users_id: returnValue.id,
				identifier: email,
				logins_types_id: LoginsTypes.EMAIL,
				password: await auth.hash(password),
			});
	});
	const payload = {sub: {name}, iss: 'WorHou', aud: 'WorHou'};
	const token = jwt.sign(payload, auth.key, {expiresIn: '1h'});
	return res.view('partials/profile/set-token.pug', {token});
};
