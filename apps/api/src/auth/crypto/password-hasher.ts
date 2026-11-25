import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

/**
 * Same algorithm and cost as Laravel's default bcrypt hasher, so passwords imported from
 * Laravel (`$2y$10$...`) verify without any conversion and new hashes stay compatible.
 */
const BCRYPT_COST = 10;

/**
 * Hash of a random value nobody knows. Login compares against it when the email does not
 * exist, so the response takes as long as for a real account (no account discovery by timing).
 */
const UNKNOWN_USER_PASSWORD_HASH = bcrypt.hashSync(randomBytes(24).toString('hex'), BCRYPT_COST);

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_COST);
}

export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/** Verifies against the user's hash, or against a dummy hash when there is no such user. */
export async function verifyPasswordOrDummy(
  plainPassword: string,
  passwordHash: string | null,
): Promise<boolean> {
  if (passwordHash === null) {
    await bcrypt.compare(plainPassword, UNKNOWN_USER_PASSWORD_HASH);
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
}
