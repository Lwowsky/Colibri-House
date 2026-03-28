import crypto from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node tools/generate-admin-password-hash.mjs "YourStrongPassword"');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
crypto.scrypt(password, salt, 64, (err, derivedKey) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`scrypt$${salt}$${derivedKey.toString('hex')}`);
});
