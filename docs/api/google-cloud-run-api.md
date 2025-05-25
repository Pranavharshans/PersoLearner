# Google Cloud Run API Documentation for ManimNext

## Overview
This document provides comprehensive Google Cloud Run integration documentation for the ManimNext application, covering container deployment, video rendering service, and API endpoints.

## Cloud Run Service Architecture

### Manim Rendering Service
**Service Name:** `manim-renderer`
**Region:** `us-central1`
**Container Port:** `8080`

```dockerfile
# Dockerfile for Manim Rendering Service
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "main.py"]
```

### Requirements File
**File:** `requirements.txt`

```txt
manim==0.18.0
flask==2.3.3
gunicorn==21.2.0
google-cloud-storage==2.10.0
google-cloud-logging==3.8.0
google-auth==2.23.4
requests==2.31.0
Pillow==10.0.1
numpy==1.24.3
```

## Flask Application

### Main Application
**File:** `main.py`

```python
import os
import tempfile
import logging
from flask import Flask, request, jsonify
from google.cloud import storage
from google.cloud import logging as cloud_logging
import subprocess
import time
import uuid
from pathlib import Path

# Initialize Flask app
app = Flask(__name__)

# Setup Google Cloud Logging
client = cloud_logging.Client()
client.setup_logging()

# Initialize Google Cloud Storage
storage_client = storage.Client()
bucket_name = os.environ.get('STORAGE_BUCKET', 'manim-videos')
bucket = storage_client.bucket(bucket_name)

class ManimRenderer:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
    def create_script_file(self, script_content, filename):
        """Create a Python script file with Manim code"""
        script_path = os.path.join(self.temp_dir, f"{filename}.py")
        
        # Ensure proper imports and structure
        full_script = f"""
from manim import *

{script_content}
"""
        
        with open(script_path, 'w') as f:
            f.write(full_script)
            
        return script_path
    
    def render_video(self, script_path, scene_name, quality='medium'):
        """Render video using Manim"""
        quality_map = {
            'low': '-ql',
            'medium': '-qm', 
            'high': '-qh'
        }
        
        quality_flag = quality_map.get(quality, '-qm')
        
        try:
            # Run manim command
            cmd = [
                'manim', 
                script_path, 
                scene_name,
                quality_flag,
                '--media_dir', self.temp_dir
            ]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Manim rendering failed: {result.stderr}")
                
            # Find the generated video file
            video_files = list(Path(self.temp_dir).rglob("*.mp4"))
            if not video_files:
                raise Exception("No video file generated")
                
            return str(video_files[0])
            
        except subprocess.TimeoutExpired:
            raise Exception("Rendering timeout exceeded")
        except Exception as e:
            logging.error(f"Rendering error: {str(e)}")
            raise
    
    def upload_to_storage(self, local_path, remote_path):
        """Upload video to Google Cloud Storage"""
        blob = bucket.blob(remote_path)
        blob.upload_from_filename(local_path)
        
        # Make the blob publicly readable
        blob.make_public()
        
        return blob.public_url
    
    def cleanup(self):
        """Clean up temporary files"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': time.time()})

@app.route('/render', methods=['POST'])
def render_video():
    """Main video rendering endpoint"""
    start_time = time.time()
    renderer = None
    
    try:
        # Parse request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        script = data.get('script')
        topic = data.get('topic', 'Educational Video')
        quality = data.get('quality', 'medium')
        scene_name = data.get('scene_name', 'MainScene')
        
        if not script:
            return jsonify({'error': 'Script is required'}), 400
        
        # Generate unique identifier
        video_id = str(uuid.uuid4())
        
        # Initialize renderer
        renderer = ManimRenderer()
        
        # Create script file
        script_filename = f"script_{video_id}"
        script_path = renderer.create_script_file(script, script_filename)
        
        logging.info(f"Rendering video {video_id} with topic: {topic}")
        
        # Render video
        video_path = renderer.render_video(script_path, scene_name, quality)
        
        # Upload to Cloud Storage
        remote_path = f"videos/{video_id}.mp4"
        video_url = renderer.upload_to_storage(video_path, remote_path)
        
        # Calculate render time
        render_time = time.time() - start_time
        
        # Get file size
        file_size = os.path.getsize(video_path)
        
        logging.info(f"Video {video_id} rendered successfully in {render_time:.2f}s")
        
        return jsonify({
            'videoId': video_id,
            'videoUrl': video_url,
            'renderTime': render_time,
            'fileSize': file_size,
            'status': 'completed',
            'topic': topic,
            'quality': quality
        })
        
    except Exception as e:
        error_msg = str(e)
        logging.error(f"Rendering failed: {error_msg}")
        
        return jsonify({
            'error': error_msg,
            'status': 'failed',
            'renderTime': time.time() - start_time
        }), 500
        
    finally:
        if renderer:
            renderer.cleanup()

@app.route('/status/<video_id>', methods=['GET'])
def get_video_status(video_id):
    """Get video rendering status"""
    try:
        # Check if video exists in storage
        blob = bucket.blob(f"videos/{video_id}.mp4")
        
        if blob.exists():
            return jsonify({
                'videoId': video_id,
                'status': 'completed',
                'videoUrl': blob.public_url,
                'fileSize': blob.size,
                'createdAt': blob.time_created.isoformat()
            })
        else:
            return jsonify({
                'videoId': video_id,
                'status': 'not_found'
            }), 404
            
    except Exception as e:
        logging.error(f"Status check failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete/<video_id>', methods=['DELETE'])
def delete_video(video_id):
    """Delete video from storage"""
    try:
        blob = bucket.blob(f"videos/{video_id}.mp4")
        
        if blob.exists():
            blob.delete()
            return jsonify({
                'videoId': video_id,
                'status': 'deleted'
            })
        else:
            return jsonify({
                'videoId': video_id,
                'status': 'not_found'
            }), 404
            
    except Exception as e:
        logging.error(f"Delete failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
```

