import { NextRequest } from 'next/server';
import { OpenRouterClient, ScriptGeneratorService } from '@/lib/openrouter';
import { validateTopic } from '@/lib/topic-analysis';
import { 
  ManimGenerationError, 
  ErrorType, 
  ErrorSeverity, 
  createErrorResponse,
  ErrorLogger 
} from '@/lib/error-handling';
import { defaultRateLimiter } from '@/lib/rate-limiter';

export interface StreamingScriptGenerationRequest {
  topic: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  style: 'mathematical' | 'scientific' | 'general';
  includeNarration: boolean;
}

export interface StreamChunk {
  type: 'start' | 'progress' | 'script_chunk' | 'narration_chunk' | 'metadata' | 'complete' | 'error';
  data?: any;
  timestamp: string;
  requestId: string;
}

export async function POST(request: NextRequest) {
  const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🌊 [${requestId}] New streaming script generation request received`);

  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    console.log(`🔍 [${requestId}] Client IP: ${clientIP}`);

    // Check rate limits
    const rateLimitResult = await defaultRateLimiter.checkLimit('user', clientIP);
    
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 [${requestId}] Rate limit exceeded for IP: ${clientIP}`);
      
      return new Response(
        JSON.stringify({
          type: 'error',
          data: {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: rateLimitResult.info.retryAfter || 60
          },
          timestamp: new Date().toISOString(),
          requestId
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.info.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.info.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.info.resetTime).toISOString(),
            'Retry-After': (rateLimitResult.info.retryAfter || 60).toString()
          }
        }
      );
    }

    console.log(`✅ [${requestId}] Rate limit check passed. Remaining: ${rateLimitResult.info.remaining}`);

    // Parse request body
    const body = await request.json();
    const { topic, complexity, duration, style, includeNarration } = body;

    // Validate required fields
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      defaultRateLimiter.recordRequest('user', clientIP, false);
      return new Response(
        JSON.stringify({
          type: 'error',
          data: { error: 'Topic is required and must be a non-empty string' },
          timestamp: new Date().toISOString(),
          requestId
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate complexity
    const validComplexities = ['beginner', 'intermediate', 'advanced'];
    if (complexity && !validComplexities.includes(complexity)) {
      defaultRateLimiter.recordRequest('user', clientIP, false);
      return new Response(
        JSON.stringify({
          type: 'error',
          data: { error: `Complexity must be one of: ${validComplexities.join(', ')}` },
          timestamp: new Date().toISOString(),
          requestId
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate duration
    if (duration && (typeof duration !== 'number' || duration < 15 || duration > 300)) {
      defaultRateLimiter.recordRequest('user', clientIP, false);
      return new Response(
        JSON.stringify({
          type: 'error',
          data: { error: 'Duration must be a number between 15 and 300 seconds' },
          timestamp: new Date().toISOString(),
          requestId
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate style
    const validStyles = ['mathematical', 'scientific', 'general'];
    if (style && !validStyles.includes(style)) {
      defaultRateLimiter.recordRequest('user', clientIP, false);
      return new Response(
        JSON.stringify({
          type: 'error',
          data: { error: `Style must be one of: ${validStyles.join(', ')}` },
          timestamp: new Date().toISOString(),
          requestId
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📝 [${requestId}] Request validated:`, {
      topic: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
      complexity: complexity || 'intermediate',
      duration: duration || 60,
      style: style || 'general',
      includeNarration: Boolean(includeNarration)
    });

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendChunk = (chunk: StreamChunk) => {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Send start event
          sendChunk({
            type: 'start',
            data: {
              message: 'Starting script generation...',
              topic,
              complexity: complexity || 'intermediate',
              duration: duration || 60,
              style: style || 'general',
              includeNarration: Boolean(includeNarration)
            },
            timestamp: new Date().toISOString(),
            requestId
          });

          // Check if OpenRouter API key is available
          const apiKey = process.env.OPENROUTER_API_KEY;
          
          if (!apiKey) {
            console.warn(`⚠️ [${requestId}] OpenRouter API key not configured, using fallback`);
            
            // Send progress update
            sendChunk({
              type: 'progress',
              data: { message: 'API key not configured, generating fallback script...' },
              timestamp: new Date().toISOString(),
              requestId
            });

            // Generate fallback script in chunks
            const fallbackScript = generateFallbackScript(topic, complexity || 'intermediate');
            const scriptChunks = chunkString(fallbackScript, 100);
            
            for (let i = 0; i < scriptChunks.length; i++) {
              sendChunk({
                type: 'script_chunk',
                data: {
                  chunk: scriptChunks[i],
                  index: i,
                  total: scriptChunks.length,
                  isLast: i === scriptChunks.length - 1
                },
                timestamp: new Date().toISOString(),
                requestId
              });
              
              // Add small delay to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (includeNarration) {
              const fallbackNarration = generateFallbackNarration(topic);
              const narrationChunks = chunkString(fallbackNarration, 50);
              
              for (let i = 0; i < narrationChunks.length; i++) {
                sendChunk({
                  type: 'narration_chunk',
                  data: {
                    chunk: narrationChunks[i],
                    index: i,
                    total: narrationChunks.length,
                    isLast: i === narrationChunks.length - 1
                  },
                  timestamp: new Date().toISOString(),
                  requestId
                });
                
                await new Promise(resolve => setTimeout(resolve, 30));
              }
            }

            // Send metadata
            sendChunk({
              type: 'metadata',
              data: {
                topic,
                complexity: complexity || 'intermediate',
                style: style || 'general',
                duration: duration || 60,
                model: 'fallback',
                generatedAt: new Date().toISOString(),
                requestId
              },
              timestamp: new Date().toISOString(),
              requestId
            });

            // Record successful request for rate limiting
            defaultRateLimiter.recordRequest('user', clientIP, true);

          } else {
            // Initialize OpenRouter client and service
            const client = new OpenRouterClient({
              apiKey,
              model: 'deepseek/deepseek-chat-v3-0324:free',
              provider: 'chutes/fp8',
              maxTokens: 3000,
              temperature: 0.7
            });

            const service = new StreamingScriptGeneratorService(client);

            console.log(`🤖 [${requestId}] Generating script with OpenRouter streaming...`);

            // Send progress update
            sendChunk({
              type: 'progress',
              data: { message: 'Connecting to AI service...' },
              timestamp: new Date().toISOString(),
              requestId
            });

            // Generate script with streaming
            await service.generateScriptStream(
              topic,
              complexity || 'intermediate',
              style || 'general',
              duration || 60,
              includeNarration || false,
              (chunk) => sendChunk({ ...chunk, requestId })
            );

            // Record successful request for rate limiting
            defaultRateLimiter.recordRequest('user', clientIP, true);
          }

          // Send completion event
          sendChunk({
            type: 'complete',
            data: { message: 'Script generation completed successfully!' },
            timestamp: new Date().toISOString(),
            requestId
          });

          console.log(`✅ [${requestId}] Streaming script generation completed successfully`);

        } catch (error) {
          console.error(`❌ [${requestId}] Streaming script generation failed:`, error);

          // Record failed request for rate limiting
          defaultRateLimiter.recordRequest('user', clientIP, false);

          // Send error event
          sendChunk({
            type: 'error',
            data: {
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              message: 'Script generation failed. Please try again.',
            },
            timestamp: new Date().toISOString(),
            requestId
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-RateLimit-Limit': rateLimitResult.info.limit.toString(),
        'X-RateLimit-Remaining': (rateLimitResult.info.remaining - 1).toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.info.resetTime).toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Streaming request failed:`, error);
    
    return new Response(
      JSON.stringify({
        type: 'error',
        data: {
          error: 'Internal server error',
          message: 'An unexpected error occurred. Please try again later.',
        },
        timestamp: new Date().toISOString(),
        requestId
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper function to chunk strings for streaming
function chunkString(str: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

// Fallback script generation (same as regular endpoint)
function generateFallbackScript(topic: string, complexity: string): string {
  return `from manim import *

class MainScene(Scene):
    def construct(self):
        # Title
        title = Text("${topic}", font_size=48)
        title.set_color(BLUE)
        self.play(Write(title))
        self.wait(2)
        
        # Placeholder content
        content = Text("This is a placeholder script.\\nConfigure OpenRouter API key for AI generation.", font_size=24)
        content.next_to(title, DOWN, buff=1)
        self.play(FadeIn(content))
        self.wait(3)
        
        # Conclusion
        self.play(FadeOut(title), FadeOut(content))`;
}

// Fallback narration generation (same as regular endpoint)
function generateFallbackNarration(topic: string): string {
  return `Welcome to this explanation of ${topic}.

In this video, we'll explore the key concepts and provide you with a clear understanding of the topic.

First, let's introduce the main idea...

[Continue with detailed narration based on the complexity level and topic]

Thank you for watching! We hope this explanation was helpful.`;
}

// Streaming service class
class StreamingScriptGeneratorService {
  private client: OpenRouterClient;

  constructor(client: OpenRouterClient) {
    this.client = client;
  }

  async generateScriptStream(
    topic: string,
    complexity: 'beginner' | 'intermediate' | 'advanced',
    style: 'mathematical' | 'scientific' | 'general',
    duration: number,
    includeNarration: boolean,
    onChunk: (chunk: Omit<StreamChunk, 'requestId'>) => void
  ): Promise<void> {
    try {
      // Send progress update
      onChunk({
        type: 'progress',
        data: { message: 'Analyzing topic and generating prompts...' },
        timestamp: new Date().toISOString()
      });

      // Generate script using the existing client (for now, we'll simulate streaming)
      // In a real implementation, you'd modify the OpenRouter client to support streaming
      const result = await this.client.generateScript(topic, complexity, duration, style, includeNarration);

      // Send progress update
      onChunk({
        type: 'progress',
        data: { message: 'Generating script content...' },
        timestamp: new Date().toISOString()
      });

      // Simulate streaming by chunking the result
      const scriptChunks = chunkString(result.script, 150);
      
      for (let i = 0; i < scriptChunks.length; i++) {
        onChunk({
          type: 'script_chunk',
          data: {
            chunk: scriptChunks[i],
            index: i,
            total: scriptChunks.length,
            isLast: i === scriptChunks.length - 1
          },
          timestamp: new Date().toISOString()
        });
        
        // Add delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (includeNarration && result.narration) {
        onChunk({
          type: 'progress',
          data: { message: 'Generating narration...' },
          timestamp: new Date().toISOString()
        });

        const narrationChunks = chunkString(result.narration, 100);
        
        for (let i = 0; i < narrationChunks.length; i++) {
          onChunk({
            type: 'narration_chunk',
            data: {
              chunk: narrationChunks[i],
              index: i,
              total: narrationChunks.length,
              isLast: i === narrationChunks.length - 1
            },
            timestamp: new Date().toISOString()
          });
          
          await new Promise(resolve => setTimeout(resolve, 80));
        }
      }

      // Send metadata
      onChunk({
        type: 'metadata',
        data: result.metadata,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      throw error;
    }
  }
} 