import { generatePrompt, generateUserPrompt, analyzeTopic } from './topic-analysis';
import { validateManimScript, autoFixScript } from './script-validation';
import { 
  ManimGenerationError, 
  ErrorType, 
  ErrorSeverity, 
  analyzeHttpError, 
  analyzeNetworkError,
  ErrorLogger,
  RetryHandler,
  CircuitBreaker,
  ErrorContext
} from './error-handling';
import {
  ModelConfigurationManager,
  ModelPerformanceTracker,
  getModelById
} from './model-management';
import {
  defaultRateLimiter,
  RateLimiterManager,
  RateLimitResult
} from './rate-limiter';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  provider?: string;
}

interface ScriptGenerationResult {
  script: string;
  narration: string;
  metadata: {
    model: string;
    provider?: string;
    temperature: number;
    tokenUsage: any;
    requestId: string;
    validation: any;
    analysis: any;
    generatedAt: string;
  };
}

export class OpenRouterClient {
  private config: OpenRouterConfig;
  private logger: ErrorLogger;
  private retryHandler: RetryHandler;
  private circuitBreaker: CircuitBreaker;
  private modelConfigManager: ModelConfigurationManager;
  private performanceTracker: ModelPerformanceTracker;
  private rateLimiter: RateLimiterManager;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.logger = ErrorLogger.getInstance();
    this.retryHandler = new RetryHandler();
    this.circuitBreaker = new CircuitBreaker();
    this.modelConfigManager = ModelConfigurationManager.getInstance();
    this.performanceTracker = ModelPerformanceTracker.getInstance();
    this.rateLimiter = defaultRateLimiter;

