import { ApiErrorCode, HttpStatusCode } from '../types';

export class TriggerXError extends Error {
  public readonly errorCode: ApiErrorCode;
  public readonly httpStatusCode?: HttpStatusCode;
  public readonly errorType: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'API_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN_ERROR';
  public readonly details?: any;

  constructor(
    message: string, 
    errorCode: ApiErrorCode, 
    errorType: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'API_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN_ERROR',
    details?: any,
    httpStatusCode?: HttpStatusCode
  ) {
    super(message);
    this.name = 'TriggerXError';
    this.errorCode = errorCode;
    this.errorType = errorType;
    this.details = details;
    this.httpStatusCode = httpStatusCode;
  }
}

// HTTP Status Code to Error Code Mapping
export const HTTP_STATUS_TO_ERROR_CODE: Record<HttpStatusCode, ApiErrorCode> = {
  // 4xx Client Errors
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  406: 'NOT_ACCEPTABLE',
  407: 'PROXY_AUTHENTICATION_REQUIRED',
  408: 'REQUEST_TIMEOUT',
  409: 'CONFLICT',
  410: 'GONE',
  411: 'LENGTH_REQUIRED',
  412: 'PRECONDITION_FAILED',
  413: 'PAYLOAD_TOO_LARGE',
  414: 'URI_TOO_LONG',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  416: 'RANGE_NOT_SATISFIABLE',
  417: 'EXPECTATION_FAILED',
  418: 'IM_A_TEAPOT',
  421: 'MISDIRECTED_REQUEST',
  422: 'UNPROCESSABLE_ENTITY',
  423: 'LOCKED',
  424: 'FAILED_DEPENDENCY',
  425: 'TOO_EARLY',
  426: 'UPGRADE_REQUIRED',
  428: 'PRECONDITION_REQUIRED',
  429: 'TOO_MANY_REQUESTS',
  431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
  451: 'UNAVAILABLE_FOR_LEGAL_REASONS',
  
  // 5xx Server Errors
  500: 'INTERNAL_SERVER_ERROR',
  501: 'NOT_IMPLEMENTED',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
  505: 'HTTP_VERSION_NOT_SUPPORTED',
  506: 'VARIANT_ALSO_NEGOTIATES',
  507: 'INSUFFICIENT_STORAGE',
  508: 'LOOP_DETECTED',
  510: 'NOT_EXTENDED',
  511: 'NETWORK_AUTHENTICATION_REQUIRED'
};

// Error message patterns to error code mapping
export const ERROR_PATTERN_TO_CODE: Record<string, ApiErrorCode> = {
  'network': 'NETWORK_ERROR',
  'timeout': 'REQUEST_TIMEOUT',
  'connection': 'NETWORK_ERROR',
  'unauthorized': 'UNAUTHORIZED',
  'forbidden': 'FORBIDDEN',
  'not found': 'NOT_FOUND',
  'bad request': 'BAD_REQUEST',
  'validation': 'VALIDATION_ERROR',
  'invalid': 'VALIDATION_ERROR',
  'missing': 'VALIDATION_ERROR',
  'required': 'VALIDATION_ERROR',
  'insufficient': 'INSUFFICIENT_FUNDS',
  'balance': 'BALANCE_ERROR',
  'contract': 'CONTRACT_ERROR',
  'transaction': 'TRANSACTION_FAILED',
  'gas': 'GAS_ESTIMATION_FAILED',
  'nonce': 'NONCE_TOO_LOW',
  'revert': 'CONTRACT_REVERT',
  'rate limit': 'RATE_LIMIT_EXCEEDED',
  'too many': 'TOO_MANY_REQUESTS',
  'server error': 'INTERNAL_SERVER_ERROR',
  'service unavailable': 'SERVICE_UNAVAILABLE',
  'bad gateway': 'BAD_GATEWAY',
  'gateway timeout': 'GATEWAY_TIMEOUT'
};

export function wrapError(error: unknown): TriggerXError {
  if (error instanceof TriggerXError) {
    return error;
  }
  if (error instanceof Error) {
    return new TriggerXError(error.message, 'UNKNOWN_ERROR', 'UNKNOWN_ERROR');
  }
  return new TriggerXError('Unknown error', 'UNKNOWN_ERROR', 'UNKNOWN_ERROR');
}

// Helper function to extract HTTP status code from error
export function extractHttpStatusCode(error: any): HttpStatusCode | undefined {
  if (error?.response?.status) {
    return error.response.status as HttpStatusCode;
  }
  if (error?.status) {
    return error.status as HttpStatusCode;
  }
  if (error?.code && typeof error.code === 'number') {
    return error.code as HttpStatusCode;
  }
  return undefined;
}

// Helper function to determine error code from error message and status
export function determineErrorCode(error: any, httpStatusCode?: HttpStatusCode): ApiErrorCode {
  // First check if we have an HTTP status code
  if (httpStatusCode && HTTP_STATUS_TO_ERROR_CODE[httpStatusCode]) {
    return HTTP_STATUS_TO_ERROR_CODE[httpStatusCode];
  }
  
  // Extract status code from error if not provided
  const statusCode = httpStatusCode || extractHttpStatusCode(error);
  if (statusCode && HTTP_STATUS_TO_ERROR_CODE[statusCode]) {
    return HTTP_STATUS_TO_ERROR_CODE[statusCode];
  }
  
  // Check error message patterns
  const message = error?.message?.toLowerCase() || '';
  for (const [pattern, code] of Object.entries(ERROR_PATTERN_TO_CODE)) {
    if (message.includes(pattern)) {
      return code;
    }
  }
  
  return 'UNKNOWN_ERROR';
} 