## Deployment Configuration

### Cloud Run Service YAML
**File:** `service.yaml`

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: manim-renderer
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "4Gi"
        run.googleapis.com/cpu: "2"
        run.googleapis.com/timeout: "600s"
        run.googleapis.com/max-instances: "10"
        run.googleapis.com/min-instances: "0"
    spec:
      containerConcurrency: 1
      containers:
      - image: gcr.io/PROJECT_ID/manim-renderer:latest
        ports:
        - containerPort: 8080
        env:
        - name: STORAGE_BUCKET
          value: "manim-videos-bucket"
        - name: GOOGLE_CLOUD_PROJECT
          value: "PROJECT_ID"
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
        startupProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          timeoutSeconds: 5
          periodSeconds: 10
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          timeoutSeconds: 5
          periodSeconds: 30
```

## Deployment Scripts

### Build and Deploy Script
**File:** `deploy.sh`

```bash
#!/bin/bash

# Set variables
PROJECT_ID="your-project-id"
SERVICE_NAME="manim-renderer"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Build the container image
echo "Building container image..."
docker build -t ${IMAGE_NAME}:latest .

# Push the image to Google Container Registry
echo "Pushing image to GCR..."
docker push ${IMAGE_NAME}:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 600 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 1 \
  --set-env-vars STORAGE_BUCKET=manim-videos-bucket,GOOGLE_CLOUD_PROJECT=${PROJECT_ID}

echo "Deployment complete!"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
echo "Service URL: ${SERVICE_URL}"
```

### Environment Setup Script
**File:** `setup-gcp.sh`

```bash
#!/bin/bash

PROJECT_ID="your-project-id"
BUCKET_NAME="manim-videos-bucket"
SERVICE_ACCOUNT="manim-renderer-sa"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable logging.googleapis.com

# Create storage bucket
echo "Creating storage bucket..."
gsutil mb gs://${BUCKET_NAME}
gsutil iam ch allUsers:objectViewer gs://${BUCKET_NAME}

# Create service account
echo "Creating service account..."
gcloud iam service-accounts create ${SERVICE_ACCOUNT} \
  --display-name="Manim Renderer Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"

echo "Setup complete!"
```

## Client Integration

### Next.js API Integration
**File:** `src/lib/cloudRun.ts`

```typescript
interface RenderRequest {
  script: string;
  topic: string;
  quality?: 'low' | 'medium' | 'high';
  scene_name?: string;
}

