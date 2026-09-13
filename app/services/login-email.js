import {getToken, hash, verify} from './auth.js';
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

  return getToken(user);
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
  return getToken({id: users_id, name});
}
