# OpenRouter API Documentation for ManimNext

## Overview
This document provides comprehensive OpenRouter API integration documentation for the ManimNext application, covering AI model selection, chat completions, and Manim script generation.

## OpenRouter Configuration

### API Client Setup
**File:** `src/lib/openrouter.ts`

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  stop?: string[];
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';
  private defaultHeaders: Record<string, string>;

  constructor(apiKey: string, appName = 'ManimNext') {
    this.apiKey = apiKey;
    this.defaultHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': appName,
    };
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  async streamChatCompletion(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) onChunk(content);
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async getModels(): Promise<any[]> {
    const response = await fetch(`${this.baseURL}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getModelInfo(modelId: string): Promise<any> {
    const models = await this.getModels();
    return models.find(model => model.id === modelId);
  }
}

// Export configured instance
export const openRouterClient = new OpenRouterClient(
  process.env.OPENROUTER_API_KEY!,
  'ManimNext'
);
```

## Manim Script Generation

### Script Generator Service
**File:** `src/services/scriptGenerator.ts`

```typescript
import { openRouterClient } from '@/lib/openrouter';

export interface ScriptGenerationOptions {
  topic: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in seconds
  style: 'mathematical' | 'scientific' | 'general';
  includeNarration: boolean;
  model?: string;
}

export interface GeneratedScript {
  script: string;
  sceneClass: string;
  estimatedDuration: number;
  complexity: string;
  narration?: string;
  metadata: {
    topic: string;
    style: string;
    tokensUsed: number;
    model: string;
  };
}

export class ScriptGeneratorService {
  private defaultModel = 'anthropic/claude-3.5-sonnet';

  async generateScript(options: ScriptGenerationOptions): Promise<GeneratedScript> {
    const systemPrompt = this.buildSystemPrompt(options);
    const userPrompt = this.buildUserPrompt(options);

    const response = await openRouterClient.createChatCompletion({
      model: options.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const generatedContent = response.choices[0].message.content;
    const parsedScript = this.parseGeneratedScript(generatedContent);

    return {
      ...parsedScript,
      metadata: {
        topic: options.topic,
        style: options.style,
        tokensUsed: response.usage.total_tokens,
        model: response.model,
      }
    };
  }

  async generateScriptStream(
    options: ScriptGenerationOptions,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const systemPrompt = this.buildSystemPrompt(options);
    const userPrompt = this.buildUserPrompt(options);

    await openRouterClient.streamChatCompletion({
      model: options.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true,
    }, onChunk);
  }

  private buildSystemPrompt(options: ScriptGenerationOptions): string {
    return `You are an expert Manim developer and educational content creator. Your task is to generate complete, working Manim scripts for educational videos.

REQUIREMENTS:
- Generate a complete Python class that inherits from Scene
- Use proper Manim syntax and best practices
- Include clear, educational animations that explain the topic step by step
- Target ${options.complexity} level understanding
- Aim for approximately ${options.duration} seconds of animation
- Focus on ${options.style} content style
- Include proper timing with self.wait() calls
- Use appropriate Manim objects (Text, MathTex, VGroup, etc.)
- Add smooth transitions and animations

MANIM BEST PRACTICES:
- Use self.play() for animations
- Use self.wait() for pauses
- Group related objects with VGroup
- Use proper positioning and scaling
- Include fade in/out animations
- Use appropriate colors and styling
- Add text explanations alongside visual elements

OUTPUT FORMAT:
Provide the script in this exact format:

\`\`\`python
class MainScene(Scene):
    def construct(self):
        # Your Manim code here
        pass
\`\`\`

${options.includeNarration ? 'Also include a NARRATION section with spoken text for each animation step.' : ''}

Make the content engaging, educational, and visually appealing.`;
  }

  private buildUserPrompt(options: ScriptGenerationOptions): string {
    return `Create a Manim script for an educational video about: "${options.topic}"

Complexity Level: ${options.complexity}
Target Duration: ${options.duration} seconds
Content Style: ${options.style}
Include Narration: ${options.includeNarration ? 'Yes' : 'No'}

Please generate a complete, working Manim script that creates an engaging educational animation explaining this topic clearly and effectively.`;
  }

  private parseGeneratedScript(content: string): Omit<GeneratedScript, 'metadata'> {
    // Extract Python code block
    const codeMatch = content.match(/```python\n([\s\S]*?)\n```/);
    const script = codeMatch ? codeMatch[1] : content;

    // Extract scene class name
    const classMatch = script.match(/class\s+(\w+)\s*\(/);
    const sceneClass = classMatch ? classMatch[1] : 'MainScene';

    // Extract narration if present
    const narrationMatch = content.match(/NARRATION[:\s]*([\s\S]*?)(?=```|$)/i);
    const narration = narrationMatch ? narrationMatch[1].trim() : undefined;

    // Estimate duration based on wait calls and animations
    const waitMatches = script.match(/self\.wait\(([^)]*)\)/g) || [];
    const estimatedDuration = waitMatches.reduce((total, waitCall) => {
      const timeMatch = waitCall.match(/self\.wait\(([^)]*)\)/);
      const time = timeMatch && timeMatch[1] ? parseFloat(timeMatch[1]) || 1 : 1;
      return total + time;
    }, 0);

    return {
      script,
      sceneClass,
      estimatedDuration: Math.max(estimatedDuration, 10), // Minimum 10 seconds
      complexity: 'intermediate', // Could be parsed from content
      narration,
    };
  }
}

export const scriptGenerator = new ScriptGeneratorService();
```

## Model Selection and Management

### Model Configuration
**File:** `src/lib/models.ts`

```typescript
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
  };
}

export const RECOMMENDED_MODELS = {
  // High-quality models for complex script generation
  premium: [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4-turbo',
    'google/gemini-pro-1.5',
  ],
  
  // Balanced performance and cost
  standard: [
    'anthropic/claude-3-haiku',
    'openai/gpt-3.5-turbo',
    'meta-llama/llama-3.1-8b-instruct',
  ],
  
  // Cost-effective options
  budget: [
    'microsoft/wizardlm-2-8x22b',
    'mistralai/mixtral-8x7b-instruct',
    'meta-llama/llama-3.1-8b-instruct',
  ],
};

export class ModelManager {
  private client: OpenRouterClient;
  private cachedModels: ModelInfo[] | null = null;

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    if (this.cachedModels) {
      return this.cachedModels;
    }

    this.cachedModels = await this.client.getModels();
    return this.cachedModels;
  }

  async getRecommendedModels(category: keyof typeof RECOMMENDED_MODELS): Promise<ModelInfo[]> {
    const allModels = await this.getAvailableModels();
    const recommendedIds = RECOMMENDED_MODELS[category];
    
    return allModels.filter(model => recommendedIds.includes(model.id));
  }

  async getBestModelForTask(
    task: 'script_generation' | 'code_review' | 'explanation',
    budget: 'low' | 'medium' | 'high'
  ): Promise<string> {
    const budgetMap = {
      low: 'budget',
      medium: 'standard', 
      high: 'premium',
    } as const;

    const models = await this.getRecommendedModels(budgetMap[budget]);
    
    // Return the first available model, or fallback
    return models[0]?.id || 'anthropic/claude-3-haiku';
  }

  async estimateCost(
    modelId: string,
    promptTokens: number,
    completionTokens: number
  ): Promise<number> {
    const model = await this.client.getModelInfo(modelId);
    if (!model) return 0;

    const promptCost = (promptTokens / 1000) * model.pricing.prompt;
    const completionCost = (completionTokens / 1000) * model.pricing.completion;
    
    return promptCost + completionCost;
  }
}
```

## API Route Implementation

### Script Generation API
**File:** `src/app/api/generate-script/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { scriptGenerator, ScriptGenerationOptions } from '@/services/scriptGenerator';
import { auth } from '@/lib/firebase';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = headers().get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      topic,
      complexity = 'intermediate',
      duration = 60,
      style = 'general',
      includeNarration = false,
      model
    }: ScriptGenerationOptions = body;

    // Validate required fields
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate script
    const result = await scriptGenerator.generateScript({
      topic,
      complexity,
      duration,
      style,
      includeNarration,
      model,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Script generation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Script generation failed',
        success: false 
      },
      { status: 500 }
    );
  }
}
```

### Streaming Script Generation API
**File:** `src/app/api/generate-script-stream/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { scriptGenerator, ScriptGenerationOptions } from '@/services/scriptGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const options: ScriptGenerationOptions = body;

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await scriptGenerator.generateScriptStream(
            options,
            (chunk: string) => {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`)
              );
            }
          );
          
          controller.enqueue(
            new TextEncoder().encode('data: [DONE]\n\n')
          );
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Stream generation failed' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
```

## React Hooks for Script Generation

### useScriptGeneration Hook
**File:** `src/hooks/useScriptGeneration.ts`

```typescript
import { useState, useCallback } from 'react';
import { ScriptGenerationOptions, GeneratedScript } from '@/services/scriptGenerator';

interface UseScriptGenerationReturn {
  generateScript: (options: ScriptGenerationOptions) => Promise<void>;
  generateScriptStream: (options: ScriptGenerationOptions) => Promise<void>;
  script: GeneratedScript | null;
  isGenerating: boolean;
  error: string | null;
  progress: string;
}

export function useScriptGeneration(): UseScriptGenerationReturn {
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const generateScript = useCallback(async (options: ScriptGenerationOptions) => {
    setIsGenerating(true);
    setError(null);
    setProgress('Generating script...');

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`, // Implement this
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setScript(data.data);
      setProgress('Script generated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateScriptStream = useCallback(async (options: ScriptGenerationOptions) => {
    setIsGenerating(true);
    setError(null);
    setProgress('Starting generation...');

    try {
      const response = await fetch('/api/generate-script-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedScript = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setProgress('Generation complete!');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                accumulatedScript += parsed.chunk;
                setProgress(`Generating... (${accumulatedScript.length} characters)`);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateScript,
    generateScriptStream,
    script,
    isGenerating,
    error,
    progress,
  };
}

// Helper function to get auth token (implement based on your auth system)
async function getAuthToken(): Promise<string> {
  // Implementation depends on your authentication system
  // For Firebase: return await user.getIdToken()
  throw new Error('getAuthToken not implemented');
}
```

## Error Handling and Rate Limiting

### Rate Limiting Middleware
**File:** `src/middleware/rateLimit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: NextRequest) => string;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private config: RateLimitConfig) {}

  isAllowed(request: NextRequest): boolean {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    const userRequests = this.requests.get(key) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  getRemainingRequests(request: NextRequest): number {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }
}

export const scriptGenerationLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyGenerator: (request) => {
    // Use IP address or user ID for rate limiting
    return request.ip || 'anonymous';
  },
});

export function withRateLimit(handler: Function) {
  return async (request: NextRequest) => {
    if (!scriptGenerationLimiter.isAllowed(request)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: 60 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const remaining = scriptGenerationLimiter.getRemainingRequests(request);
    const response = await handler(request);
    
    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    return response;
  };
}
```

## Environment Variables

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ManimNext

# Model Configuration
DEFAULT_MODEL=anthropic/claude-3.5-sonnet
FALLBACK_MODEL=anthropic/claude-3-haiku
MAX_TOKENS=2000
TEMPERATURE=0.7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

## Best Practices

1. **Model Selection**: Choose appropriate models based on complexity and budget
2. **Error Handling**: Implement comprehensive error handling for API failures
3. **Rate Limiting**: Protect your API endpoints from abuse
4. **Caching**: Cache model responses when appropriate
5. **Monitoring**: Track usage, costs, and performance metrics
6. **Security**: Validate all inputs and sanitize generated code
7. **Fallbacks**: Implement fallback models for reliability
8. **Streaming**: Use streaming for better user experience with long generations 