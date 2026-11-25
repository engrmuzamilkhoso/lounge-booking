import { ResponseCode, ResponseMessage } from '@booking/shared-types';

/** A failed API call, carrying the API's response code and any field-level messages. */
export class ApiError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly code: ResponseCode,
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static network(): ApiError {
    return new ApiError(
      0,
      ResponseCode.ServerError,
      'The service is unreachable. Please try again.',
    );
  }

  get isUnauthorized(): boolean {
    return this.httpStatus === 401;
  }

  get isNotFound(): boolean {
    return this.httpStatus === 404;
  }
}

/** Human-readable messages for API response codes, used in forms and notifications. */
const FRIENDLY_MESSAGES: Partial<Record<ResponseCode, string>> = {
  [ResponseCode.InvalidCredentials]: 'The email or password is incorrect.',
  [ResponseCode.UserExists]: 'An account with these details already exists.',
  [ResponseCode.InvalidData]: 'Please check the highlighted fields.',
  [ResponseCode.MissingParameters]: 'Please fill in the required fields.',
  [ResponseCode.InvalidOtp]: 'That code is not correct.',
  [ResponseCode.OtpExpired]: 'That code has expired. Request a new one.',
  [ResponseCode.InvalidResetToken]: 'This reset link is invalid or has expired. Request a new one.',
  [ResponseCode.TooManyAttempts]: 'Too many attempts. Please wait a minute and try again.',
  [ResponseCode.MembershipNotFound]: 'No approved membership was found with that number.',
  [ResponseCode.MembershipLimitExceeded]: 'This membership has no visits left.',
  [ResponseCode.PriceMismatch]: 'The price has changed. Please review the new total.',
  [ResponseCode.Unauthorized]: 'Please sign in to continue.',
  [ResponseCode.Forbidden]: 'You do not have permission to do that.',
  [ResponseCode.NoRecord]: 'We could not find what you were looking for.',
  [ResponseCode.ServerError]: 'Something went wrong on our side. Please try again.',
};

export function friendlyMessage(code: ResponseCode): string {
  return FRIENDLY_MESSAGES[code] ?? ResponseMessage[code];
}
