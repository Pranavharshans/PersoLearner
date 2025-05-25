# Next.js API Documentation for ManimNext

## Overview
This document provides comprehensive API documentation for the Next.js components and patterns used in the ManimNext application.

## API Routes

### Chat Completions API Route
**File:** `src/app/api/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();
    
    // Validate input
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate Manim script using OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL,
        'X-Title': 'ManimNext'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Manim developer. Generate complete, working Manim scripts for educational videos.'
          },
          {
            role: 'user',
            content: `Create a Manim script for an educational video about: ${topic}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const manimScript = data.choices[0].message.content;

    return NextResponse.json({ 
      script: manimScript,
      topic 
    });

  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}
```

### Video Rendering API Route
**File:** `src/app/api/render/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { script, topic } = await request.json();
    
    // Send script to Google Cloud Run for rendering
    const renderResponse = await fetch(process.env.CLOUD_RUN_RENDER_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GOOGLE_CLOUD_TOKEN}`
      },
      body: JSON.stringify({
        script,
        topic,
        format: 'mp4',
        quality: 'high'
      })
    });

    if (!renderResponse.ok) {
      throw new Error('Rendering failed');
    }

    const renderData = await renderResponse.json();
    
    return NextResponse.json({
      videoUrl: renderData.videoUrl,
      renderTime: renderData.renderTime,
      status: 'completed'
    });

  } catch (error) {
    console.error('Error rendering video:', error);
    return NextResponse.json(
      { error: 'Failed to render video' },
      { status: 500 }
    );
  }
}
```

### Authentication API Routes
**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

## Server Components

### Video Generation Page
**File:** `src/app/generate/page.tsx`

```typescript
import { Metadata } from 'next';
import VideoGenerationForm from '@/components/VideoGenerationForm';

export const metadata: Metadata = {
  title: 'Generate Video | ManimNext',
  description: 'Generate educational videos using AI and Manim'
};

export default function GeneratePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Educational Video</h1>
      <VideoGenerationForm />
    </div>
  );
}
```

## Client Components

### Video Generation Form
**File:** `src/components/VideoGenerationForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GenerationResponse {
  script: string;
  topic: string;
}

interface RenderResponse {
  videoUrl: string;
  renderTime: number;
  status: string;
}

export default function VideoGenerationForm() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [script, setScript] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });

      const data: GenerationResponse = await response.json();
      setScript(data.script);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRender = async () => {
    if (!script) return;

    setIsRendering(true);
    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, topic })
      });

      const data: RenderResponse = await response.json();
      setVideoUrl(data.videoUrl);
    } catch (error) {
      console.error('Rendering failed:', error);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <label htmlFor="topic" className="block text-sm font-medium mb-2">
          Video Topic
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter the topic for your educational video"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!topic.trim() || isGenerating}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isGenerating ? 'Generating Script...' : 'Generate Script'}
      </button>

      {script && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Generated Script</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
            {script}
          </pre>
          
          <button
            onClick={handleRender}
            disabled={isRendering}
            className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isRendering ? 'Rendering Video...' : 'Render Video'}
          </button>
        </div>
      )}

      {videoUrl && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Generated Video</h3>
          <video
            controls
            className="w-full rounded-md"
            src={videoUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}
```

## Utility Functions

### OpenRouter Client
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
  stream?: boolean;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createChatCompletion(request: ChatCompletionRequest) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || '',
        'X-Title': 'ManimNext'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    return response.json();
  }

  async streamChatCompletion(request: ChatCompletionRequest) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || '',
        'X-Title': 'ManimNext'
      },
      body: JSON.stringify({ ...request, stream: true })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    return response.body;
  }
}
```

## Environment Variables

```bash
# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# Google Cloud
GOOGLE_CLOUD_TOKEN=your_google_cloud_token
CLOUD_RUN_RENDER_URL=https://your-cloud-run-service.run.app

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## TypeScript Types

### API Response Types
**File:** `src/types/api.ts`

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerateScriptRequest {
  topic: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
}

export interface GenerateScriptResponse {
  script: string;
  topic: string;
  estimatedDuration: number;
}

export interface RenderVideoRequest {
  script: string;
  topic: string;
  format?: 'mp4' | 'webm';
  quality?: 'low' | 'medium' | 'high';
}

export interface RenderVideoResponse {
  videoUrl: string;
  renderTime: number;
  status: 'completed' | 'failed';
  fileSize?: number;
}
```

## Error Handling

### API Error Handler
**File:** `src/lib/error-handler.ts`

```typescript
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

## Middleware

### Authentication Middleware
**File:** `src/middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add custom middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authorized for protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
};
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Type Safety**: Use TypeScript interfaces for all API requests/responses
3. **Validation**: Validate input data before processing
4. **Security**: Never expose sensitive environment variables to the client
5. **Performance**: Use streaming for large responses when possible
6. **Caching**: Implement appropriate caching strategies for static content 