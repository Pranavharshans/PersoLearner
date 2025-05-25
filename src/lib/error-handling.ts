/**
 * Error Handling Module for OpenRouter API Integration
 * 
 * This module provides comprehensive error handling, logging, and recovery
 * mechanisms for the Manim script generation system.
 */

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  MODEL_ERROR = 'MODEL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  userMessage: string;
  retryable: boolean;
  suggestedAction?: string;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Custom error class for application-specific errors
 */
export class ManimGenerationError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly suggestedAction?: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = false,
    details?: any,
    suggestedAction?: string
  ) {
    super(message);
    this.name = 'ManimGenerationError';
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage;
    this.retryable = retryable;
    this.details = details;
    this.suggestedAction = suggestedAction;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): AppError {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      userMessage: this.userMessage,
      retryable: this.retryable,
      suggestedAction: this.suggestedAction
    };
  }
}

/**
 * Analyzes HTTP response errors and creates appropriate error objects
 */
export function analyzeHttpError(response: Response, responseData?: any): ManimGenerationError {
  const status = response.status;
  const statusText = response.statusText;

  switch (status) {
    case 400:
      return new ManimGenerationError(
        ErrorType.API_ERROR,
        `Bad Request: ${responseData?.error?.message || statusText}`,
        'There was an issue with your request. Please check your input and try again.',
        ErrorSeverity.MEDIUM,
        false,
        { status, responseData },
        'Verify your topic and settings are valid'
      );

    case 401:
      return new ManimGenerationError(
        ErrorType.AUTHENTICATION_ERROR,
        `Authentication failed: ${responseData?.error?.message || statusText}`,
        'Authentication failed. Please check your API configuration.',
        ErrorSeverity.HIGH,
        false,
        { status, responseData },
        'Check your OpenRouter API key configuration'
      );

    case 403:
      return new ManimGenerationError(
        ErrorType.AUTHENTICATION_ERROR,
        `Access forbidden: ${responseData?.error?.message || statusText}`,
        'Access denied. Your API key may not have the required permissions.',
        ErrorSeverity.HIGH,
        false,
        { status, responseData },
        'Verify your API key has the correct permissions'
      );

    case 429:
      return new ManimGenerationError(
        ErrorType.RATE_LIMIT_ERROR,
        `Rate limit exceeded: ${responseData?.error?.message || statusText}`,
        'Too many requests. Please wait a moment before trying again.',
        ErrorSeverity.MEDIUM,
        true,
        { status, responseData },
        'Wait a few minutes before making another request'
      );

    case 500:
    case 502:
    case 503:
    case 504:
      return new ManimGenerationError(
        ErrorType.API_ERROR,
        `Server error: ${status} ${statusText}`,
        'The AI service is temporarily unavailable. Please try again in a few minutes.',
        ErrorSeverity.HIGH,
        true,
        { status, responseData },
        'Try again in a few minutes'
      );

    default:
      return new ManimGenerationError(
        ErrorType.API_ERROR,
        `HTTP ${status}: ${responseData?.error?.message || statusText}`,
        'An unexpected error occurred. Please try again.',
        ErrorSeverity.MEDIUM,
        true,
        { status, responseData },
        'Try again or contact support if the issue persists'
      );
  }
}

/**
 * Analyzes network errors and creates appropriate error objects
 */
export function analyzeNetworkError(error: any): ManimGenerationError {
  if (error.name === 'AbortError') {
    return new ManimGenerationError(
      ErrorType.TIMEOUT_ERROR,
      'Request timeout',
      'The request took too long to complete. Please try again.',
      ErrorSeverity.MEDIUM,
      true,
      { originalError: error.message },
      'Try again with a simpler topic or check your internet connection'
    );
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new ManimGenerationError(
      ErrorType.NETWORK_ERROR,
      'Network connection failed',
      'Unable to connect to the AI service. Please check your internet connection.',
      ErrorSeverity.HIGH,
      true,
      { originalError: error.message, code: error.code },
      'Check your internet connection and try again'
    );
  }

  return new ManimGenerationError(
    ErrorType.NETWORK_ERROR,
    `Network error: ${error.message}`,
    'A network error occurred. Please check your connection and try again.',
    ErrorSeverity.MEDIUM,
    true,
    { originalError: error.message },
    'Check your internet connection and try again'
  );
}