export class ValidationError extends TriggerXError {
  public readonly field: string;
  
  constructor(field: string, message: string, details?: any, httpStatusCode?: HttpStatusCode) {
    super(message, 'VALIDATION_ERROR', 'VALIDATION_ERROR', details, httpStatusCode);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends TriggerXError {
  constructor(message: string, details?: any, httpStatusCode?: HttpStatusCode) {
    super(message, 'NETWORK_ERROR', 'NETWORK_ERROR', details, httpStatusCode);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends TriggerXError {
  constructor(message: string, details?: any, httpStatusCode?: HttpStatusCode) {
    super(message, 'AUTHENTICATION_ERROR', 'AUTHENTICATION_ERROR', details, httpStatusCode);
    this.name = 'AuthenticationError';
  }
}

export class ContractError extends TriggerXError {
  constructor(message: string, details?: any, httpStatusCode?: HttpStatusCode) {
    super(message, 'CONTRACT_ERROR', 'CONTRACT_ERROR', details, httpStatusCode);
    this.name = 'ContractError';
  }
}

export class ApiError extends TriggerXError {
  constructor(message: string, details?: any, httpStatusCode?: HttpStatusCode) {
    super(message, 'INTERNAL_SERVER_ERROR', 'API_ERROR', details, httpStatusCode);
    this.name = 'ApiError';
  }
}

export class BalanceError extends TriggerXError {
  constructor(message: string, details?: any, httpStatusCode?: HttpStatusCode) {
    super(message, 'BALANCE_ERROR', 'BALANCE_ERROR', details, httpStatusCode);
    this.name = 'BalanceError';
  }
}

export class ConfigurationError extends TriggerXError {
  constructor(message: string, details?: any, httpStatusCode?: HttpStatusCode) {
    super(message, 'CONFIGURATION_ERROR', 'CONFIGURATION_ERROR', details, httpStatusCode);
    this.name = 'ConfigurationError';
  }
}

// Helper function to create error response
export function createErrorResponse(
  error: TriggerXError | Error | unknown,
  fallbackMessage: string = 'An unexpected error occurred'
): { success: false; error: string; errorCode: ApiErrorCode; httpStatusCode?: HttpStatusCode; errorType: 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'API_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN_ERROR'; details?: any } {
  if (error instanceof TriggerXError) {
    return {
      success: false,
      error: error.message,
      errorCode: error.errorCode,
      httpStatusCode: error.httpStatusCode,
      errorType: error.errorType,
      details: error.details
    };
  }
  
  if (error instanceof Error) {
    const httpStatusCode = extractHttpStatusCode(error);
    const errorCode = determineErrorCode(error, httpStatusCode);
    const errorType = getErrorTypeFromCode(errorCode);
    
    return {
      success: false,
      error: error.message,
      errorCode,
      httpStatusCode,
      errorType,
      details: { originalError: error.name }
    };
  }
  
  return {
    success: false,
    error: fallbackMessage,
    errorCode: 'UNKNOWN_ERROR',
    errorType: 'UNKNOWN_ERROR' as const,
    details: { originalError: String(error) }
  };
}

// Helper function to determine error type from error code
function getErrorTypeFromCode(errorCode: ApiErrorCode): 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'AUTHENTICATION_ERROR' | 'CONTRACT_ERROR' | 'API_ERROR' | 'BALANCE_ERROR' | 'CONFIGURATION_ERROR' | 'UNKNOWN_ERROR' {
  if (errorCode === 'VALIDATION_ERROR' || errorCode === 'BAD_REQUEST' || errorCode === 'UNPROCESSABLE_ENTITY') {
    return 'VALIDATION_ERROR';
  }
  if (errorCode === 'NETWORK_ERROR' || errorCode === 'REQUEST_TIMEOUT' || errorCode === 'SERVICE_UNAVAILABLE' || errorCode === 'BAD_GATEWAY' || errorCode === 'GATEWAY_TIMEOUT') {
    return 'NETWORK_ERROR';
  }
  if (errorCode === 'AUTHENTICATION_ERROR' || errorCode === 'UNAUTHORIZED' || errorCode === 'FORBIDDEN' || errorCode === 'PROXY_AUTHENTICATION_REQUIRED') {
    return 'AUTHENTICATION_ERROR';
  }
  if (errorCode === 'CONTRACT_ERROR' || errorCode === 'TRANSACTION_FAILED' || errorCode === 'CONTRACT_REVERT' || errorCode === 'GAS_ESTIMATION_FAILED' || errorCode === 'NONCE_TOO_LOW' || errorCode === 'NONCE_TOO_HIGH' || errorCode === 'REPLACEMENT_UNDERPRICED') {
    return 'CONTRACT_ERROR';
  }
  if (errorCode === 'BALANCE_ERROR' || errorCode === 'INSUFFICIENT_FUNDS') {
    return 'BALANCE_ERROR';
  }
  if (errorCode === 'CONFIGURATION_ERROR') {
    return 'CONFIGURATION_ERROR';
  }
  if (errorCode.includes('API') || errorCode === 'INTERNAL_SERVER_ERROR' || errorCode === 'NOT_IMPLEMENTED' || errorCode === 'NOT_FOUND' || errorCode === 'METHOD_NOT_ALLOWED' || errorCode === 'CONFLICT' || errorCode === 'TOO_MANY_REQUESTS' || errorCode === 'RATE_LIMIT_EXCEEDED') {
    return 'API_ERROR';
  }
  return 'UNKNOWN_ERROR';
}