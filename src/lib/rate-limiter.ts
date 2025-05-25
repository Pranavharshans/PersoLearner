/**
 * Rate Limiting Module for API Calls
 * 
 * This module provides comprehensive rate limiting functionality to prevent
 * API abuse and ensure compliance with service provider limits.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (identifier: string, resetTime: number) => void;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
  error?: string;
}

/**
 * Token bucket rate limiter implementation
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id) => id,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(identifier);
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = new TokenBucket(this.config.maxRequests, this.config.windowMs);
      this.buckets.set(key, bucket);
    }

    const canProceed = bucket.consume();
    const info = bucket.getInfo();

    if (!canProceed && this.config.onLimitReached) {
      this.config.onLimitReached(identifier, info.resetTime);
    }

    return {
      allowed: canProceed,
      info,
      error: canProceed ? undefined : 'Rate limit exceeded'
    };
  }

  recordRequest(identifier: string, success: boolean): void {
    if (this.config.skipSuccessfulRequests && success) return;
    if (this.config.skipFailedRequests && !success) return;

    const key = this.config.keyGenerator!(identifier);
    const bucket = this.buckets.get(key);
    if (bucket) {
      bucket.recordRequest();
    }
  }

  getRemainingRequests(identifier: string): number {
    const key = this.config.keyGenerator!(identifier);
    const bucket = this.buckets.get(key);
    return bucket ? bucket.getInfo().remaining : this.config.maxRequests;
  }

  reset(identifier?: string): void {
    if (identifier) {
      const key = this.config.keyGenerator!(identifier);
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }

  // Cleanup old buckets periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.getInfo().resetTime <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly windowMs: number;

  constructor(capacity: number, windowMs: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.windowMs = windowMs;
    this.refillRate = capacity / windowMs; // tokens per millisecond
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getInfo(): RateLimitInfo {
    this.refill();
    const resetTime = this.lastRefill + (this.capacity - this.tokens) / this.refillRate;
    
    return {
      limit: this.capacity,
      remaining: Math.floor(this.tokens),
      resetTime: Math.ceil(resetTime),
      retryAfter: this.tokens === 0 ? Math.ceil((1 / this.refillRate) / 1000) : undefined
    };
  }

  recordRequest(): void {
    // For tracking purposes, doesn't affect token count
  }
}

/**
 * Sliding window rate limiter implementation
 */
export class SlidingWindowRateLimiter {
  private windows: Map<string, SlidingWindow> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id) => id,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(identifier);
    let window = this.windows.get(key);

    if (!window) {
      window = new SlidingWindow(this.config.maxRequests, this.config.windowMs);
      this.windows.set(key, window);
    }

    const canProceed = window.canMakeRequest();
    const info = window.getInfo();

    if (!canProceed && this.config.onLimitReached) {
      this.config.onLimitReached(identifier, info.resetTime);
    }

    return {
      allowed: canProceed,
      info,
      error: canProceed ? undefined : 'Rate limit exceeded'
    };
  }

  recordRequest(identifier: string, success: boolean): void {
    if (this.config.skipSuccessfulRequests && success) return;
    if (this.config.skipFailedRequests && !success) return;

    const key = this.config.keyGenerator!(identifier);
    const window = this.windows.get(key);
    if (window) {
      window.addRequest();
    }
  }

  getRemainingRequests(identifier: string): number {
    const key = this.config.keyGenerator!(identifier);
    const window = this.windows.get(key);
    return window ? window.getInfo().remaining : this.config.maxRequests;
  }

  reset(identifier?: string): void {
    if (identifier) {
      const key = this.config.keyGenerator!(identifier);
      this.windows.delete(key);
    } else {
      this.windows.clear();
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows.entries()) {
      if (window.getInfo().resetTime <= now) {
        this.windows.delete(key);
      }
    }
  }
}

/**
 * Sliding window implementation
 */
class SlidingWindow {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    this.cleanup();
    return this.requests.length < this.maxRequests;
  }

  addRequest(): void {
    this.cleanup();
    if (this.requests.length < this.maxRequests) {
      this.requests.push(Date.now());
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > cutoff);
  }

  getInfo(): RateLimitInfo {
    this.cleanup();
    const now = Date.now();
    const oldestRequest = this.requests[0];
    const resetTime = oldestRequest ? oldestRequest + this.windowMs : now;

    return {
      limit: this.maxRequests,
      remaining: this.maxRequests - this.requests.length,
      resetTime,
      retryAfter: this.requests.length >= this.maxRequests ? 
        Math.ceil((resetTime - now) / 1000) : undefined
    };
  }
}

