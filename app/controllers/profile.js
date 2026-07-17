import jwt from 'jsonwebtoken';
import auth from '../configs/auth.js';
import {db} from '../configs/db.js';

export const page = async (request, res) => res.view('pages/profile');

export const login = async (request, res) => {
  const {username, password} = request.body;
  const pass = auth.encode(password);
  const result = await db.raw("select 1 + 1, ''||:pass", {pass});
  console.log(result, pass);
  const payload = {sub: {id: 1, name: username}, iss: 'WorHou', aud: 'WorHou'};
  const token = jwt.sign(payload, auth.key, {expiresIn: '1h'});
  return res.view('partials/profile/set-token.pug', {token});
};

export const signup = async (request, res) => res.view('partials/profile/set-token.pug');
