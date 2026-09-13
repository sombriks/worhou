import database from '#configs/database.js';
import {Logins} from '#models/logins.js';
import {Users} from '#models/users.js';
import {LoginsTypesValues} from '#models/logins_types.js';
import {getToken, hash} from '#services/auth.js';

/**
 @param {string} device
 */
export async function getOrCreate(device) {
  const login = await database.db.transaction(async tx => {
    const exists = await tx(Logins._name).where({[Logins.identifier]: device}).first();
    if (exists) {
      return exists;
    }

    // Provision a guest user for this device
    const [{id}] = await tx(Users._name)
      .insert({[Users.name]: `Guest#${device.slice(0, 6)}`})
      .returning(Users.id);
    const newLogin = {
      [Logins.logins_types_id]: LoginsTypesValues.LOCAL,
      [Logins.users_id]: id,
      [Logins.identifier]: device,
      [Logins.password]: await hash(device),
    };
    await tx(Logins._name).insert(newLogin);
    return newLogin;
  });

  const user = await database.db(Users._name).where({[Users.id]: login[Logins.users_id]}).first();
  return getToken(user);
}
