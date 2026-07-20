import jwt from 'jsonwebtoken';
import auth from '../configs/auth.js';
import database from '../configs/database.js';

export const page = async (req, res) => res.view('pages/profile');

export const login = async (req, res) => {
  const {username, password} = req.body;
  const login = await database.db('logins')
    .where({identifier: username}).first();
  if (!login) return res.view('partials/profile/not-found.pug');
  if (auth.verify(password, login.password)) return res.view('partials/profile/not-found.pug');
  const user = await database.db('users')
    .where({id: login.users_id}).first();
  if (!user) return res.view('partials/profile/not-found.pug');

  const payload = {sub: user, iss: 'WorHou', aud: 'WorHou'};
  const token = jwt.sign(payload, auth.key, {expiresIn: '1h'});
  return res.view('partials/profile/set-token.pug', {token});
};

export const signup = async (req, res) => res.view('partials/profile/set-token.pug');
