import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { type ApiSuccessResponse, ResponseCode, ResponseMessage } from '@booking/shared-types';

/**
 * Wraps whatever a controller returns in the success format:
 * `{ status: "0000", message: "Success", data }`.
 * Controllers therefore return plain data and never build the envelope themselves.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<TData> implements NestInterceptor<
  TData,
  ApiSuccessResponse<TData>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<TData>,
  ): Observable<ApiSuccessResponse<TData>> {
    return next.handle().pipe(
      map((data) => ({
        status: ResponseCode.Success,
        message: ResponseMessage[ResponseCode.Success],
        data,
      })),
    );
  }
}
