import { HttpStatus, ValidationPipe, type ValidationError } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../http/app.exception.js';

/** class-validator constraints that mean "the field was not sent at all". */
const MISSING_VALUE_CONSTRAINTS = new Set(['isDefined', 'isNotEmpty']);

/**
 * Global validation for every DTO.
 * - Unknown properties are rejected, so clients cannot set fields they shouldn't (Laravel's
 *   mass-assignment problem).
 * - Errors become `0005 Missing-Parameters` when a required field is absent, otherwise
 *   `0004 Invalid-Data`, with messages grouped by field (nested fields use dot paths).
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (validationErrors: ValidationError[]) => {
      const fieldErrors: Record<string, string[]> = {};
      collectFieldErrors(validationErrors, '', fieldErrors);

      const hasMissingField = validationErrors.some((error) => isMissingValueError(error));
      const responseCode = hasMissingField
        ? ResponseCode.MissingParameters
        : ResponseCode.InvalidData;

      return new AppException(responseCode, HttpStatus.UNPROCESSABLE_ENTITY, fieldErrors);
    },
  });
}

function collectFieldErrors(
  validationErrors: ValidationError[],
  parentPath: string,
  fieldErrors: Record<string, string[]>,
): void {
  for (const error of validationErrors) {
    const path = parentPath === '' ? error.property : `${parentPath}.${error.property}`;

    if (error.constraints !== undefined) {
      fieldErrors[path] = Object.values(error.constraints);
    }

    if (error.children !== undefined && error.children.length > 0) {
      collectFieldErrors(error.children, path, fieldErrors);
    }
  }
}

function isMissingValueError(error: ValidationError): boolean {
  const constraintNames = Object.keys(error.constraints ?? {});
  if (constraintNames.some((name) => MISSING_VALUE_CONSTRAINTS.has(name))) {
    return true;
  }
  return (error.children ?? []).some((child) => isMissingValueError(child));
}
