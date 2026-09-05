import test from 'ava';
import {hash, verify} from './auth.js';

test('hash should return a string with salt and hash separated by colon', async t => {
  const password = 'mysecretpassword';
  const hashedPassword = await hash(password);
  t.is(typeof hashedPassword, 'string');
  t.true(hashedPassword.includes(':'));
  const [salt, hashed] = hashedPassword.split(':');
  t.truthy(salt);
  t.truthy(hashed);
});

test('verify should return true for correct password', async t => {
  const password = 'mysecretpassword';
  const hashedPassword = await hash(password);
  const result = await verify(password, hashedPassword);
  t.true(result);
});

test('verify should return false for incorrect password', async t => {
  const password = 'mysecretpassword';
  const hashedPassword = await hash(password);
  const result = await verify('wrongpassword', hashedPassword);
  t.false(result);
});

test('verify should return false for malformed stored password', async t => {
  t.false(await verify('password', 'malformed'));
});

test('verify should return false for different hash length', async t => {
  const shortHash = 'abc:1234'; // '1234' hex is 2 bytes, expected is 64 bytes
  t.false(await verify('password', shortHash));
});
