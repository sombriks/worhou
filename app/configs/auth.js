import crypto from 'node:crypto';

const _key = process.env.AUTH_KEY || crypto.randomBytes(32).toString('hex');
const _expiresIn = process.env.AUTH_EXPIRES_IN || '1d';

export default {
  get key() {
    return _key;
  },
  get expiresIn() {
    return _expiresIn;
  }
};
