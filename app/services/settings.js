import database from '#configs/database.js';
import {UsersSettings} from '#models/users_settings.js';

/**
 @param {{id:number}} user
 */
export async function getOrCreateUserSettings(user) {
  return await database.db.transaction(async tx => {
    const exists = await tx(UsersSettings._name)
      .where({[UsersSettings.users_id]: user.id})
      .first();
    if (exists) {
      return exists;
    }

    const [{id}] = await tx(UsersSettings._name)
      .insert({[UsersSettings.users_id]: user.id})
      .returning(UsersSettings.id);
    return await tx(UsersSettings._name).where({id}).first();
  });
}
