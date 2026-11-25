import { HttpStatus } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../common/http/app.exception.js';
import { isUniqueConstraintViolation } from '../prisma/prisma-errors.js';

/**
 * Nationality and status names are unique (database index), as in Laravel's validation.
 * Turns the database's duplicate-name error into a field error; other errors pass through.
 */
export function translateUniqueName(error: unknown): unknown {
  if (isUniqueConstraintViolation(error)) {
    return new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
      name: ['The name has already been taken'],
    });
  }
  return error;
}
