import { createHash, randomBytes, randomInt } from 'node:crypto';

/**
 * Random tokens handed to clients (refresh tokens, password-reset tokens).
 * Only the SHA-256 hash is stored, so a database leak does not expose usable tokens.
 * SHA-256 (not bcrypt) is enough because the tokens are 256-bit random values.
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Numeric one-time password with leading zeros allowed, e.g. "0427". */
export function generateNumericOtp(digits: number): string {
  const upperBound = 10 ** digits;
  return randomInt(0, upperBound).toString().padStart(digits, '0');
}
