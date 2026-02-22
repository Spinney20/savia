import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a CNP using AES-256-GCM.
 * Returns a single Buffer: [IV (12) | authTag (16) | ciphertext]
 */
export function encryptCnp(cnp: string, key: string): { encrypted: Buffer; hash: string } {
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH });

  const ciphertext = Buffer.concat([cipher.update(cnp, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encrypted = Buffer.concat([iv, authTag, ciphertext]);
  const hash = hashCnp(cnp);

  return { encrypted, hash };
}

/**
 * Decrypt a CNP from the combined buffer format.
 */
export function decryptCnp(encrypted: Buffer, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');
  const iv = encrypted.subarray(0, IV_LENGTH);
  const authTag = encrypted.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encrypted.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return decipher.update(ciphertext) + decipher.final('utf8');
}

/**
 * SHA-256 hash of a CNP for uniqueness checks without decryption.
 */
export function hashCnp(cnp: string): string {
  return crypto.createHash('sha256').update(cnp).digest('hex');
}
