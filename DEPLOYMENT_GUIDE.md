# ManimNext Deployment Guide

This guide provides step-by-step instructions for deploying ManimNext, with separate phases for testing Google Cloud rendering independently and then deploying the full application to Vercel.

## 📋 Prerequisites

Before starting, ensure you have:

- **Google Cloud Platform Account** with billing enabled
- **Google Cloud SDK** (`gcloud`) installed and configured
- **Docker** installed and running
- **Node.js** 18+ and npm/yarn
- **Git** for version control
- **jq** for JSON processing (optional but recommended)

## 🔧 Environment Setup

### 1. Install Required Tools

```bash
# Install Google Cloud SDK (if not already installed)
# macOS
brew install google-cloud-sdk

# Ubuntu/Debian
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Windows - Download from https://cloud.google.com/sdk/docs/install

# Install Docker (if not already installed)
# macOS
brew install docker

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io

# Install jq for JSON processing
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### 2. Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# List available projects
gcloud projects list

# Create a new project (optional)
gcloud projects create manim-next-[UNIQUE-ID] --name="ManimNext"

# Set your project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

## 🚀 Phase 1: Google Cloud Rendering Service

### Step 1: Navigate to Cloud Render Directory

```bash
cd cloud-render
```

### Step 2: Configure Environment Variables

```bash
# Set required environment variables
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_REGION="us-central1"  # or your preferred region
export GCS_BUCKET_NAME="manim-next-videos-$(date +%s)"  # unique bucket name
```

### Step 3: Run Google Cloud Setup

```bash
# Make setup script executable
chmod +x setup-gcp.sh

# Run the setup script
./setup-gcp.sh
```

**What this script does:**
- Enables required Google Cloud APIs
- Creates service account with necessary permissions
- Creates Google Cloud Storage bucket
- Sets up Artifact Registry repository
- Configures IAM roles and permissions
- Creates `.env.gcp` configuration file

### Step 4: Build and Deploy Cloud Run Service

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy the service
./deploy.sh
```

**What this script does:**
- Builds Docker image with Manim and dependencies
- Pushes image to Google Artifact Registry
- Deploys service to Google Cloud Run
- Configures environment variables and resource limits
- Tests the health endpoint

### Step 5: Test the Cloud Rendering Service

#### 5.1 Quick Health Check

```bash
# Test health endpoint
./quick-test.sh
```

#### 5.2 Comprehensive Testing

```bash
# Run full test suite
./test-service.sh
```

#### 5.3 Manual Testing

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe manim-renderer \
  --region=$GOOGLE_CLOUD_REGION \
  --format="value(status.url)")

echo "Service URL: $SERVICE_URL"

# Test health endpoint
curl -s "$SERVICE_URL/health" | jq .

# Test rendering with a simple script
curl -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "from manim import *\n\nclass TestScene(Scene):\n    def construct(self):\n        text = Text(\"Hello from Cloud!\")\n        self.play(Write(text))\n        self.wait(2)",
    "quality": "low_quality",
    "format": "mp4"
  }' | jq .
```

#### 5.4 Test with Complex Script

```bash
# Test with a more complex Manim script
curl -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "from manim import *\n\nclass PythagoreanTheorem(Scene):\n    def construct(self):\n        title = Text(\"Pythagorean Theorem\", font_size=48)\n        title.set_color(BLUE)\n        title.to_edge(UP)\n        self.play(Write(title))\n        self.wait(1)\n        \n        # Create squares\n        square_a = Square(side_length=2, color=RED, fill_opacity=0.7)\n        square_b = Square(side_length=3, color=BLUE, fill_opacity=0.7)\n        square_c = Square(side_length=3.6, color=GREEN, fill_opacity=0.7)\n        \n        # Position squares\n        square_a.move_to([-3, 1, 0])\n        square_b.move_to([0, 1, 0])\n        square_c.move_to([3, 1, 0])\n        \n        self.play(Create(square_a))\n        self.wait(0.5)\n        self.play(Create(square_b))\n        self.wait(0.5)\n        self.play(Create(square_c))\n        self.wait(2)",
    "quality": "medium_quality",
    "format": "mp4"
  }' | jq .
