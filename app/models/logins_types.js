import {Base} from './_base.js';

export const LoginsTypes = Object.freeze({
  ...Base,
  _name: 'logins_types',
  description: 'description',
});

export const LoginsTypesValues = Object.freeze({
  LOCAL: 1,
  EMAIL: 2,
  GOOGLE: 3,
});
