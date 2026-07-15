import crypto from 'node:crypto';

const _key = process.env.AUTH_KEY || crypto.randomBytes(32).toString('hex');

export default {
	get key() {
		return _key;
	},
};
