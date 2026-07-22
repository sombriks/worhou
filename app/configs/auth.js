import crypto from 'node:crypto';
import {promisify} from 'node:util';

const pbkdf2 = promisify(crypto.pbkdf2);

const _key = process.env.AUTH_KEY || crypto.randomBytes(32).toString('hex');

const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = 'sha512';

export default {
	get key() {
		return _key;
	},
	async hash(pwd) {
		const salt = crypto.randomBytes(16).toString('hex');
		const hash = (await pbkdf2(pwd, salt, ITERATIONS, KEYLEN, DIGEST)).toString('hex');
		return `${salt}:${hash}`;
	},
	async verify(plainPwd, storedPwd) {
		if (typeof storedPwd !== 'string' || !storedPwd.includes(':')) {
			return false;
		}

		const [salt, storedHash] = storedPwd.split(':');
		const storedHashBuf = Buffer.from(storedHash, 'hex');
		const newHashBuf = await pbkdf2(plainPwd, salt, ITERATIONS, KEYLEN, DIGEST);

		if (newHashBuf.length !== storedHashBuf.length) {
			return false;
		}

		return crypto.timingSafeEqual(newHashBuf, storedHashBuf);
	},
};