```

### Step 6: Monitor and Debug

#### 6.1 View Logs

```bash
# View real-time logs
gcloud run services logs tail manim-renderer --region=$GOOGLE_CLOUD_REGION

# View recent logs
gcloud run services logs read manim-renderer --region=$GOOGLE_CLOUD_REGION --limit=50
```

#### 6.2 Check Service Status

```bash
# Get service details
gcloud run services describe manim-renderer --region=$GOOGLE_CLOUD_REGION

# Check revisions
gcloud run revisions list --service=manim-renderer --region=$GOOGLE_CLOUD_REGION
```

#### 6.3 Monitor Storage

```bash
# List files in storage bucket
gsutil ls -la gs://$GCS_BUCKET_NAME/

# Check bucket details
gsutil du -sh gs://$GCS_BUCKET_NAME/
```

### Step 7: Performance Testing

```bash
# Create a performance test script
cat > performance-test.sh << 'EOF'
#!/bin/bash

SERVICE_URL=$(gcloud run services describe manim-renderer \
  --region=$GOOGLE_CLOUD_REGION \
  --format="value(status.url)")

echo "🚀 Running performance tests..."

# Test multiple concurrent requests
for i in {1..5}; do
  echo "Starting request $i..."
  curl -X POST "$SERVICE_URL/render" \
    -H "Content-Type: application/json" \
    -d '{
      "script": "from manim import *\n\nclass Test'$i'(Scene):\n    def construct(self):\n        text = Text(\"Test '$i'\")\n        self.play(Write(text))\n        self.wait(1)",
      "quality": "low_quality",
      "format": "mp4"
    }' > "test_result_$i.json" &
done

wait
echo "✅ All requests completed"

# Show results
for i in {1..5}; do
  echo "Result $i:"
  cat "test_result_$i.json" | jq '.success, .render_time, .file_size'
  echo "---"
done
EOF

chmod +x performance-test.sh
./performance-test.sh
```

## 🌐 Phase 2: Next.js Application Deployment

### Step 1: Return to Project Root

```bash
cd ..  # Back to project root
```

### Step 2: Configure Environment Variables

Create environment files for different environments:

#### 2.1 Local Development (.env.local)

```bash
cat > .env.local << EOF
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Google Cloud Configuration (for local testing)
GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
CLOUD_RUN_SERVICE_URL=$SERVICE_URL
NEXT_PUBLIC_CLOUD_RUN_SERVICE_URL=$SERVICE_URL

# Development settings
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
EOF
```

#### 2.2 Production Environment (.env.production)

```bash
cat > .env.production << EOF
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
CLOUD_RUN_SERVICE_URL=$SERVICE_URL
NEXT_PUBLIC_CLOUD_RUN_SERVICE_URL=$SERVICE_URL

# Production settings
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
EOF
```

### Step 3: Test Local Integration

```bash
# Install dependencies
npm install

# Test the application locally
npm run dev
```

Open http://localhost:3000 and test:
1. Script generation with OpenRouter
2. Cloud rendering integration
3. End-to-end workflow

### Step 4: Build and Test Production Build

```bash
# Create production build
npm run build

# Test production build locally
npm start
```

### Step 5: Deploy to Vercel

#### 5.1 Install Vercel CLI

```bash
npm install -g vercel
```

#### 5.2 Login to Vercel

```bash
vercel login
```

#### 5.3 Configure Vercel Project

```bash
# Initialize Vercel project
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? manim-next
# - Directory? ./
# - Override settings? No
```

#### 5.4 Set Environment Variables in Vercel

```bash
# Set production environment variables
vercel env add OPENROUTER_API_KEY production
# Enter your OpenRouter API key when prompted

vercel env add GOOGLE_CLOUD_PROJECT production
# Enter your Google Cloud project ID

