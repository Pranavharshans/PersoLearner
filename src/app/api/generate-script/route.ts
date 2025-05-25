import { NextRequest, NextResponse } from 'next/server';
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

export interface ScriptGenerationRequest {
  topic: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  style: 'mathematical' | 'scientific' | 'general';
  includeNarration: boolean;
}

export interface ScriptGenerationResponse {
  success: boolean;
  data?: {
    script: string;
    sceneClass: string;
    estimatedDuration: number;
    complexity: string;
    narration?: string;
    metadata: {
      topic: string;
      style: string;
      model: string;
      generatedAt: string;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [${requestId}] New script generation request received`);

  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    console.log(`🔍 [${requestId}] Client IP: ${clientIP}`);

    // Check rate limits using the correct method signature
    const rateLimitResult = await defaultRateLimiter.checkLimit('user', clientIP);
    
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 [${requestId}] Rate limit exceeded for IP: ${clientIP}`);
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.info.retryAfter || 60
        },
        { 
          status: 429,
          headers: {
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
      return NextResponse.json(
        { error: 'Topic is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate complexity
    const validComplexities = ['beginner', 'intermediate', 'advanced'];
    if (complexity && !validComplexities.includes(complexity)) {
      defaultRateLimiter.recordRequest('user', clientIP, false);
      return NextResponse.json(
        { error: `Complexity must be one of: ${validComplexities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate duration
    if (duration && (typeof duration !== 'number' || duration < 15 || duration > 300)) {
      defaultRateLimiter.recordRequest('user', clientIP, false);
      return NextResponse.json(
        { error: 'Duration must be a number between 15 and 300 seconds' },
        { status: 400 }
      );
    }

    // Validate style
    const validStyles = ['mathematical', 'scientific', 'general'];
    if (style && !validStyles.includes(style)) {
      defaultRateLimiter.recordRequest('user', clientIP, false);
      return NextResponse.json(
        { error: `Style must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`📝 [${requestId}] Request validated:`, {
      topic: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
      complexity: complexity || 'intermediate',
      duration: duration || 60,
      style: style || 'general',
      includeNarration: Boolean(includeNarration)
    });

    // Check if OpenRouter API key is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.warn(`⚠️ [${requestId}] OpenRouter API key not configured, using fallback`);
      
      // Record successful request for rate limiting
      defaultRateLimiter.recordRequest('user', clientIP, true);
      
      // Return fallback response
      return NextResponse.json({
        script: generateFallbackScript(topic, complexity || 'intermediate'),
        narration: includeNarration ? generateFallbackNarration(topic) : undefined,
        metadata: {
          topic,
          complexity: complexity || 'intermediate',
          style: style || 'general',
          duration: duration || 60,
          model: 'fallback',
          generatedAt: new Date().toISOString(),
          requestId
        }
      });
    }

    // Initialize OpenRouter client and service
    const client = new OpenRouterClient({
      apiKey,
      model: 'deepseek/deepseek-chat-v3-0324:free',
      provider: 'chutes/fp8',
      maxTokens: 3000,
      temperature: 0.7
    });

    const service = new ScriptGeneratorService(client);

    console.log(`🤖 [${requestId}] Generating script with OpenRouter...`);

    // Generate script
    const result = await service.generateScript(
      topic,
      complexity || 'intermediate',
      style || 'general',
      duration || 60,
      includeNarration || false
    );

    // Record successful request for rate limiting
    defaultRateLimiter.recordRequest('user', clientIP, true);

    console.log(`✅ [${requestId}] Script generation completed successfully`);

    return NextResponse.json({
      script: result.script,
      narration: result.narration,
      metadata: {
        ...result.metadata,
        requestId
      }
    }, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.info.limit.toString(),
        'X-RateLimit-Remaining': (rateLimitResult.info.remaining - 1).toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.info.resetTime).toISOString()
      }
    });

  } catch (error) {
    // Get client IP for rate limiting (in case of error before it was set)
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Record failed request for rate limiting
    defaultRateLimiter.recordRequest('user', clientIP, false);

    console.error(`❌ [${requestId}] Script generation failed:`, error);

    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { 
            error: 'Service temporarily unavailable',
            message: 'The AI service is currently rate limited. Please try again in a few minutes.',
            requestId
          },
          { status: 503 }
        );
      }

      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Service configuration error',
            message: 'The AI service is temporarily unavailable. Please try again later.',
            requestId
          },
          { status: 503 }
        );
      }

      if (error.message.includes('timeout') || error.message.includes('network')) {
        return NextResponse.json(
          { 
            error: 'Service timeout',
            message: 'The request took too long to process. Please try again with a simpler topic.',
            requestId
          },
          { status: 504 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
        requestId
      },
      { status: 500 }
    );
  }
}

