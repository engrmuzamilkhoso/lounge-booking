import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { type ApiErrorResponse, ResponseCode, ResponseMessage } from '@booking/shared-types';
import { AppException } from './app.exception.js';

/** Response codes used when a framework HttpException (not an AppException) is thrown. */
const responseCodeByHttpStatus: Partial<Record<number, ResponseCode>> = {
  [HttpStatus.BAD_REQUEST]: ResponseCode.InvalidData,
  [HttpStatus.UNAUTHORIZED]: ResponseCode.Unauthorized,
  [HttpStatus.FORBIDDEN]: ResponseCode.Forbidden,
  [HttpStatus.NOT_FOUND]: ResponseCode.NoRecord,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ResponseCode.InvalidData,
  [HttpStatus.TOO_MANY_REQUESTS]: ResponseCode.TooManyAttempts,
};

/**
 * Converts every error into the API error format: `{ status, message, errors? }`.
 * Unexpected errors are logged with their stack and returned as a generic 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppException) {
      this.send(response, exception.getStatus(), {
        status: exception.responseCode,
        message: exception.message,
        errors: exception.fieldErrors,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const httpStatus = exception.getStatus();
      const responseCode = responseCodeByHttpStatus[httpStatus] ?? ResponseCode.ServerError;
      this.send(response, httpStatus, {
        status: responseCode,
        message: ResponseMessage[responseCode],
      });
      return;
    }

    this.logger.error(exception);
    this.send(response, HttpStatus.INTERNAL_SERVER_ERROR, {
      status: ResponseCode.ServerError,
      message: ResponseMessage[ResponseCode.ServerError],
    });
  }

  private send(response: Response, httpStatus: number, body: ApiErrorResponse): void {
    response.status(httpStatus).json(body);
  }
}