/**
 * Enhanced error logger with structured logging
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: AppError[] = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: ManimGenerationError, context?: ErrorContext): void {
    const errorLog: AppError = {
      ...error.toJSON(),
      requestId: context?.requestId
    };

    this.logs.push(errorLog);

    // Console logging with appropriate level
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = this.formatLogMessage(error, context);

    switch (logLevel) {
      case 'error':
        console.error('🚨', logMessage, error.details);
        break;
      case 'warn':
        console.warn('⚠️', logMessage, error.details);
        break;
      case 'info':
        console.info('ℹ️', logMessage, error.details);
        break;
      default:
        console.log('📝', logMessage, error.details);
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(errorLog, context);
    }
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  private formatLogMessage(error: ManimGenerationError, context?: ErrorContext): string {
    const parts = [
      `[${error.type}]`,
      error.message
    ];

    if (context?.operation) {
      parts.unshift(`[${context.operation}]`);
    }

    if (context?.requestId) {
      parts.push(`(Request: ${context.requestId})`);
    }

    return parts.join(' ');
  }

  private sendToExternalLogger(error: AppError, context?: ErrorContext): void {
    // Placeholder for external logging service integration
    // e.g., Sentry, LogRocket, DataDog, etc.
    console.log('📤 Would send to external logger:', { error, context });
  }

  getRecentErrors(limit: number = 10): AppError[] {
    return this.logs.slice(-limit);
  }

  getErrorsByType(type: ErrorType): AppError[] {
    return this.logs.filter(log => log.type === type);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryHandler {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;

  constructor(maxRetries: number = 3, baseDelay: number = 1000, maxDelay: number = 10000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    shouldRetry?: (error: ManimGenerationError) => boolean
  ): Promise<T> {
    let lastError: ManimGenerationError;
    const logger = ErrorLogger.getInstance();

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const appError = this.convertToAppError(error);
        lastError = appError;

        logger.log(appError, { ...context, metadata: { attempt, maxRetries: this.maxRetries } });

        // Don't retry on last attempt or if error is not retryable
        if (attempt > this.maxRetries || !appError.retryable) {
          break;
        }

        // Check custom retry condition
        if (shouldRetry && !shouldRetry(appError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt - 1),
          this.maxDelay
        );

        console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private convertToAppError(error: any): ManimGenerationError {
    if (error instanceof ManimGenerationError) {
      return error;
    }

    if (error instanceof Error) {
      return new ManimGenerationError(
        ErrorType.UNKNOWN_ERROR,
        error.message,
        'An unexpected error occurred. Please try again.',
        ErrorSeverity.MEDIUM,
        true,
        { originalError: error.message, stack: error.stack }
      );
    }

    return new ManimGenerationError(
      ErrorType.UNKNOWN_ERROR,
      'Unknown error occurred',
      'An unexpected error occurred. Please try again.',
      ErrorSeverity.MEDIUM,
      true,
      { originalError: error }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker: Attempting recovery');
      } else {
        throw new ManimGenerationError(
          ErrorType.API_ERROR,
          'Circuit breaker is open',
          'The service is temporarily unavailable due to repeated failures. Please try again later.',
          ErrorSeverity.HIGH,
          true,
          { circuitBreakerState: this.state },
          'Wait a few minutes before trying again'
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log('✅ Circuit breaker: Operation successful, circuit closed');
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('🚫 Circuit breaker: Threshold exceeded, circuit opened');
    }
  }

  getState(): { state: string; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
    console.log('🔄 Circuit breaker: Manually reset');
  }
}

/**
 * Utility function to create user-friendly error responses for API routes
 */
export function createErrorResponse(error: ManimGenerationError, requestId?: string): {
  error: {
    type: string;
    message: string;
    userMessage: string;
    retryable: boolean;
    suggestedAction?: string;
    requestId?: string;
    timestamp: string;
  };
  status: number;
} {
  const status = getHttpStatusFromErrorType(error.type);

  return {
    error: {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      suggestedAction: error.suggestedAction,
      requestId,
      timestamp: error.timestamp
    },
    status
  };
}

/**
 * Maps error types to appropriate HTTP status codes
 */
function getHttpStatusFromErrorType(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.AUTHENTICATION_ERROR:
      return 401;
    case ErrorType.RATE_LIMIT_ERROR:
      return 429;
    case ErrorType.VALIDATION_ERROR:
      return 400;
    case ErrorType.QUOTA_EXCEEDED:
      return 402;
    case ErrorType.TIMEOUT_ERROR:
      return 408;
    case ErrorType.NETWORK_ERROR:
    case ErrorType.API_ERROR:
      return 502;
    case ErrorType.MODEL_ERROR:
      return 503;
    default:
      return 500;
  }
} 