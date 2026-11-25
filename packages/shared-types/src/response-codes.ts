/**
 * Application response codes returned in the `status` field of every API response.
 *
 * Codes 0000–0012 keep the meaning they had in the Laravel mobile API
 * (Laravel's `00010`–`00012` are normalised to four digits). See docs/api-mapping.md §4.
 */
export const ResponseCode = {
  Success: '0000',
  InvalidEmail: '0001',
  InvalidCredentials: '0002',
  UserExists: '0003',
  InvalidData: '0004',
  MissingParameters: '0005',
  InvalidEmailFormat: '0006',
  EmailNotFound: '0007',
  InvalidOtpFormat: '0008',
  InvalidOtp: '0009',
  OtpExpired: '0010',
  NoRecord: '0011',
  InvalidDataType: '0012',
  MembershipNotFound: '0013',
  MembershipLimitExceeded: '0014',
  Unauthorized: '0015',
  Forbidden: '0016',
  InvalidResetToken: '0017',
  TooManyAttempts: '0018',
  PriceMismatch: '0019',
  PaymentNotRequired: '0020',
  AlreadyPaid: '0021',
  PaymentGatewayError: '0022',
  PaymentsUnavailable: '0023',
  PassAlreadyUsed: '0024',
  PassNotValid: '0025',
  ServerError: '9999',
} as const;
export type ResponseCode = (typeof ResponseCode)[keyof typeof ResponseCode];

export const ResponseMessage: Record<ResponseCode, string> = {
  '0000': 'Success',
  '0001': 'Invalid-Email',
  '0002': 'Invalid-Credentials',
  '0003': 'User-Exists',
  '0004': 'Invalid-Data',
  '0005': 'Missing-Parameters',
  '0006': 'Invalid-Email-Format',
  '0007': 'Email-Not-Found',
  '0008': 'Invalid-OTP-Format',
  '0009': 'Invalid-OTP',
  '0010': 'OTP-Expired',
  '0011': 'No-Record',
  '0012': 'Invalid-Data-Type',
  '0013': 'Membership-Not-Found',
  '0014': 'Membership-Limit-Exceeded',
  '0015': 'Unauthorized',
  '0016': 'Forbidden',
  '0017': 'Invalid-Reset-Token',
  '0018': 'Too-Many-Attempts',
  '0019': 'Price-Mismatch',
  '0020': 'Payment-Not-Required',
  '0021': 'Already-Paid',
  '0022': 'Payment-Gateway-Error',
  '0023': 'Payments-Unavailable',
  '0024': 'Pass-Already-Used',
  '0025': 'Pass-Not-Valid',
  '9999': 'Server-Error',
};

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiSuccessResponse<TData> {
  status: ResponseCode;
  message: string;
  data: TData;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  status: ResponseCode;
  message: string;
  /** Field-level validation messages, keyed by request field name. */
  errors?: Record<string, string[]>;
}
