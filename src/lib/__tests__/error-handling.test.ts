/**
 * Unit tests for Error Handling Module
 */

import {
  ManimGenerationError,
  ErrorType,
  ErrorSeverity,
  analyzeHttpError,
  analyzeNetworkError,
  ErrorLogger,
  RetryHandler,
  CircuitBreaker,
  createErrorResponse
} from '../error-handling';

describe('Error Handling Module', () => {
  describe('ManimGenerationError', () => {
    test('should create error with all properties', () => {
      const error = new ManimGenerationError(
        ErrorType.API_ERROR,
        'Test error message',
        'User-friendly message',
        ErrorSeverity.HIGH,
        true,
        { detail: 'test' },
        'Try again'
      );

      expect(error.type).toBe(ErrorType.API_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.userMessage).toBe('User-friendly message');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.suggestedAction).toBe('Try again');
      expect(error.timestamp).toBeDefined();
    });

    test('should convert to JSON correctly', () => {
      const error = new ManimGenerationError(
        ErrorType.VALIDATION_ERROR,
        'Validation failed',
        'Please check your input'
      );

      const json = error.toJSON();
      expect(json.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(json.message).toBe('Validation failed');
      expect(json.userMessage).toBe('Please check your input');
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('analyzeHttpError', () => {
    test('should analyze 400 Bad Request correctly', () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request'
      } as Response;

      const responseData = {
        error: { message: 'Invalid parameters' }
      };

      const error = analyzeHttpError(mockResponse, responseData);
      expect(error.type).toBe(ErrorType.API_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
      expect(error.message).toContain('Bad Request');
    });

    test('should analyze 401 Unauthorized correctly', () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized'
      } as Response;

      const error = analyzeHttpError(mockResponse);
      expect(error.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(false);
      expect(error.suggestedAction).toContain('API key');
    });

    test('should analyze 429 Rate Limit correctly', () => {
      const mockResponse = {
        status: 429,
        statusText: 'Too Many Requests'
      } as Response;

      const error = analyzeHttpError(mockResponse);
      expect(error.type).toBe(ErrorType.RATE_LIMIT_ERROR);
      expect(error.retryable).toBe(true);
      expect(error.suggestedAction).toContain('Wait a few minutes');
    });

    test('should analyze 500 Server Error correctly', () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error'
      } as Response;

      const error = analyzeHttpError(mockResponse);
      expect(error.type).toBe(ErrorType.API_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });
  });

  describe('analyzeNetworkError', () => {
    test('should analyze timeout error correctly', () => {
      const timeoutError = { name: 'AbortError', message: 'Request timeout' };
      const error = analyzeNetworkError(timeoutError);
      
      expect(error.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toContain('too long');
    });

    test('should analyze connection error correctly', () => {
      const connectionError = { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' };
      const error = analyzeNetworkError(connectionError);
      
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
    });

    test('should analyze generic network error correctly', () => {
      const genericError = { message: 'Network error' };
      const error = analyzeNetworkError(genericError);
      
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.retryable).toBe(true);
    });
  });

  describe('ErrorLogger', () => {
    let logger: ErrorLogger;

    beforeEach(() => {
      logger = ErrorLogger.getInstance();
      logger.clearLogs();
    });

    test('should log errors correctly', () => {
      const error = new ManimGenerationError(
        ErrorType.API_ERROR,
        'Test error',
        'User message'
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      logger.log(error, { operation: 'test', requestId: 'test-123' });
      
      const recentErrors = logger.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].type).toBe(ErrorType.API_ERROR);
      expect(recentErrors[0].requestId).toBe('test-123');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should filter errors by type', () => {
      const apiError = new ManimGenerationError(ErrorType.API_ERROR, 'API error', 'API message');
      const networkError = new ManimGenerationError(ErrorType.NETWORK_ERROR, 'Network error', 'Network message');
      
      logger.log(apiError);
      logger.log(networkError);
      
      const apiErrors = logger.getErrorsByType(ErrorType.API_ERROR);
      expect(apiErrors).toHaveLength(1);
      expect(apiErrors[0].type).toBe(ErrorType.API_ERROR);
    });
  });

  describe('RetryHandler', () => {
    test('should succeed on first attempt', async () => {
      const retryHandler = new RetryHandler(3, 100, 1000);
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryHandler.execute(
        mockOperation,
        { operation: 'test' }
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should retry on retryable errors', async () => {
      const retryHandler = new RetryHandler(2, 10, 100);
      const retryableError = new ManimGenerationError(
        ErrorType.NETWORK_ERROR,
        'Network error',
        'Network message',
        ErrorSeverity.MEDIUM,
        true
      );
      
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');
      
      const result = await retryHandler.execute(
        mockOperation,
        { operation: 'test' }
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('should not retry on non-retryable errors', async () => {
      const retryHandler = new RetryHandler(3, 10, 100);
      const nonRetryableError = new ManimGenerationError(
        ErrorType.AUTHENTICATION_ERROR,
        'Auth error',
        'Auth message',
        ErrorSeverity.HIGH,
        false
      );
      
      const mockOperation = jest.fn().mockRejectedValue(nonRetryableError);
      
      await expect(retryHandler.execute(mockOperation, { operation: 'test' }))
        .rejects.toThrow(nonRetryableError);
      
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should convert unknown errors to ManimGenerationError', async () => {
      const retryHandler = new RetryHandler(1, 10, 100);
      const unknownError = new Error('Unknown error');
      
      const mockOperation = jest.fn().mockRejectedValue(unknownError);
      
      await expect(retryHandler.execute(mockOperation, { operation: 'test' }))
        .rejects.toBeInstanceOf(ManimGenerationError);
    });
  });

  describe('CircuitBreaker', () => {
    test('should allow operations when circuit is closed', async () => {
      const circuitBreaker = new CircuitBreaker(3, 1000);
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    test('should open circuit after threshold failures', async () => {
      const circuitBreaker = new CircuitBreaker(2, 1000);
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failure'));
      
      // First two failures should be allowed
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
      
      // Third attempt should be blocked by open circuit
      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toBeInstanceOf(ManimGenerationError);
      
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    test('should reset failure count on success', async () => {
      const circuitBreaker = new CircuitBreaker(3, 1000);
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState().failureCount).toBe(0);
    });
  });

  describe('createErrorResponse', () => {
    test('should create proper error response structure', () => {
      const error = new ManimGenerationError(
        ErrorType.VALIDATION_ERROR,
        'Validation failed',
        'Please check your input',
        ErrorSeverity.MEDIUM,
        false,
        undefined,
        'Fix your input'
      );
      
      const response = createErrorResponse(error, 'test-123');
      
      expect(response.status).toBe(400);
      expect(response.error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(response.error.userMessage).toBe('Please check your input');
      expect(response.error.retryable).toBe(false);
      expect(response.error.suggestedAction).toBe('Fix your input');
      expect(response.error.requestId).toBe('test-123');
    });

    test('should map error types to correct HTTP status codes', () => {
      const authError = new ManimGenerationError(ErrorType.AUTHENTICATION_ERROR, 'Auth', 'Auth');
      const rateLimitError = new ManimGenerationError(ErrorType.RATE_LIMIT_ERROR, 'Rate', 'Rate');
      const validationError = new ManimGenerationError(ErrorType.VALIDATION_ERROR, 'Valid', 'Valid');
      
      expect(createErrorResponse(authError).status).toBe(401);
      expect(createErrorResponse(rateLimitError).status).toBe(429);
      expect(createErrorResponse(validationError).status).toBe(400);
    });
  });
}); 