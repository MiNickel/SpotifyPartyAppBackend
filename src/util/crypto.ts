import crypto from 'crypto';

const IV_LENGTH = 16;
const ALGORITHM = 'aes256';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export const encrypt = (token: string) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(token);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (token: string) => {
  const tokenParts = token.split(':');
  const iv = Buffer.from(tokenParts.shift()!, 'hex');
  const encryptedText = Buffer.from(tokenParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};
