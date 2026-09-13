import crypto from 'node:crypto';
import {promisify} from 'node:util';
import jwt from 'jsonwebtoken';
import auth from '#configs/auth.js';
import database from '#configs/database.js';
import {Users} from '#models/users.js';

const pbkdf2 = promisify(crypto.pbkdf2);

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

/**
 @param {string} pwd
 */
export async function hash(pwd) {
  const salt = crypto.randomBytes(16).toString('hex');
  const raw = await pbkdf2(pwd, salt, ITERATIONS, KEY_LEN, DIGEST);
  const hashed = raw.toString('hex');
  return `${salt}:${hashed}`;
}

/**
 @param {string} plainPwd
 @param {string} storedPwd
 */
export async function verify(plainPwd, storedPwd) {
  if (typeof storedPwd !== 'string' || !storedPwd.includes(':')) {
    return false;
  }

  const [salt, storedHash] = storedPwd.split(':');
  const storedHashBuf = Buffer.from(storedHash, 'hex');
  const newHashBuf = await pbkdf2(plainPwd, salt, ITERATIONS, KEY_LEN, DIGEST);
  if (newHashBuf.length !== storedHashBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(newHashBuf, storedHashBuf);
}

export async function getToken(user) {
  const payload = {sub: user, iss: 'WorHou', aud: 'WorHou'};
  return jwt.sign(payload, auth.key, {expiresIn: auth.expiresIn});
}

/**
 @param {string} token
 */
export async function getUser(token) {
  try {
    if (!token) {
      return null;
    }

    token = token.split(' ', 2)[1];
    if (!token) {
      return null;
    }

    const payload = jwt.verify(token, auth.key);
    const id = payload.sub?.id;
    if (!id) {
      return null;
    }

    return await database.db(Users._name).where({id}).first();
  } catch (error) {
    console.warn('failed to extract user from token', error);
    return null;
  }
}
