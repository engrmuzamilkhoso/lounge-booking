import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { type ApiSuccessResponse, ResponseCode, ResponseMessage } from '@booking/shared-types';
import { PaginatedResult } from '../pagination/paginated-result.js';

/**
 * Wraps whatever a controller returns in the success format:
 * `{ status: "0000", message: "Success", data }`, plus `meta` for paginated lists.
 * Controllers therefore return plain data and never build the envelope themselves.
 * A controller returning nothing (e.g. logout) responds with `data: null`.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor<
  unknown,
  ApiSuccessResponse<unknown>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiSuccessResponse<unknown>> {
    return next.handle().pipe(map((result) => this.wrap(result)));
  }

  private wrap(result: unknown): ApiSuccessResponse<unknown> {
    const envelope = {
      status: ResponseCode.Success,
      message: ResponseMessage[ResponseCode.Success],
    };

    if (result instanceof PaginatedResult) {
      return { ...envelope, data: result.items, meta: result.meta };
    }

    return { ...envelope, data: result ?? null };
  }
}
