# Quick Start: Test Google Cloud Rendering Only

This guide helps you test the Google Cloud rendering service independently before deploying to Vercel.

## 🚀 Quick Setup (5 minutes)

### 1. Prerequisites Check
```bash
# Check if you have the required tools
gcloud --version
docker --version
jq --version
```

If any are missing, install them:
```bash
# macOS
brew install google-cloud-sdk docker jq

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install google-cloud-sdk docker.io jq
```

### 2. Google Cloud Authentication
```bash
# Login to Google Cloud
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set your project (replace with your project ID)
gcloud config set project YOUR_PROJECT_ID
```

### 3. Deploy Cloud Rendering Service
```bash
# Navigate to cloud render directory
cd cloud-render

# Run setup (creates resources)
chmod +x setup-gcp.sh
./setup-gcp.sh

# Deploy the service
chmod +x deploy.sh
./deploy.sh

# Return to project root
cd ..
```

### 4. Test the Service
```bash
# Run comprehensive tests
./test-gcp-only.sh
```

## 🧪 What the Test Does

The test script will:

1. **Health Check** - Verify service is running
2. **Simple Rendering** - Test basic Manim script
3. **Complex Rendering** - Test advanced animations
4. **Error Handling** - Verify invalid scripts are rejected
5. **Storage Check** - Confirm videos are saved to Google Cloud Storage
6. **Performance Test** - Measure rendering speed

## ✅ Expected Results

If everything works correctly, you should see:

```
🧪 Testing Google Cloud Rendering Service Only

📋 Current Google Cloud Project: your-project-id
🔍 Checking if service exists in region: us-central1
✅ Service found: https://manim-renderer-xxx-uc.a.run.app

🏥 Test 1: Health Check
✅ Health check passed

🎬 Test 2: Simple Script Rendering
✅ Simple rendering successful

🧮 Test 3: Complex Script Rendering
✅ Complex rendering successful

🚫 Test 4: Error Handling (Invalid Script)
✅ Error handling works correctly

💾 Test 5: Storage Verification
✅ Storage bucket accessible

⚡ Test 6: Performance Check
✅ Performance test completed

🎉 Google Cloud Testing Complete!
```

## 🔧 Troubleshooting

### Common Issues

**Service not found:**
```bash
cd cloud-render
./setup-gcp.sh
./deploy.sh
```

**Authentication errors:**
```bash
gcloud auth login
gcloud auth application-default login
```

**Permission denied:**
```bash
chmod +x test-gcp-only.sh
chmod +x cloud-render/setup-gcp.sh
chmod +x cloud-render/deploy.sh
```

**Docker not running:**
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker
```

## 📋 Next Steps

Once all tests pass:

1. **Note your service URL** (saved in `gcp-service-info.json`)
2. **Proceed to Vercel deployment** using `DEPLOYMENT_GUIDE.md`
3. **Set environment variables** in Vercel with your service URL

## 🎯 Quick Commands Reference

```bash
# Test Google Cloud only
./test-gcp-only.sh

# View service logs
gcloud run services logs tail manim-renderer --region=us-central1

# Check service status
gcloud run services describe manim-renderer --region=us-central1

# List storage bucket contents
gsutil ls gs://your-bucket-name/

# Redeploy service
cd cloud-render && ./deploy.sh
```

---

**Time to complete:** ~10-15 minutes (including setup)
**Cost:** ~$0.10-0.50 for testing (Google Cloud free tier covers most usage) 