import jwt from 'jsonwebtoken';
import auth from '../configs/auth.js';

export const page = async (request, res) => res.view('pages/profile');

export const login = async (request, res) => {
	const {username, password} = request.body;
	// Go to database and find thing
	const payload = {sub: {id: 1, name: username}, iss: 'WorHou', aud: 'WorHou'};
	const token = jwt.sign(payload, auth.key, {expiresIn: '1h'});
	return res.view('partials/profile/set-token.pug', {token});
};

export const signup = async (request, res) => res.view('partials/profile/set-token.pug');