    console.log('🤖 OpenRouter Client initialized with enhanced rate limiting and error handling');
    console.log(`📊 Model: ${this.config.model}`);
    console.log(`🔧 Provider: ${this.config.provider || 'default'}`);
    console.log(`🌡️ Temperature: ${this.config.temperature}`);
    console.log(`📏 Max Tokens: ${this.config.maxTokens}`);
  }

  async generateScript(
    topic: string,
    complexity: 'beginner' | 'intermediate' | 'advanced',
    duration: number,
    style: 'mathematical' | 'scientific' | 'general',
    includeNarration: boolean = false
  ): Promise<ScriptGenerationResult> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`\n🚀 [${requestId}] Starting script generation`);
    console.log(`📝 Topic: "${topic}"`);
    console.log(`🎯 Complexity: ${complexity}`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log(`🎨 Style: ${style}`);
    console.log(`🗣️ Narration: ${includeNarration ? 'Yes' : 'No'}`);

    try {
      // Check rate limits before proceeding
      const rateLimitCheck = await this.checkRateLimits(requestId);
      if (!rateLimitCheck.allowed) {
        throw new ManimGenerationError(
          ErrorType.RATE_LIMIT_ERROR,
          rateLimitCheck.error || 'Rate limit exceeded',
          'Too many requests. Please wait before trying again.',
          ErrorSeverity.HIGH,
          true,
          { 
            requestId,
            rateLimitInfo: rateLimitCheck.info,
            retryAfter: rateLimitCheck.info.retryAfter
          },
          'Wait a few minutes before making another request'
        );
      }

      console.log(`✅ [${requestId}] Rate limit check passed (${rateLimitCheck.info.remaining}/${rateLimitCheck.info.limit} remaining)`);

      // Generate the script with retry logic and circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        return await this.retryHandler.execute(
          async () => {
            return await this.performScriptGeneration(
              topic, complexity, duration, style, includeNarration, requestId
            );
          },
          { operation: 'generateScript', requestId },
          (error) => error.retryable
        );
      });

      // Record successful request
      const responseTime = Date.now() - startTime;
      this.recordSuccessfulRequest(requestId, responseTime, result);

      console.log(`✅ [${requestId}] Script generation completed successfully in ${responseTime}ms`);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordFailedRequest(requestId, error, responseTime);
      
      if (error instanceof ManimGenerationError) {
        throw error;
      }
      
      // Convert unknown errors to ManimGenerationError
      throw new ManimGenerationError(
        ErrorType.UNKNOWN_ERROR,
        error instanceof Error ? error.message : 'Unknown error occurred',
        'An unexpected error occurred. Please try again.',
        ErrorSeverity.HIGH,
        false,
        { requestId, originalError: error }
      );
    }
  }

  private async checkRateLimits(requestId: string): Promise<RateLimitResult> {
    // Check multiple rate limit layers
    const checks = [
      { name: 'burst', identifier: 'global' },
      { name: 'user', identifier: 'default-user' }, // In real app, use actual user ID
      { name: 'openrouter', identifier: 'api' }
    ];

    for (const check of checks) {
      const result = await this.rateLimiter.checkLimit(check.name, check.identifier);
      if (!result.allowed) {
        console.warn(`🚫 [${requestId}] Rate limit exceeded for ${check.name}: ${result.error}`);
        return result;
      }
    }

    return {
      allowed: true,
      info: {
        limit: Infinity,
        remaining: Infinity,
        resetTime: Date.now() + 3600000
      }
    };
  }

  private async performScriptGeneration(
    topic: string,
    complexity: 'beginner' | 'intermediate' | 'advanced',
    duration: number,
    style: 'mathematical' | 'scientific' | 'general',
    includeNarration: boolean,
    requestId: string
  ): Promise<ScriptGenerationResult> {
    console.log(`🔄 [${requestId}] Performing script generation...`);

    // Analyze topic and generate enhanced prompts
    const analysis = analyzeTopic(topic);
    const systemPrompt = generatePrompt(topic, { complexity, style, duration });
    const userPrompt = generateUserPrompt(topic);

    console.log(`🧠 [${requestId}] Topic analysis completed:`, {
      keywords: analysis.keywords.slice(0, 3),
      detectedComplexity: analysis.detectedComplexity,
      estimatedDuration: analysis.estimatedDuration
    });

    const requestBody = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 3000,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };

    console.log(`📤 [${requestId}] Sending request to OpenRouter API...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://manimnext.app',
        'X-Title': 'ManimNext - Educational Video Generator',
        ...(this.config.provider && { 'X-Provider': this.config.provider })
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const httpError = analyzeHttpError(response, errorData);
      
      console.error(`❌ [${requestId}] API request failed:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      throw httpError;
    }

    const data = await response.json();
    console.log(`📥 [${requestId}] Received response from OpenRouter API`);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new ManimGenerationError(
        ErrorType.API_ERROR,
        'Invalid response format from OpenRouter API',
        'The AI service returned an unexpected response. Please try again.',
        ErrorSeverity.HIGH,
        true,
        { requestId, responseData: data }
      );
    }

    const generatedScript = data.choices[0].message.content;
    console.log(`📜 [${requestId}] Generated script (${generatedScript.length} characters)`);

    // Validate and potentially fix the generated script
    const validation = validateManimScript(generatedScript);
    let finalScript = generatedScript;
    
    if (validation.isValid) {
      console.log(`✅ [${requestId}] Script validation passed (score: ${validation.score}/100)`);
    } else {
      console.warn(`⚠️ [${requestId}] Script validation failed, attempting auto-fix...`);
      console.warn(`Issues found:`, validation.errors);
      
      const fixResult = autoFixScript(generatedScript);
      if (fixResult.fixedScript && fixResult.fixedScript !== generatedScript) {
        finalScript = fixResult.fixedScript;
        console.log(`🔧 [${requestId}] Script auto-fixed successfully`);
      } else {
        console.error(`❌ [${requestId}] Auto-fix failed:`, fixResult.changes);
        // Continue with original script but log the issues
      }
    }

    // Generate narration if requested
    let narration = '';
    if (includeNarration) {
      console.log(`🗣️ [${requestId}] Generating narration...`);
      narration = await this.generateNarration(topic, complexity, style, requestId);
    }

    // Log token usage if available
    if (data.usage) {
      console.log(`📊 [${requestId}] Token usage:`, {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens
      });
    }

    return {
      script: finalScript,
      narration,
      metadata: {
        model: this.config.model,
        provider: this.config.provider,
        temperature: this.config.temperature || 0.7,
        tokenUsage: data.usage || null,
        requestId,
        validation: validation,
        analysis: analysis,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private async generateNarration(
    topic: string,
    complexity: 'beginner' | 'intermediate' | 'advanced',
    style: 'mathematical' | 'scientific' | 'general',
    requestId: string
  ): Promise<string> {
    const narrationPrompt = `Generate a clear, engaging narration script for an educational video about "${topic}". 
    The narration should be suitable for ${complexity} level students and follow a ${style} style.
    
    Guidelines:
    - Use clear, conversational language
    - Explain concepts step by step
    - Include smooth transitions between topics
    - Keep the tone engaging and educational
    - Avoid overly technical jargon unless necessary
    - Make it suitable for voice-over
    
    Generate only the narration text, no additional formatting or instructions.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://manimnext.app',
          'X-Title': 'ManimNext - Narration Generator',
          ...(this.config.provider && { 'X-Provider': this.config.provider })
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: narrationPrompt }],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (response.ok) {
        const data = await response.json();
        const narration = data.choices?.[0]?.message?.content || '';
        console.log(`✅ [${requestId}] Narration generated (${narration.length} characters)`);
        return narration;
      } else {
        console.warn(`⚠️ [${requestId}] Narration generation failed, continuing without narration`);
        return '';
      }
    } catch (error) {
      console.warn(`⚠️ [${requestId}] Narration generation error:`, error);
      return '';
    }
  }

  private recordSuccessfulRequest(
    requestId: string,
    responseTime: number,
    result: ScriptGenerationResult
  ): void {
    // Record rate limiter success
    this.rateLimiter.recordRequest('openrouter', 'api', true);
    this.rateLimiter.recordRequest('user', 'default-user', true);
    this.rateLimiter.recordRequest('burst', 'global', true);

    // Record performance metrics
    this.performanceTracker.recordGeneration(this.config.model, {
      responseTime,
      tokenCount: result.metadata.tokenUsage?.total_tokens || 0,
      validationScore: result.metadata.validation?.qualityScore || 0,
      complexity: 'intermediate', // Would be passed from parameters
      style: 'general' // Would be passed from parameters
    });

    // Log success
    this.logger.log(
      new ManimGenerationError(
        ErrorType.API_ERROR, // This will be ignored since it's a success log
        'Script generation completed successfully',
        'Success',
        ErrorSeverity.LOW,
        false,
        {
          requestId,
          responseTime,
          model: this.config.model,
          tokenUsage: result.metadata.tokenUsage
        }
      ),
      { operation: 'generateScript', requestId }
    );

    console.log(`📈 [${requestId}] Request recorded as successful`);
  }

  private recordFailedRequest(
    requestId: string,
    error: any,
    responseTime: number
  ): void {
    // Record rate limiter failure (unless it's a rate limit error)
    if (!(error instanceof ManimGenerationError) || error.type !== ErrorType.RATE_LIMIT_ERROR) {
      this.rateLimiter.recordRequest('openrouter', 'api', false);
      this.rateLimiter.recordRequest('user', 'default-user', false);
      this.rateLimiter.recordRequest('burst', 'global', false);
    }

    // Log error
    const appError = error instanceof ManimGenerationError ? error : 
      new ManimGenerationError(
        ErrorType.UNKNOWN_ERROR,
        error.message || 'Unknown error',
        'An error occurred during script generation',
        ErrorSeverity.HIGH,
        false,
        { requestId, responseTime, originalError: error }
      );

    this.logger.log(appError, { operation: 'generateScript', requestId });

    console.error(`📉 [${requestId}] Request recorded as failed:`, error.message);
  }

  // Get rate limiter statistics
  getRateLimiterStats(): any {
    return this.rateLimiter.getStats();
  }

  // Get circuit breaker state
  getCircuitBreakerState(): any {
    return this.circuitBreaker.getState();
  }

  // Reset rate limiters (for testing/admin purposes)
  resetRateLimiters(): void {
    this.rateLimiter.reset();
    console.log('🔄 Rate limiters reset');
  }

  // Get remaining requests for different rate limit categories
  getRemainingRequests(): {
    burst: number;
    user: number;
    openrouter: number;
  } {
    return {
      burst: this.rateLimiter.getRemainingRequests('burst', 'global'),
      user: this.rateLimiter.getRemainingRequests('user', 'default-user'),
      openrouter: this.rateLimiter.getRemainingRequests('openrouter', 'api')
    };
  }
}

// Utility function to get OpenRouter client instance
export function getOpenRouterClient(): OpenRouterClient {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  return new OpenRouterClient({
    apiKey,
    model: process.env.OPENROUTER_DEFAULT_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
    provider: process.env.OPENROUTER_PROVIDER || 'chutes/fp8',
    maxTokens: process.env.OPENROUTER_MAX_TOKENS ? parseInt(process.env.OPENROUTER_MAX_TOKENS) : undefined,
    temperature: process.env.OPENROUTER_TEMPERATURE ? parseFloat(process.env.OPENROUTER_TEMPERATURE) : undefined,
  });
}

// Script generation service
export class ScriptGeneratorService {
  private client: OpenRouterClient;

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  async generateScript(
    topic: string,
    complexity: 'beginner' | 'intermediate' | 'advanced',
    style: 'mathematical' | 'scientific' | 'general',
    duration: number,
    includeNarration: boolean = false
  ): Promise<{
    script: string;
    narration?: string;
    metadata: {
      topic: string;
      complexity: string;
      style: string;
      duration: number;
      model: string;
      generatedAt: string;
    };
  }> {
    try {
      // Generate the main Manim script using the new method
      const result = await this.client.generateScript(topic, complexity, duration, style, includeNarration);

      return {
        script: result.script,
        narration: result.narration || undefined,
        metadata: {
          topic,
          complexity,
          style,
          duration,
          model: result.metadata.model,
          generatedAt: result.metadata.generatedAt,
        },
      };
    } catch (error) {
      throw new Error(`Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 