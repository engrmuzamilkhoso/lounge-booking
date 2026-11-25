import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode, ResponseMessage } from '@booking/shared-types';

/**
 * Throw from services when a request fails for a business reason.
 * The exception filter turns it into `{ status, message, errors? }` with the given HTTP status.
 */
export class AppException extends HttpException {
  readonly responseCode: ResponseCode;
  readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(
    responseCode: ResponseCode,
    httpStatus: HttpStatus,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(ResponseMessage[responseCode], httpStatus);
    this.responseCode = responseCode;
    this.fieldErrors = fieldErrors;
  }
}
