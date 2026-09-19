import {getToken, hash, makeChallenge, verify,} from './auth.js';
import database from '#configs/database.js';
import {Logins} from '#models/logins.js';
import {Users} from '#models/users.js';
import {LoginsTypesValues} from '#models/logins_types.js';

/**
 @param {{email:string,password:string}} login
 */
export async function emailAccountLogin(login) {
  const {email, password} = login;
  const credentials = await database.db(Logins._name)
    .where({[Logins.identifier]: email}).first();
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

  const {challenge, challenge_at} = makeChallenge();
  await database.db(Logins._name).update({
    [Logins.challenge_at]: challenge_at,
    [Logins.challenge]: challenge,
  }).where({
    [Logins.users_id]: user.id,
    [Logins.id]: credentials.id,
  });

  return {userId: user.id, challenge};
}

/**
 @param {{email:string}} account
 */
export async function emailAccountExists(account) {
  const {email} = account;
  return await database.db(Logins._name)
    .where({
      [Logins.identifier]: email,
      [Logins.logins_types_id]: LoginsTypesValues.EMAIL,
    }).first();
}

/**
 @param {{name, email, password} } newAccoount
 */
export async function emailAccountCreate(newAccoount) {
  const {name, email, password} = newAccoount;
  // Create account and add the first challenge
  return await database.db.transaction(async tx => {
    const [returnValue] = await tx(Users._name)
      .insert({name}).returning(Users.id);
    const rId = returnValue[Users.id];
    const {challenge, challenge_at} = makeChallenge();
    await tx(Logins._name)
      .insert({
        [Logins.users_id]: rId,
        [Logins.identifier]: email,
        [Logins.challenge]: challenge,
        [Logins.challenge_at]: challenge_at,
        [Logins.logins_types_id]: LoginsTypesValues.EMAIL,
        [Logins.password]: await hash(password),
      });
    return {userId: rId, challenge};
  });
}

/**
 @param {number} userId
 @param {string} challenge
 */
export async function challengeCheck(userId, challenge) {
  const user = await database.db.transaction(async tx => {
    const user = await tx(Users._name).where(Users.id, userId).first();
    if (!user) {
      return undefined;
    }

    const login = await tx(Logins._name).where({
      [Logins.users_id]: userId,
      [Logins.challenge]: challenge,
    }).first();
    if (!login) {
      return undefined;
    }

    // Now checks if the challenge is expired
    if (login.challenge_at < new Date()) {
      return undefined;
    }

    return user;
  });

  if (!user) {
    return undefined;
  }

  return getToken(user);
}
