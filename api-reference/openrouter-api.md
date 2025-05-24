# OpenRouter API Reference

## Overview

OpenRouter is a unified API platform for accessing, routing, and integrating with hundreds of AI models across multiple providers. It provides a standardized interface compatible with OpenAI's API format.

## Base URL
```
https://openrouter.ai/api/v1
```

## Authentication

All API requests require authentication using a Bearer token in the Authorization header.

### Headers
```http
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json
HTTP-Referer: <YOUR_SITE_URL>  # Optional - for rankings
X-Title: <YOUR_SITE_NAME>      # Optional - for rankings
```

## Chat Completions

### Endpoint
```http
POST /chat/completions
```

### Request Body Schema

```typescript
type Request = {
  // Either "messages" or "prompt" is required
  messages?: Message[];
  prompt?: string;

  // Model selection
  model?: string; // See supported models

  // Response format
  response_format?: { type: 'json_object' };

  // Control parameters
  stop?: string | string[];
  stream?: boolean; // Enable streaming
  max_tokens?: number; // Range: [1, context_length)
  temperature?: number; // Range: [0, 2]
  top_p?: number; // Range: (0, 1]
  top_k?: number; // Range: [1, Infinity)
  frequency_penalty?: number; // Range: [-2, 2]
  presence_penalty?: number; // Range: [-2, 2]
  repetition_penalty?: number; // Range: (0, 2]
  
  // Tool calling
  tools?: Tool[];
  tool_choice?: ToolChoice;
  
  // OpenRouter-specific parameters
  transforms?: string[];
  models?: string[]; // For model routing
  route?: 'fallback';
  provider?: ProviderPreferences;
  
  // Reasoning (for supported models)
  reasoning?: {
    max_tokens?: number;
    effort?: 'low' | 'medium' | 'high';
    exclude?: boolean;
  };
  
  // Usage tracking
  usage?: {
    include: boolean;
  };
};
```

### Message Types

```typescript
type Message =
  | {
      role: 'user' | 'assistant' | 'system';
      content: string | ContentPart[];
      name?: string;
    }
  | {
      role: 'tool';
      content: string;
      tool_call_id: string;
      name?: string;
    };

type ContentPart = TextContent | ImageContentPart;

type TextContent = {
  type: 'text';
  text: string;
};

type ImageContentPart = {
  type: 'image_url';
  image_url: {
    url: string; // URL or base64 encoded image data
    detail?: string; // Optional, defaults to "auto"
  };
};
```

### Tool Calling

```typescript
type Tool = {
  type: 'function';
  function: FunctionDescription;
};

type FunctionDescription = {
  description?: string;
  name: string;
  parameters: object; // JSON Schema object
};

type ToolChoice =
  | 'none'
  | 'auto'
  | {
      type: 'function';
      function: {
        name: string;
      };
    };
```

## Code Examples

### Basic Chat Completion (TypeScript)

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <OPENROUTER_API_KEY>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'What is the meaning of life?',
      },
    ],
  }),
});

const data = await response.json();
console.log(data);
```

### Using OpenAI SDK (Python)

```python
from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="<OPENROUTER_API_KEY>",
)

completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "<YOUR_SITE_URL>",
    "X-Title": "<YOUR_SITE_NAME>",
  },
  model="openai/gpt-4o",
  messages=[
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
)

print(completion.choices[0].message.content)
```

### Streaming Response (Python)

```python
import requests
import json

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
  "Authorization": f"Bearer <OPENROUTER_API_KEY>",
  "Content-Type": "application/json"
}

payload = {
  "model": "openai/gpt-4o",
  "messages": [{"role": "user", "content": "Tell me a story"}],
  "stream": True
}

buffer = ""
with requests.post(url, headers=headers, json=payload, stream=True) as r:
  for chunk in r.iter_content(chunk_size=1024, decode_unicode=True):
    buffer += chunk
    while True:
      line_end = buffer.find('\n')
      if line_end == -1:
        break

      line = buffer[:line_end].strip()
      buffer = buffer[line_end + 1:]

      if line.startswith('data: '):
        data = line[6:]
        if data == '[DONE]':
          break

        try:
          data_obj = json.loads(data)
          content = data_obj["choices"][0]["delta"].get("content")
          if content:
            print(content, end="", flush=True)
        except json.JSONDecodeError:
          pass
```

### Image Input (Python)

```python
import requests
import json

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer <OPENROUTER_API_KEY>",
    "Content-Type": "application/json"
}

messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "What's in this image?"
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": "https://example.com/image.jpg"
                }
            }
        ]
    }
]

payload = {
    "model": "openai/gpt-4o",
    "messages": messages
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

### Reasoning Models (TypeScript)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '<OPENROUTER_API_KEY>',
});

const response = await openai.chat.completions.create({
  model: 'openai/o1-preview',
  messages: [
    {
      role: 'user',
      content: "How would you build the world's tallest skyscraper?",
    },
  ],
  reasoning: {
    max_tokens: 2000, // Allocate tokens for reasoning
  },
});

console.log('REASONING:', response.choices[0].message.reasoning);
console.log('CONTENT:', response.choices[0].message.content);
```

### Tool Calling (TypeScript)

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather in a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
        },
        required: ['location'],
      },
    },
  },
];

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <OPENROUTER_API_KEY>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [
      {
        role: 'user',
        content: 'What is the weather like in San Francisco?',
      },
    ],
    tools: tools,
  }),
});
```

## Response Format

```json
{
  "id": "gen-1234567890",
  "provider": "OpenAI",
  "model": "openai/gpt-4o",
  "object": "chat.completion",
  "created": 1234567890,
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "The meaning of life is a philosophical question...",
        "reasoning": "Let me think about this question..." // Only for reasoning models
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60,
    "cost": 0.001 // In credits
  }
}
```

## Error Handling

OpenRouter returns standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `429` - Rate Limited
- `500` - Internal Server Error

Example error response:
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Invalid model specified",
    "code": "invalid_model"
  }
}
```

## Rate Limits

- Default: 100 requests per hour per user
- Varies by model and provider
- Check response headers for current limits:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Supported Models

Popular models include:
- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `anthropic/claude-3.5-sonnet`
- `google/gemini-pro`
- `meta-llama/llama-3.1-8b-instruct`

For the complete list, visit: https://openrouter.ai/models

## Best Practices

1. **Always handle errors gracefully**
2. **Implement exponential backoff for rate limits**
3. **Use streaming for long responses**
4. **Include site headers for better routing**
5. **Monitor usage and costs**
6. **Validate input before sending requests**

## Environment Variables

```bash
export OPENROUTER_API_KEY="your-api-key-here"
export YOUR_SITE_URL="https://yoursite.com"
export YOUR_SITE_NAME="Your App Name"
``` 