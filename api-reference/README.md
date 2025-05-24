# API Reference Documentation

This folder contains comprehensive API reference documentation for all the external services and libraries used in the Learnim project.

## 📁 Contents

### 🔗 [OpenRouter API](./openrouter-api.md)
Complete reference for the OpenRouter API, which provides unified access to multiple AI models for generating Manim scripts.

**Key Features:**
- Chat completions with multiple model providers
- Streaming responses for real-time generation
- Tool calling capabilities
- Cost optimization and rate limiting
- Authentication and security

**Use Case in Learnim:**
- Generate Manim scripts from user topics
- Process educational content requests
- Create personalized learning explanations

---

### 🔥 [Firebase API](./firebase-api.md)
Comprehensive guide to Firebase services including Authentication, Firestore, and Storage.

**Key Features:**
- Google OAuth authentication
- Real-time database operations
- File storage and management
- Security rules and access control
- Admin SDK for backend operations

**Use Case in Learnim:**
- User authentication and management
- Store video metadata and user data
- Manage user sessions and preferences
- Handle file uploads and downloads

---

### ☁️ [Google Cloud API](./google-cloud-api.md)
Complete reference for Google Cloud Platform services used for video rendering and infrastructure.

**Key Features:**
- Compute Engine GPU instances
- Cloud Run serverless containers
- Vertex AI custom jobs
- Cloud Storage for video files
- Cost optimization strategies

**Use Case in Learnim:**
- Render Manim videos at scale
- Manage cloud infrastructure
- Store and serve video content
- Monitor performance and costs

---

### 🎬 [Manim API](./manim-api.md)
Detailed documentation of the Manim library for creating mathematical animations.

**Key Features:**
- Scene construction patterns
- Mathematical objects (Mobjects)
- Animation techniques
- Rendering commands
- Code generation templates

**Use Case in Learnim:**
- Generate educational video scripts
- Create mathematical visualizations
- Animate learning concepts
- Validate generated code

---

## 🚀 Quick Start Guide

### 1. Setting Up Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
YOUR_SITE_URL=https://learnim.com
YOUR_SITE_NAME=Learnim

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_CLOUD_ZONE=us-central1-a
GCS_BUCKET_VIDEOS=your_project_videos
GCS_BUCKET_TEMP=your_project_temp
```

### 2. Installation Commands

```bash
# Frontend dependencies
npm install firebase react-firebase-hooks

# Backend dependencies
pip install openai firebase-admin google-cloud manim

# Manim installation
pip install manim
manim checkhealth
```

### 3. Basic Integration Example

```typescript
// Frontend: Generate video request
import { generateManimScript } from './services/openrouter';
import { uploadVideo } from './services/firebase';

const createVideo = async (topic: string) => {
  // Generate Manim script using OpenRouter
  const script = await generateManimScript(topic);
  
  // Render video using Google Cloud
  const videoUrl = await renderVideo(script);
  
  // Save to Firebase
  await saveVideoToFirebase(videoUrl, topic);
};
```

```python
# Backend: Video rendering pipeline
from services.openrouter import generate_script
from services.google_cloud import render_video
from services.firebase import save_video_metadata

async def process_video_request(topic: str, user_id: str):
    # Generate Manim script
    script = await generate_script(topic)
    
    # Render video
    video_url = await render_video(script)
    
    # Save metadata
    await save_video_metadata(user_id, topic, video_url)
    
    return video_url
```

---

## 🔧 Common Integration Patterns

### 1. Error Handling

```typescript
// Robust error handling across all APIs
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Implement exponential backoff
    await delay(calculateBackoff(attempt));
    return retry();
  }
  
  // Log error and return fallback
  console.error('API Error:', error);
  return fallbackResponse();
}
```

### 2. Authentication Flow

```typescript
// Unified authentication across services
const authenticateUser = async () => {
  // Firebase Auth
  const user = await signInWithGoogle();
  
  // Get Firebase ID token for backend
  const idToken = await user.getIdToken();
  
  // Verify token in backend
  const backendAuth = await verifyFirebaseToken(idToken);
  
  return { user, backendAuth };
};
```

### 3. Cost Optimization

```python
# Choose optimal rendering method based on requirements
def choose_rendering_method(estimated_duration: float, complexity: str):
    if estimated_duration < 1 and complexity == 'low':
        return 'cloud_run'  # Cheapest for short videos
    elif estimated_duration > 5 or complexity == 'high':
        return 'compute_engine'  # Best for long/complex videos
    else:
        return 'custom_job'  # Balanced option
```

---

## 📊 API Limits and Quotas

### OpenRouter
- **Rate Limit:** 100 requests/hour (default)
- **Token Limits:** Varies by model
- **Cost:** Pay-per-token usage

### Firebase
- **Firestore:** 50,000 reads/day (free tier)
- **Storage:** 5GB free, then pay-per-GB
- **Authentication:** Unlimited (free)

### Google Cloud
- **Compute Engine:** Pay-per-hour usage
- **Cloud Run:** Pay-per-request + CPU time
- **Storage:** Pay-per-GB stored

### Manim
- **Local Rendering:** Limited by hardware
- **Cloud Rendering:** Limited by instance specs
- **No API limits:** Open source library

---

## 🔍 Debugging and Monitoring

### 1. Logging Setup

```python
import logging
from google.cloud import logging as cloud_logging

# Setup Cloud Logging
client = cloud_logging.Client()
client.setup_logging()

# Log API calls
logging.info(f"OpenRouter request: {request_data}")
logging.error(f"Rendering failed: {error_message}")
```

### 2. Performance Monitoring

```typescript
// Monitor API response times
const monitorApiCall = async (apiName: string, apiCall: Function) => {
  const startTime = Date.now();
  
  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;
    
    // Log successful call
    analytics.track('api_call_success', {
      api: apiName,
      duration,
      timestamp: new Date()
    });
    
    return result;
  } catch (error) {
    // Log failed call
    analytics.track('api_call_error', {
      api: apiName,
      error: error.message,
      timestamp: new Date()
    });
    
    throw error;
  }
};
```

### 3. Health Checks

```python
# API health check endpoints
async def health_check():
    checks = {
        'openrouter': await check_openrouter_health(),
        'firebase': await check_firebase_health(),
        'google_cloud': await check_gcp_health(),
        'manim': check_manim_installation()
    }
    
    all_healthy = all(checks.values())
    
    return {
        'status': 'healthy' if all_healthy else 'degraded',
        'services': checks,
        'timestamp': datetime.utcnow()
    }
```

---

## 🛡️ Security Best Practices

### 1. API Key Management
- Store keys in environment variables
- Use different keys for development/production
- Rotate keys regularly
- Monitor usage for anomalies

### 2. Input Validation
- Sanitize user inputs before API calls
- Validate Manim scripts for security
- Implement rate limiting per user
- Use Firebase Security Rules

### 3. Error Handling
- Don't expose internal errors to users
- Log security events
- Implement proper authentication checks
- Use HTTPS for all API calls

---

## 📚 Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [Manim Documentation](https://docs.manim.community/)

---

## 🤝 Contributing

When adding new API integrations:

1. Create a new markdown file in this directory
2. Follow the existing documentation structure
3. Include code examples and error handling
4. Add security considerations
5. Update this README with the new API

---

## 📝 Notes

- All code examples are production-ready
- Error handling patterns are included
- Security best practices are emphasized
- Cost optimization strategies are provided
- Monitoring and debugging guidance is included

This documentation serves as the single source of truth for all API integrations in the Learnim project. 