/**
 * Unit tests for Rate Limiting Module
 */

import {
  TokenBucketRateLimiter,
  SlidingWindowRateLimiter,
  AdaptiveRateLimiter,
  RateLimiterManager,
  createRateLimiterConfigs
} from '../rate-limiter';

describe('Rate Limiting Module', () => {
  describe('TokenBucketRateLimiter', () => {
    test('should allow requests within limit', async () => {
      const limiter = new TokenBucketRateLimiter({
        maxRequests: 5,
        windowMs: 60000
      });

      for (let i = 0; i < 5; i++) {
        const result = await limiter.checkLimit('test-user');
        expect(result.allowed).toBe(true);
        expect(result.info.remaining).toBe(4 - i);
      }
    });

    test('should deny requests when limit exceeded', async () => {
      const limiter = new TokenBucketRateLimiter({
        maxRequests: 2,
        windowMs: 60000
      });

      // Use up the limit
      await limiter.checkLimit('test-user');
      await limiter.checkLimit('test-user');

      // This should be denied
      const result = await limiter.checkLimit('test-user');
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    test('should call onLimitReached callback', async () => {
      const onLimitReached = jest.fn();
      const limiter = new TokenBucketRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        onLimitReached
      });

      await limiter.checkLimit('test-user');
      await limiter.checkLimit('test-user'); // This should trigger callback

      expect(onLimitReached).toHaveBeenCalledWith('test-user', expect.any(Number));
    });

    test('should use custom key generator', async () => {
      const limiter = new TokenBucketRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        keyGenerator: (id) => `custom:${id}`
      });

      // Use up limit for user1
      await limiter.checkLimit('user1');
      const user1Result = await limiter.checkLimit('user1');
      expect(user1Result.allowed).toBe(false);

      // user2 should still be allowed (different key)
      const user2Result = await limiter.checkLimit('user2');
      expect(user2Result.allowed).toBe(true);
    });

    test('should reset limits correctly', async () => {
      const limiter = new TokenBucketRateLimiter({
        maxRequests: 1,
        windowMs: 60000
      });

      await limiter.checkLimit('test-user');
      let result = await limiter.checkLimit('test-user');
      expect(result.allowed).toBe(false);

      limiter.reset('test-user');
      result = await limiter.checkLimit('test-user');
      expect(result.allowed).toBe(true);
    });

    test('should track remaining requests correctly', () => {
      const limiter = new TokenBucketRateLimiter({
        maxRequests: 5,
        windowMs: 60000
      });

      expect(limiter.getRemainingRequests('test-user')).toBe(5);
    });
  });

  describe('SlidingWindowRateLimiter', () => {
    test('should allow requests within sliding window', async () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 3,
        windowMs: 1000 // 1 second
      });

      for (let i = 0; i < 3; i++) {
        const result = await limiter.checkLimit('test-user');
        expect(result.allowed).toBe(true);
        limiter.recordRequest('test-user', true);
      }
    });

    test('should deny requests when window limit exceeded', async () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 2,
        windowMs: 1000
      });

      // Fill the window
      await limiter.checkLimit('test-user');
      limiter.recordRequest('test-user', true);
      await limiter.checkLimit('test-user');
      limiter.recordRequest('test-user', true);

      // This should be denied
      const result = await limiter.checkLimit('test-user');
      expect(result.allowed).toBe(false);
    });

    test('should allow requests after window slides', async () => {
      const limiter = new SlidingWindowRateLimiter({
        maxRequests: 1,
        windowMs: 100 // 100ms
      });

      await limiter.checkLimit('test-user');
      limiter.recordRequest('test-user', true);

      let result = await limiter.checkLimit('test-user');
      expect(result.allowed).toBe(false);

      // Wait for window to slide
      await new Promise(resolve => setTimeout(resolve, 150));

      result = await limiter.checkLimit('test-user');
      expect(result.allowed).toBe(true);
    });
  });

  describe('AdaptiveRateLimiter', () => {
    test('should start with base limit', async () => {
      const limiter = new AdaptiveRateLimiter({
        maxRequests: 10,
        windowMs: 60000
      });

      expect(limiter.getCurrentLimit()).toBe(10);
    });

    test('should track success and error rates', () => {
      const limiter = new AdaptiveRateLimiter({
        maxRequests: 10,
        windowMs: 60000
      });

      limiter.recordRequest('test-user', true);
      limiter.recordRequest('test-user', false);

      const stats = limiter.getStats();
      expect(stats.successCount).toBe(1);
      expect(stats.errorCount).toBe(1);
      expect(stats.errorRate).toBe(0.5);
    });

    test('should reset stats correctly', () => {
      const limiter = new AdaptiveRateLimiter({
        maxRequests: 10,
        windowMs: 60000
      });

      limiter.recordRequest('test-user', true);
      limiter.recordRequest('test-user', false);

      limiter.reset();

      const stats = limiter.getStats();
      expect(stats.successCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.currentLimit).toBe(10); // Back to base
    });
  });

  describe('RateLimiterManager', () => {
    test('should manage multiple limiters', async () => {
      const manager = new RateLimiterManager();
      
      const userLimiter = new TokenBucketRateLimiter({
        maxRequests: 5,
        windowMs: 60000
      });
      
      const apiLimiter = new TokenBucketRateLimiter({
        maxRequests: 100,
        windowMs: 60000
      });

      manager.addLimiter('user', userLimiter);
      manager.addLimiter('api', apiLimiter);

      const userResult = await manager.checkLimit('user', 'test-user');
      const apiResult = await manager.checkLimit('api', 'test-api');

      expect(userResult.allowed).toBe(true);
      expect(apiResult.allowed).toBe(true);
    });

    test('should check global limiter first', async () => {
      const globalLimiter = new TokenBucketRateLimiter({
        maxRequests: 1,
        windowMs: 60000
      });

      const manager = new RateLimiterManager({
        maxRequests: 1,
        windowMs: 60000
      });

      // Use up global limit
      await manager.checkLimit('any', 'global');
      
      const result = await manager.checkLimit('any', 'global');
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Global rate limit exceeded');
    });

    test('should record requests for all applicable limiters', () => {
      const manager = new RateLimiterManager();
      
      const userLimiter = new TokenBucketRateLimiter({
        maxRequests: 5,
        windowMs: 60000
      });

      manager.addLimiter('user', userLimiter);

      // This should not throw
      manager.recordRequest('user', 'test-user', true);
      manager.recordRequest('nonexistent', 'test-user', true);
    });

    test('should return remaining requests correctly', () => {
      const manager = new RateLimiterManager();
      
      const userLimiter = new TokenBucketRateLimiter({
        maxRequests: 5,
        windowMs: 60000
      });

      manager.addLimiter('user', userLimiter);

      expect(manager.getRemainingRequests('user', 'test-user')).toBe(5);
      expect(manager.getRemainingRequests('nonexistent', 'test-user')).toBe(Infinity);
    });

    test('should reset specific or all limiters', async () => {
      const manager = new RateLimiterManager();
      
      const userLimiter = new TokenBucketRateLimiter({
        maxRequests: 1,
        windowMs: 60000
      });

      manager.addLimiter('user', userLimiter);

      // Use up limit
      await manager.checkLimit('user', 'test-user');
      let result = await manager.checkLimit('user', 'test-user');
      expect(result.allowed).toBe(false);

      // Reset specific limiter
      manager.reset('user', 'test-user');
      result = await manager.checkLimit('user', 'test-user');
      expect(result.allowed).toBe(true);
    });
  });

  describe('createRateLimiterConfigs', () => {
    test('should create OpenRouter config', () => {
      const config = createRateLimiterConfigs.openRouter();
      
      expect(config.maxRequests).toBe(200);
      expect(config.windowMs).toBe(60000);
      expect(config.keyGenerator).toBeDefined();
      expect(config.onLimitReached).toBeDefined();
    });

    test('should create per-user config with custom limit', () => {
      const config = createRateLimiterConfigs.perUser(20);
      
      expect(config.maxRequests).toBe(20);
      expect(config.windowMs).toBe(60000);
    });

    test('should create per-IP config', () => {
      const config = createRateLimiterConfigs.perIP(50);
      
      expect(config.maxRequests).toBe(50);
      expect(config.windowMs).toBe(60000);
    });

    test('should create burst protection config', () => {
      const config = createRateLimiterConfigs.burstProtection();
      
      expect(config.maxRequests).toBe(5);
      expect(config.windowMs).toBe(10000);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex rate limiting scenario', async () => {
      const manager = new RateLimiterManager({
        maxRequests: 1000,
        windowMs: 60000
      });

      // Add burst protection
      manager.addLimiter('burst', new TokenBucketRateLimiter(
        createRateLimiterConfigs.burstProtection()
      ));

      // Add user limits
      manager.addLimiter('user', new TokenBucketRateLimiter(
        createRateLimiterConfigs.perUser(10)
      ));

      // Add API limits
      manager.addLimiter('api', new AdaptiveRateLimiter({
        ...createRateLimiterConfigs.openRouter(),
        minLimit: 50,
        maxLimit: 500
      }));

      // Test burst protection
      for (let i = 0; i < 5; i++) {
        const result = await manager.checkLimit('burst', 'user1');
        expect(result.allowed).toBe(true);
      }

      // This should be blocked by burst protection
      const burstResult = await manager.checkLimit('burst', 'user1');
      expect(burstResult.allowed).toBe(false);

      // But user and API limits should still allow requests
      const userResult = await manager.checkLimit('user', 'user1');
      const apiResult = await manager.checkLimit('api', 'user1');
      
      expect(userResult.allowed).toBe(true);
      expect(apiResult.allowed).toBe(true);
    });

    test('should handle rate limiter cleanup', () => {
      const limiter = new TokenBucketRateLimiter({
        maxRequests: 5,
        windowMs: 100 // Very short window for testing
      });

      // This should not throw
      limiter.cleanup();
    });
  });
}); 