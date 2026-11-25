import { HttpStatus } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from './app.exception.js';

/** Standard 404 for "the record you asked for does not exist (or was deleted)". */
export function recordNotFound(): AppException {
  return new AppException(ResponseCode.NoRecord, HttpStatus.NOT_FOUND);
}