/**
 * Adaptive rate limiter that adjusts based on API responses
 */
export class AdaptiveRateLimiter {
  private baseLimiter: TokenBucketRateLimiter;
  private currentLimit: number;
  private readonly baseLimit: number;
  private readonly minLimit: number;
  private readonly maxLimit: number;
  private successCount: number = 0;
  private errorCount: number = 0;
  private lastAdjustment: number = Date.now();
  private readonly adjustmentInterval: number = 60000; // 1 minute

  constructor(config: RateLimitConfig & {
    minLimit?: number;
    maxLimit?: number;
    adjustmentInterval?: number;
  }) {
    this.baseLimit = config.maxRequests;
    this.currentLimit = config.maxRequests;
    this.minLimit = config.minLimit || Math.floor(config.maxRequests * 0.1);
    this.maxLimit = config.maxLimit || config.maxRequests * 2;
    this.adjustmentInterval = config.adjustmentInterval || 60000;

    this.baseLimiter = new TokenBucketRateLimiter({
      ...config,
      maxRequests: this.currentLimit
    });
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    this.adjustLimitIfNeeded();
    return this.baseLimiter.checkLimit(identifier);
  }

  recordRequest(identifier: string, success: boolean): void {
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
    
    this.baseLimiter.recordRequest(identifier, success);
  }

  private adjustLimitIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastAdjustment < this.adjustmentInterval) {
      return;
    }

    const totalRequests = this.successCount + this.errorCount;
    if (totalRequests === 0) return;

    const errorRate = this.errorCount / totalRequests;
    let newLimit = this.currentLimit;

    if (errorRate > 0.1) { // More than 10% errors
      newLimit = Math.max(this.minLimit, Math.floor(this.currentLimit * 0.8));
      console.log(`🔽 Reducing rate limit due to high error rate (${(errorRate * 100).toFixed(1)}%): ${this.currentLimit} → ${newLimit}`);
    } else if (errorRate < 0.02 && this.successCount > 10) { // Less than 2% errors with good volume
      newLimit = Math.min(this.maxLimit, Math.floor(this.currentLimit * 1.2));
      console.log(`🔼 Increasing rate limit due to low error rate (${(errorRate * 100).toFixed(1)}%): ${this.currentLimit} → ${newLimit}`);
    }

    if (newLimit !== this.currentLimit) {
      this.currentLimit = newLimit;
      this.baseLimiter = new TokenBucketRateLimiter({
        maxRequests: this.currentLimit,
        windowMs: 60000 // 1 minute window
      });
    }

    // Reset counters
    this.successCount = 0;
    this.errorCount = 0;
    this.lastAdjustment = now;
  }

  getCurrentLimit(): number {
    return this.currentLimit;
  }

  getStats(): {
    currentLimit: number;
    baseLimit: number;
    successCount: number;
    errorCount: number;
    errorRate: number;
  } {
    const totalRequests = this.successCount + this.errorCount;
    return {
      currentLimit: this.currentLimit,
      baseLimit: this.baseLimit,
      successCount: this.successCount,
      errorCount: this.errorCount,
      errorRate: totalRequests > 0 ? this.errorCount / totalRequests : 0
    };
  }

  reset(identifier?: string): void {
    this.baseLimiter.reset(identifier);
    this.successCount = 0;
    this.errorCount = 0;
    this.currentLimit = this.baseLimit;
    this.lastAdjustment = Date.now();
  }
}

/**
 * Rate limiter manager for different API endpoints
 */
export class RateLimiterManager {
  private limiters: Map<string, TokenBucketRateLimiter | AdaptiveRateLimiter> = new Map();
  private globalLimiter?: TokenBucketRateLimiter;

  constructor(globalConfig?: RateLimitConfig) {
    if (globalConfig) {
      this.globalLimiter = new TokenBucketRateLimiter(globalConfig);
    }

    // Start cleanup interval
    setInterval(() => this.cleanup(), 300000); // 5 minutes
  }

  addLimiter(
    endpoint: string, 
    limiter: TokenBucketRateLimiter | AdaptiveRateLimiter
  ): void {
    this.limiters.set(endpoint, limiter);
  }

  async checkLimit(endpoint: string, identifier: string): Promise<RateLimitResult> {
    // Check global limit first
    if (this.globalLimiter) {
      const globalResult = await this.globalLimiter.checkLimit('global');
      if (!globalResult.allowed) {
        return {
          ...globalResult,
          error: 'Global rate limit exceeded'
        };
      }
    }

    // Check endpoint-specific limit
    const limiter = this.limiters.get(endpoint);
    if (limiter) {
      return limiter.checkLimit(identifier);
    }

    // No limiter configured for this endpoint
    return {
      allowed: true,
      info: {
        limit: Infinity,
        remaining: Infinity,
        resetTime: Date.now() + 3600000 // 1 hour from now
      }
    };
  }

