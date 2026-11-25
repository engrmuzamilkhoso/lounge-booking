/**
 * Minimum password lengths, kept as they were in Laravel:
 * - registration and reset (mobile API `register`): 6
 * - changing the password from the profile page (`UpdatePasswordRequest`): 8
 */
export const MIN_PASSWORD_LENGTH_REGISTRATION = 6;
export const MIN_PASSWORD_LENGTH_PROFILE_CHANGE = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores bytes beyond 72
