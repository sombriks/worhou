import crypto from 'node:crypto';
import {promisify} from 'node:util';
import jwt from 'jsonwebtoken';
import auth from '#configs/auth.js';
import database from '#configs/database.js';
import {Logins} from '#models/logins.js';
import {Users} from '#models/users.js';
import {LoginsTypesValues} from '#models/logins_types.js';

const pbkdf2 = promisify(crypto.pbkdf2);

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

export async function hash(pwd) {
  const salt = crypto.randomBytes(16).toString('hex');
  const raw = await pbkdf2(pwd, salt, ITERATIONS, KEY_LEN, DIGEST);
  const hashed = raw.toString('hex');
  return `${salt}:${hashed}`;
}

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

/**
 @param {{email:string,password:string}} user
 */
export async function getCredentials(user) {
  const {email} = user;
  return await database.db(Logins._name)
    .where({[Logins.identifier]: email}).first();
}

/**
 @param {{email:string,password:string}} login
 */
export async function getToken(login) {
  const {email, password} = login;
  const credentials = await getCredentials({email, password});
  if (!credentials) {
    return undefined;
  }

  if (!(await verify(password, credentials.password))) {
    return undefined;
  }

  const user = await database.db(Users._name)
    .where({[Users.id]: credentials.users_id}).first();
  if (!user) {
    return undefined;
  }

  const payload = {sub: user, iss: 'WorHou', aud: 'WorHou'};
  return jwt.sign(payload, auth.key, {expiresIn: auth.expiresIn});
}

/**
 @param {{email:string}} account
 */
export async function userExists(account) {
  const {email} = account;
  return await database.db(Logins._name)
    .where({[Logins.identifier]: email}).first();
}

/**
 @param {{name, email, password} } newAccoount
 */
export async function createEmailAccount(newAccoount) {
  const {name, email, password} = newAccoount;

  const users_id = await database.db.transaction(async tx => {
    const [returnValue] = await tx(Users._name)
      .insert({name}).returning(Users.id);
    const rId = returnValue[Users.id];
    await tx(Logins._name)
      .insert({
        [Logins.users_id]: rId,
        [Logins.identifier]: email,
        [Logins.logins_types_id]: LoginsTypesValues.EMAIL,
        [Logins.password]: await hash(password),
      });
    return rId;
  });
  const payload = {sub: {id: users_id, name}, iss: 'WorHou', aud: 'WorHou'};
  return jwt.sign(payload, auth.key, {expiresIn: '1d'});
}