interface RenderResponse {
  videoId: string;
  videoUrl: string;
  renderTime: number;
  fileSize: number;
  status: 'completed' | 'failed';
  topic: string;
  quality: string;
}

interface VideoStatus {
  videoId: string;
  status: 'completed' | 'not_found';
  videoUrl?: string;
  fileSize?: number;
  createdAt?: string;
}

export class CloudRunClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string, authToken?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authToken = authToken;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  async renderVideo(request: RenderRequest): Promise<RenderResponse> {
    return this.makeRequest<RenderResponse>('/render', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getVideoStatus(videoId: string): Promise<VideoStatus> {
    return this.makeRequest<VideoStatus>(`/status/${videoId}`);
  }

  async deleteVideo(videoId: string): Promise<{ videoId: string; status: string }> {
    return this.makeRequest(`/delete/${videoId}`, {
      method: 'DELETE',
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    return this.makeRequest('/health');
  }
}

// Export configured instance
export const cloudRunClient = new CloudRunClient(
  process.env.CLOUD_RUN_RENDER_URL!,
  process.env.GOOGLE_CLOUD_TOKEN
);
```

## Monitoring and Logging

### Cloud Monitoring Setup
**File:** `monitoring.yaml`

```yaml
# Uptime check configuration
displayName: "Manim Renderer Health Check"
httpCheck:
  path: "/health"
  port: 443
  useSsl: true
monitoredResource:
  type: "uptime_url"
  labels:
    project_id: "your-project-id"
    host: "your-service-url"
timeout: "10s"
period: "60s"
```

### Custom Metrics
**File:** `metrics.py`

```python
from google.cloud import monitoring_v3
import time

class MetricsCollector:
    def __init__(self, project_id):
        self.client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{project_id}"
        
    def record_render_time(self, render_time, quality):
        """Record video rendering time"""
        series = monitoring_v3.TimeSeries()
        series.metric.type = "custom.googleapis.com/manim/render_time"
        series.resource.type = "cloud_run_revision"
        
        # Add labels
        series.metric.labels["quality"] = quality
        
        # Create data point
        point = monitoring_v3.Point()
        point.value.double_value = render_time
        point.interval.end_time.seconds = int(time.time())
        series.points = [point]
        
        # Write time series
        self.client.create_time_series(
            name=self.project_name,
            time_series=[series]
        )
    
    def record_render_success(self, quality):
        """Record successful render"""
        series = monitoring_v3.TimeSeries()
        series.metric.type = "custom.googleapis.com/manim/render_success"
        series.resource.type = "cloud_run_revision"
        
        series.metric.labels["quality"] = quality
        
        point = monitoring_v3.Point()
        point.value.int64_value = 1
        point.interval.end_time.seconds = int(time.time())
        series.points = [point]
        
        self.client.create_time_series(
            name=self.project_name,
            time_series=[series]
        )
```

## Error Handling and Retry Logic

### Retry Configuration
**File:** `src/lib/retryConfig.ts`

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

## Environment Variables

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
CLOUD_RUN_RENDER_URL=https://manim-renderer-xxx-uc.a.run.app
GOOGLE_CLOUD_TOKEN=your-access-token

# Storage Configuration
STORAGE_BUCKET=manim-videos-bucket
STORAGE_REGION=us-central1

# Service Configuration
PORT=8080
RENDER_TIMEOUT=600
MAX_CONCURRENT_RENDERS=1
```

## Security Considerations

1. **Authentication**: Use Google Cloud IAM for service-to-service authentication
2. **Network Security**: Configure VPC and firewall rules appropriately
3. **Resource Limits**: Set appropriate CPU, memory, and timeout limits
4. **Input Validation**: Sanitize and validate all script inputs
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Monitoring**: Set up comprehensive logging and monitoring
7. **Secrets Management**: Use Google Secret Manager for sensitive data

## Performance Optimization

1. **Container Optimization**: Use multi-stage builds to reduce image size
2. **Caching**: Implement caching for frequently used assets
3. **Concurrency**: Configure appropriate concurrency settings
4. **Auto-scaling**: Set up proper min/max instance configuration
5. **Resource Allocation**: Optimize CPU and memory allocation based on workload
6. **Cold Start Mitigation**: Consider using minimum instances for critical services 