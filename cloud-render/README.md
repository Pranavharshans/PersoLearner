# Manim Cloud Rendering Service

A scalable Google Cloud Run service for rendering Manim animations from Python scripts. This service provides a REST API for submitting Manim scripts and receiving rendered videos stored in Google Cloud Storage.

## 🚀 Features

- **Scalable Rendering**: Automatic scaling based on demand using Google Cloud Run
- **Secure Script Validation**: Built-in security checks for submitted scripts
- **Cloud Storage Integration**: Automatic upload of rendered videos to Google Cloud Storage
- **Monitoring & Logging**: Comprehensive logging and custom metrics with Google Cloud Monitoring
- **Multiple Quality Options**: Support for different rendering qualities (low, medium, high)
- **Format Support**: MP4 and other video formats
- **Health Monitoring**: Built-in health checks and status endpoints

## 📋 Prerequisites

- Google Cloud Platform account with billing enabled
- Google Cloud SDK (`gcloud`) installed and configured
- Docker installed
- `jq` installed (for JSON processing in test scripts)

## 🛠️ Setup

### 1. Clone and Navigate

```bash
cd cloud-render
```

### 2. Configure Environment

Set your Google Cloud project ID:

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_REGION="us-central1"  # Optional, defaults to us-central1
```

### 3. Run Setup Script

```bash
./setup-gcp.sh
```

This script will:
- Enable required Google Cloud APIs
- Create a service account with necessary permissions
- Create a Google Cloud Storage bucket for video storage
- Set up Artifact Registry repository
- Configure IAM roles and permissions
- Create environment configuration files

### 4. Deploy the Service

```bash
./deploy.sh
```

This script will:
- Build the Docker image with Manim and dependencies
- Push the image to Google Artifact Registry
- Deploy the service to Google Cloud Run
- Configure environment variables and resource limits
- Test the health endpoint

## 🧪 Testing

### Quick Test

```bash
./quick-test.sh
```

### Comprehensive Test

```bash
./test-service.sh
```

### Manual Testing

Test the health endpoint:
```bash
curl https://your-service-url/health
```

Test rendering with a simple script:
```bash
curl -X POST https://your-service-url/render \
  -H "Content-Type: application/json" \
  -d '{
    "script": "from manim import *\n\nclass TestScene(Scene):\n    def construct(self):\n        text = Text(\"Hello World!\")\n        self.play(Write(text))\n        self.wait(2)",
    "quality": "medium_quality",
    "format": "mp4"
  }'
```

## 📡 API Reference

### Health Check

**GET** `/health`

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "manim-renderer",
  "revision": "manim-renderer-00001-abc",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Render Video

**POST** `/render`

Renders a Manim script and returns the video information.

**Request Body:**
```json
{
  "script": "from manim import *\n\nclass MyScene(Scene):\n    def construct(self):\n        # Your Manim code here",
  "quality": "medium_quality",  // Optional: low_quality, medium_quality, high_quality
  "format": "mp4",              // Optional: mp4, mov, etc.
  "scene_name": "MyScene"       // Optional: specific scene class name
}
```

**Response (Success):**
```json
{
  "success": true,
  "request_id": "uuid-string",
  "video_file": "/app/output/uuid/video.mp4",
  "gcs_url": "gs://bucket-name/videos/uuid/video.mp4",
  "blob_name": "videos/uuid/video.mp4",
  "file_size": 1234567,
  "render_time": 45.2,
  "quality": "medium_quality",
  "format": "mp4",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error description",
  "request_id": "uuid-string",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Get Render Status

**GET** `/status/<request_id>`

Returns the status of a rendering request (placeholder endpoint).

## 🔧 Configuration

### Environment Variables

The service supports the following environment variables:

- `GOOGLE_CLOUD_PROJECT`: Google Cloud project ID
- `GCS_BUCKET_NAME`: Google Cloud Storage bucket name
- `MAX_RENDER_TIME`: Maximum rendering time in seconds (default: 3600)
- `DEFAULT_QUALITY`: Default rendering quality (default: medium_quality)
- `DEFAULT_FORMAT`: Default video format (default: mp4)

### Resource Limits

Default Cloud Run configuration:
- **Memory**: 2GiB
- **CPU**: 2 vCPU
- **Timeout**: 3600 seconds (1 hour)
- **Concurrency**: 1 (to avoid resource conflicts)
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10

## 🔒 Security

### Script Validation

The service includes built-in security measures:
- Blocks dangerous Python functions (`subprocess`, `eval`, `exec`, etc.)
- Validates Manim script structure
- Runs in isolated containers
- Uses non-root user in containers

### IAM and Permissions

- Service account with minimal required permissions
- Bucket access restricted to service account
- Cloud Run service can be configured for authentication

## 📊 Monitoring

### Logs

View service logs:
```bash
gcloud run services logs tail manim-renderer --region=us-central1
```

### Metrics

The service reports custom metrics to Google Cloud Monitoring:
- `custom.googleapis.com/manim/render_time`: Rendering duration
- `custom.googleapis.com/manim/success_rate`: Success/failure rate

### Health Checks

Built-in health check endpoint at `/health` with:
- Service status
- Timestamp
- Service revision information

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Ensure Docker is running
   - Check internet connectivity for package downloads
   - Verify Google Cloud authentication

2. **Deployment Failures**
   - Check Google Cloud quotas
   - Verify service account permissions
   - Ensure APIs are enabled

3. **Rendering Failures**
   - Check script syntax
   - Verify Manim imports
   - Review security validation errors

4. **Storage Issues**
   - Verify bucket permissions
   - Check bucket exists
   - Ensure service account has storage.admin role

### Debug Commands

```bash
# Check service status
gcloud run services describe manim-renderer --region=us-central1

# View recent logs
gcloud run services logs tail manim-renderer --region=us-central1 --limit=50

# Test locally (if Docker image built)
docker run -p 8080:8080 -e GOOGLE_CLOUD_PROJECT=your-project your-image

# Check bucket permissions
gsutil iam get gs://your-bucket-name
```

## 🔄 Updates and Maintenance

### Updating the Service

1. Make changes to the code
2. Run `./deploy.sh` to rebuild and redeploy
3. Test with `./quick-test.sh`

### Scaling Configuration

Update resource limits in `.env.gcp` and redeploy:
```bash
# Edit .env.gcp
MEMORY=4Gi
CPU=4
MAX_INSTANCES=20

# Redeploy
./deploy.sh
```

### Cleanup

To remove all resources:
```bash
# Delete Cloud Run service
gcloud run services delete manim-renderer --region=us-central1

# Delete storage bucket (WARNING: This deletes all videos)
gsutil rm -r gs://your-bucket-name

# Delete Artifact Registry repository
gcloud artifacts repositories delete manim-renderer --location=us-central1
```

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Manim Community Documentation](https://docs.manim.community/)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 