// Fallback placeholder functions (kept for when OpenRouter is not available)
function generateSampleScript(request: ScriptGenerationRequest): string {
  const { topic, complexity, style, duration } = request;
  
  const complexityLevel = {
    beginner: 'simple',
    intermediate: 'moderate',
    advanced: 'detailed'
  }[complexity];

  const styleElements = {
    mathematical: 'MathTex, equations, and mathematical symbols',
    scientific: 'diagrams, charts, and scientific visualizations',
    general: 'text, shapes, and general animations'
  }[style];

  const styleSpecificContent = generateStyleSpecificContent(style, topic);

  return `from manim import *

class MainScene(Scene):
    def construct(self):
        # ${complexityLevel} explanation of: ${topic}
        # Using ${styleElements}
        # Target duration: ${duration} seconds
        
        # Title
        title = Text("${topic}", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)
        
        # Main content based on style
${styleSpecificContent}
        
        # Conclusion
        conclusion = Text("Thank you for watching!", font_size=36)
        self.play(Transform(title, conclusion))
        self.wait(2)
        
        # Fade out
        self.play(FadeOut(conclusion))`;
}

function generateStyleSpecificContent(style: string, topic: string): string {
  switch (style) {
    case 'mathematical':
      return `        # Mathematical content
        equation = MathTex(r"E = mc^2")
        equation.scale(2)
        self.play(Write(equation))
        self.wait(2)
        
        # Explanation
        explanation = Text("This represents the relationship between energy and mass")
        explanation.next_to(equation, DOWN)
        self.play(Write(explanation))
        self.wait(3)`;
        
    case 'scientific':
      return `        # Scientific diagram
        circle = Circle(radius=2, color=BLUE)
        label = Text("Scientific Concept").next_to(circle, DOWN)
        
        self.play(Create(circle))
        self.play(Write(label))
        self.wait(2)
        
        # Add details
        details = Text("Key principles and applications")
        details.next_to(label, DOWN)
        self.play(Write(details))
        self.wait(3)`;
        
    default:
      return `        # General content
        main_text = Text("${topic}")
        main_text.scale(1.5)
        
        self.play(Write(main_text))
        self.wait(2)
        
        # Supporting information
        support = Text("Key points and explanations")
        support.next_to(main_text, DOWN)
        self.play(Write(support))
        self.wait(3)`;
  }
}

function generateSampleNarration(request: ScriptGenerationRequest): string {
  const { topic, complexity } = request;
  
  return `Welcome to this ${complexity} explanation of ${topic}.

In this video, we'll explore the key concepts and provide you with a clear understanding of the topic.

First, let's introduce the main idea...

[Continue with detailed narration based on the complexity level and topic]

Thank you for watching! We hope this explanation was helpful.`;
}

function generateFallbackScript(topic: string, complexity: string): string {
  // Implementation of generateFallbackScript function
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

function generateFallbackNarration(topic: string): string {
  // Implementation of generateFallbackNarration function
  return `Welcome to this explanation of ${topic}.

In this video, we'll explore the key concepts and provide you with a clear understanding of the topic.

First, let's introduce the main idea...

[Continue with detailed narration based on the complexity level and topic]

Thank you for watching! We hope this explanation was helpful.`;
} 