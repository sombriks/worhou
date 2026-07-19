import path from 'node:path';

const pool = {
	min: 2,
	max: 5,
};

const migrations = {
	extension: 'js',
	stub: path.join(import.meta.dirname, 'migration.stup.js'),
	directory: [
		path.join(import.meta.dirname, 'common'),
	],
};

if (process.env.NODE_ENV === 'development') {
	migrations.directory.unshift(path.join(import.meta.dirname, 'development'));
} else if (process.env.NODE_ENV === 'test') {
	migrations.directory.unshift(path.join(import.meta.dirname, 'test'));
} else {
	migrations.directory.unshift(path.join(import.meta.dirname, 'production'));
}

const common = {
	client: 'pg',
	connection: {
		port: process.env.DB_PORT ?? 5432,
		host: process.env.DB_HOST ?? '127.0.0.1',
		user: process.env.DB_USER ?? 'worhou',
		password: process.env.DB_PASSWORD ?? 'worhou',
		database: process.env.DB_NAME ?? process.env.DB_USER ?? 'worhou',
	},
	pool,
	migrations,
};

export default {
	development: {...common},
	test: {...common},
	production: {...common},
};

