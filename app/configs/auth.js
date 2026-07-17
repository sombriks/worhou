import crypto from 'node:crypto';

const _key = process.env.AUTH_KEY || crypto.randomBytes(32).toString('hex');

export default {
  get key() {
    return _key;
  },
  encode(pwd) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pwd, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  },
  verify(pwd, hash) {
    const [salt, storedHash] = hash.split(':');
    const newHash = crypto.pbkdf2Sync(pwd, salt, 100000, 64, 'sha512').toString('hex');
    return newHash === storedHash;
  },
};