vercel env add CLOUD_RUN_SERVICE_URL production
# Enter your Cloud Run service URL

vercel env add NEXT_PUBLIC_CLOUD_RUN_SERVICE_URL production
# Enter your Cloud Run service URL (same as above)

# Set preview environment variables (optional)
vercel env add OPENROUTER_API_KEY preview
vercel env add GOOGLE_CLOUD_PROJECT preview
vercel env add CLOUD_RUN_SERVICE_URL preview
vercel env add NEXT_PUBLIC_CLOUD_RUN_SERVICE_URL preview
```

#### 5.5 Deploy to Production

```bash
# Deploy to production
vercel --prod
```

### Step 6: Post-Deployment Testing

#### 6.1 Test Production Deployment

```bash
# Get deployment URL
VERCEL_URL=$(vercel ls | grep manim-next | head -1 | awk '{print $2}')
echo "Deployment URL: https://$VERCEL_URL"

# Test the deployment
curl -s "https://$VERCEL_URL/api/health" | jq .
```

#### 6.2 End-to-End Testing

1. **Visit your Vercel deployment URL**
2. **Test script generation:**
   - Enter a topic like "simple math"
   - Verify script generation works
3. **Test cloud rendering:**
   - Generate a script
   - Click "Render Video"
   - Verify the video is rendered and stored in Google Cloud Storage

## 🔧 Troubleshooting

### Google Cloud Issues

#### Service Won't Start
```bash
# Check service logs
gcloud run services logs tail manim-renderer --region=$GOOGLE_CLOUD_REGION

# Check service configuration
gcloud run services describe manim-renderer --region=$GOOGLE_CLOUD_REGION
```

#### Rendering Failures
```bash
# Check for common issues:
# 1. Memory limits
# 2. Timeout settings
# 3. Script validation errors

# Update service with more resources
gcloud run services update manim-renderer \
  --memory=4Gi \
  --cpu=4 \
  --timeout=3600 \
  --region=$GOOGLE_CLOUD_REGION
```

#### Storage Issues
```bash
# Check bucket permissions
gsutil iam get gs://$GCS_BUCKET_NAME

# Test bucket access
gsutil ls gs://$GCS_BUCKET_NAME
```

### Vercel Deployment Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Missing dependencies

# Test build locally
npm run build
```

#### Runtime Errors
```bash
# Check Vercel function logs
vercel logs

# Test API endpoints
curl -s "https://your-app.vercel.app/api/health"
```

### Integration Issues

#### CORS Errors
- Ensure Cloud Run service allows requests from your Vercel domain
- Check CORS configuration in `cloud-render/app.py`

#### Authentication Issues
- Verify Google Cloud service account permissions
- Check API keys are correctly set in Vercel environment variables

## 📊 Monitoring and Maintenance

### Google Cloud Monitoring

```bash
# Set up monitoring alerts
gcloud alpha monitoring policies create --policy-from-file=monitoring-policy.yaml
```

### Cost Optimization

```bash
# Set up budget alerts
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="ManimNext Budget" \
  --budget-amount=50USD \
  --threshold-rule=percent=90
```

### Regular Maintenance

1. **Monitor storage usage and clean up old videos**
2. **Review Cloud Run logs for errors**
3. **Update dependencies regularly**
4. **Monitor API usage and costs**

## 🎉 Success Checklist

- [ ] Google Cloud setup completed successfully
- [ ] Cloud Run service deployed and responding
- [ ] Storage bucket created and accessible
- [ ] Test rendering works with simple script
- [ ] Test rendering works with complex script
- [ ] Next.js application builds successfully
- [ ] Local integration testing passed
- [ ] Vercel deployment successful
- [ ] Production environment variables configured
- [ ] End-to-end workflow tested
- [ ] Monitoring and alerts configured

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Manim Documentation](https://docs.manim.community/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

**Note:** Replace placeholder values like `your-project-id`, `your_openrouter_api_key_here`, etc., with your actual values throughout this guide. 