  recordRequest(endpoint: string, identifier: string, success: boolean): void {
    if (this.globalLimiter) {
      this.globalLimiter.recordRequest('global', success);
    }

    const limiter = this.limiters.get(endpoint);
    if (limiter) {
      limiter.recordRequest(identifier, success);
    }
  }

  getRemainingRequests(endpoint: string, identifier: string): number {
    const limiter = this.limiters.get(endpoint);
    return limiter ? limiter.getRemainingRequests(identifier) : Infinity;
  }

  getStats(endpoint?: string): any {
    if (endpoint) {
      const limiter = this.limiters.get(endpoint);
      if (limiter instanceof AdaptiveRateLimiter) {
        return limiter.getStats();
      }
    }

    // Return stats for all adaptive limiters
    const stats: Record<string, any> = {};
    for (const [ep, limiter] of this.limiters.entries()) {
      if (limiter instanceof AdaptiveRateLimiter) {
        stats[ep] = limiter.getStats();
      }
    }
    return stats;
  }

  reset(endpoint?: string, identifier?: string): void {
    if (endpoint) {
      const limiter = this.limiters.get(endpoint);
      if (limiter) {
        limiter.reset(identifier);
      }
    } else {
      // Reset all limiters
      for (const limiter of this.limiters.values()) {
        limiter.reset(identifier);
      }
      if (this.globalLimiter) {
        this.globalLimiter.reset(identifier);
      }
    }
  }

  private cleanup(): void {
    for (const limiter of this.limiters.values()) {
      if ('cleanup' in limiter) {
        limiter.cleanup();
      }
    }
    if (this.globalLimiter) {
      this.globalLimiter.cleanup();
    }
  }
}

/**
 * Utility function to create rate limiter configurations for common scenarios
 */
export const createRateLimiterConfigs = {
  // OpenRouter API limits
  openRouter: (): RateLimitConfig => ({
    maxRequests: 200, // Conservative limit
    windowMs: 60000, // 1 minute
    keyGenerator: (id) => `openrouter:${id}`,
    onLimitReached: (id, resetTime) => {
      console.warn(`🚫 OpenRouter rate limit reached for ${id}. Reset at ${new Date(resetTime).toISOString()}`);
    }
  }),

  // Per-user limits
  perUser: (maxRequests: number = 10): RateLimitConfig => ({
    maxRequests,
    windowMs: 60000, // 1 minute
    keyGenerator: (id) => `user:${id}`,
    onLimitReached: (id, resetTime) => {
      console.warn(`🚫 User rate limit reached for ${id}. Reset at ${new Date(resetTime).toISOString()}`);
    }
  }),

  // Per-IP limits
  perIP: (maxRequests: number = 100): RateLimitConfig => ({
    maxRequests,
    windowMs: 60000, // 1 minute
    keyGenerator: (id) => `ip:${id}`,
    onLimitReached: (id, resetTime) => {
      console.warn(`🚫 IP rate limit reached for ${id}. Reset at ${new Date(resetTime).toISOString()}`);
    }
  }),

  // Burst protection
  burstProtection: (): RateLimitConfig => ({
    maxRequests: 5,
    windowMs: 10000, // 10 seconds
    keyGenerator: (id) => `burst:${id}`,
    onLimitReached: (id, resetTime) => {
      console.warn(`🚫 Burst protection triggered for ${id}. Reset at ${new Date(resetTime).toISOString()}`);
    }
  })
};

/**
 * Default rate limiter instance for the application
 */
export const defaultRateLimiter = new RateLimiterManager({
  maxRequests: 1000,
  windowMs: 60000, // 1 minute global limit
  keyGenerator: () => 'global'
});

// Add OpenRouter-specific limiter
defaultRateLimiter.addLimiter(
  'openrouter',
  new AdaptiveRateLimiter({
    ...createRateLimiterConfigs.openRouter(),
    minLimit: 50,
    maxLimit: 500,
    adjustmentInterval: 120000 // 2 minutes
  })
);

// Add user-specific limiter
defaultRateLimiter.addLimiter(
  'user',
  new TokenBucketRateLimiter(createRateLimiterConfigs.perUser(20))
);

// Add burst protection
defaultRateLimiter.addLimiter(
  'burst',
  new TokenBucketRateLimiter(createRateLimiterConfigs.burstProtection())
); 