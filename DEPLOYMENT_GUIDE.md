# ManimNext Deployment Guide for Beginners

This comprehensive guide will walk you through deploying ManimNext step-by-step. **No prior experience with cloud deployment required!** We'll explain everything from the basics.

## 🎯 What We're Building

**ManimNext** is a web application that:
1. **Generates Python scripts** for creating mathematical animations using AI
2. **Renders videos** in the cloud using Google Cloud Run (serverless - only pay when used)
3. **Serves the web interface** via Vercel (also serverless and free for small projects)

**Why This Architecture?**
- **Cost-effective**: You only pay when someone renders a video
- **Scalable**: Automatically handles traffic spikes
- **Reliable**: Uses enterprise-grade cloud services

## 📋 What You'll Need Before Starting

### Required Accounts (All Free to Start)
1. **Google Cloud Platform Account**
   - Go to [cloud.google.com](https://cloud.google.com)
   - Click "Get started for free"
   - You'll get $300 in free credits (enough for thousands of video renders)
   - **Important**: You need a credit card for verification, but won't be charged initially

2. **Vercel Account** 
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account (recommended)
   - Completely free for personal projects

3. **OpenRouter Account** (for AI script generation)
   - Go to [openrouter.ai](https://openrouter.ai)
   - Sign up and add $5-10 credit (each script generation costs ~$0.01-0.05)

### Required Software
We'll install these together in the next section:
- **Google Cloud SDK** (command-line tools for Google Cloud)
- **Docker** (for packaging our application)
- **Node.js** (for running the web application)
- **Git** (for version control)

## 🔧 Step-by-Step Environment Setup

### Step 1: Install Google Cloud SDK

The Google Cloud SDK lets you control Google Cloud from your computer's terminal/command prompt.

#### For macOS:
```bash
# First, install Homebrew if you don't have it (package manager for macOS)
# Open Terminal and run:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Google Cloud SDK
brew install google-cloud-sdk
```

#### For Windows:
1. Go to [Google Cloud SDK Install Page](https://cloud.google.com/sdk/docs/install)
2. Download the Windows installer
3. Run the installer and follow the prompts
4. **Important**: Check "Add gcloud to PATH" during installation

#### For Ubuntu/Linux:
```bash
# Add Google Cloud SDK repository
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# Import Google Cloud public key
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -

# Update and install
sudo apt-get update && sudo apt-get install google-cloud-cli
```

**Verify Installation:**
```bash
# Open a new terminal/command prompt and run:
gcloud --version
# You should see version information
```

### Step 2: Install Docker

Docker packages our application so it runs consistently anywhere.

#### For macOS:
```bash
# Install Docker using Homebrew
brew install docker

# Or download Docker Desktop from docker.com and install manually
```

#### For Windows:
1. Go to [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. Download and install Docker Desktop
3. **Important**: Enable WSL 2 if prompted (Windows Subsystem for Linux)

#### For Ubuntu/Linux:
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker.io

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

**Verify Installation:**
```bash
# Test Docker installation
docker --version
# You should see version information

# Test Docker is running
docker run hello-world
# You should see a "Hello from Docker!" message
```

### Step 3: Install Node.js and npm

Node.js runs our web application.

#### For macOS:
```bash
# Install Node.js using Homebrew
brew install node
```

#### For Windows:
1. Go to [nodejs.org](https://nodejs.org)
2. Download the LTS version (recommended)
3. Run the installer with default settings

#### For Ubuntu/Linux:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify Installation:**
```bash
# Check Node.js version
node --version
# Should show v18.x.x or higher

# Check npm version
npm --version
# Should show version information
```

### Step 4: Install Additional Tools

#### Install jq (JSON processor - makes working with API responses easier)

**macOS:**
```bash
brew install jq
```

**Windows:**
```bash
# Using Chocolatey (install Chocolatey first from chocolatey.org)
choco install jq

# Or download from https://stedolan.github.io/jq/download/
```

**Ubuntu/Linux:**
```bash
sudo apt-get install jq
```

#### Install Git (if not already installed)

**macOS:**
```bash
# Git comes with Xcode command line tools
xcode-select --install
```

**Windows:**
```bash
# Download from git-scm.com and install
```

**Ubuntu/Linux:**
```bash
sudo apt-get install git
```

## 🔐 Setting Up Google Cloud (Detailed)

### Step 1: Create and Configure Google Cloud Project

#### 1.1 Login to Google Cloud
```bash
# This will open a browser window for you to login
gcloud auth login
```
**What happens:** A browser window opens, you login with your Google account, then return to terminal.

#### 1.2 Set up Application Default Credentials
```bash
# This allows your applications to authenticate with Google Cloud
gcloud auth application-default login
```
**What happens:** Another browser login, but this time for application access.

#### 1.3 Create a New Project
```bash
# List existing projects (if any)
gcloud projects list

# Create a new project (replace 'my-unique-id' with something unique)
# Project IDs must be globally unique across all Google Cloud users
gcloud projects create manim-next-$(date +%s) --name="ManimNext"
```

**Example output:**
```
Create in progress for [https://cloudresourcemanager.googleapis.com/v1/projects/manim-next-1703123456].
Waiting for [operations/cp.123456789] to finish...done.
```

#### 1.4 Set Your Project as Default
```bash
# Get your project ID from the previous step
export GOOGLE_CLOUD_PROJECT="manim-next-1703123456"  # Replace with your actual project ID

# Set it as default
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Verify it's set correctly
gcloud config get-value project
```

#### 1.5 Enable Billing (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project from the dropdown at the top
3. Go to "Billing" in the left menu
4. Link a billing account (you won't be charged immediately due to free credits)

**Why billing is required:** Even though you have free credits, Google requires a billing account to prevent abuse.

### Step 2: Set Environment Variables

Create a file to store your configuration:

```bash
# Create a file to store environment variables
cat > ~/.manimnext-config << EOF
# Your Google Cloud Project ID
export GOOGLE_CLOUD_PROJECT="$GOOGLE_CLOUD_PROJECT"

# Region where your services will run (us-central1 is usually cheapest)
export GOOGLE_CLOUD_REGION="us-central1"

# Unique name for your storage bucket (must be globally unique)
export GCS_BUCKET_NAME="manim-next-videos-$(date +%s)"
EOF

# Load the configuration
source ~/.manimnext-config

# Add to your shell profile so it loads automatically
echo "source ~/.manimnext-config" >> ~/.bashrc  # For bash
echo "source ~/.manimnext-config" >> ~/.zshrc   # For zsh (macOS default)
```

**What this does:** Sets up variables we'll use throughout the deployment process.

## 🚀 Phase 1: Deploy the Video Rendering Service

### Step 1: Get the Project Code

```bash
# Navigate to where you want to store the project
cd ~/Desktop  # or wherever you prefer

# Clone the repository (download the code)
git clone https://github.com/your-username/ManimNext.git  # Replace with actual repo
cd ManimNext

# Verify you're in the right place
ls -la
# You should see folders like 'cloud-render', 'src', 'components', etc.
```

### Step 2: Navigate to Cloud Render Directory

```bash
# Go to the cloud rendering service folder
cd cloud-render

# See what's in here
ls -la
# You should see files like 'setup-gcp.sh', 'deploy.sh', 'Dockerfile', etc.
```

### Step 3: Make Scripts Executable

```bash
# Make the setup and deployment scripts executable
chmod +x setup-gcp.sh
chmod +x deploy.sh
chmod +x quick-test.sh
chmod +x test-service.sh

# Verify permissions
ls -la *.sh
# You should see 'x' in the permissions for each script
```

### Step 4: Run Google Cloud Setup

This script will set up all the Google Cloud services we need.

```bash
# Run the setup script
./setup-gcp.sh
```

**What this script does (in detail):**

1. **Enables Google Cloud APIs:**
   - Cloud Run API (for serverless containers)
   - Cloud Storage API (for storing videos)
   - Artifact Registry API (for storing Docker images)
   - Cloud Build API (for building Docker images)

2. **Creates a Service Account:**
   - A "robot user" that your application uses to access Google Cloud
   - Gets permissions to read/write storage and run services

3. **Creates Storage Bucket:**
   - Where your rendered videos will be stored
   - Configured for public read access (so videos can be viewed)

4. **Sets up Artifact Registry:**
   - Where your Docker image will be stored
   - Like a private Docker Hub for your project

5. **Creates Configuration File:**
   - `.env.gcp` with all your settings

**Expected output:**
```
✅ Enabling Cloud Run API...
✅ Enabling Cloud Storage API...
✅ Enabling Artifact Registry API...
✅ Creating service account...
✅ Creating storage bucket...
✅ Setting up Artifact Registry...
✅ Configuration saved to .env.gcp
```

**If you see errors:**
- Make sure billing is enabled on your project
- Check that you have the correct project ID set
- Verify you're logged in: `gcloud auth list`

### Step 5: Deploy the Rendering Service

```bash
# Deploy the service to Google Cloud Run
./deploy.sh
```

**What this script does (in detail):**

1. **Builds Docker Image:**
   - Packages your Python application with all dependencies
   - Includes Manim, LaTeX, and other rendering tools
   - This can take 10-15 minutes the first time

2. **Pushes to Artifact Registry:**
   - Uploads your image to Google Cloud
   - Like uploading to a private app store

3. **Deploys to Cloud Run:**
   - Creates a serverless service
   - Configures memory (4GB) and CPU (4 cores)
   - Sets environment variables
   - Configures auto-scaling (0 to 100 instances)

4. **Tests the Deployment:**
   - Checks that the service is responding
   - Verifies the health endpoint

**Expected output:**
```
🔨 Building Docker image...
Step 1/15 : FROM python:3.11-slim
...
✅ Image built successfully

📤 Pushing to Artifact Registry...
✅ Image pushed successfully

🚀 Deploying to Cloud Run...
✅ Service deployed successfully

🧪 Testing deployment...
✅ Health check passed

Service URL: https://manim-renderer-xxx-uc.a.run.app
```

**This process takes time because:**
- Docker needs to download base images (Python, LaTeX, etc.)
- Installing Manim and dependencies takes several minutes
- First deployment includes cold start optimization

### Step 6: Test Your Rendering Service

#### 6.1 Quick Health Check

```bash
# Test that the service is running
./quick-test.sh
```

**Expected output:**
```
Testing health endpoint...
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
✅ Service is healthy!
```

#### 6.2 Test Video Rendering

```bash
# Test rendering a simple video
./test-service.sh
```

**What this does:**
1. Sends a simple Manim script to your service
2. Waits for the video to render
3. Downloads and verifies the result

**Expected output:**
```
🧪 Testing video rendering...

📝 Sending render request...
{
  "job_id": "render_123456789",
  "status": "processing",
  "message": "Render job started"
}

⏳ Waiting for render to complete...
✅ Render completed successfully!

📊 Results:
- Render time: 45 seconds
- File size: 2.3 MB
- Video URL: https://storage.googleapis.com/your-bucket/videos/render_123456789.mp4

🎬 Video details:
- Duration: 5 seconds
- Resolution: 1920x1080
- Format: MP4
```

#### 6.3 Manual Testing (Understanding the API)

Let's manually test the API to understand how it works:

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe manim-renderer \
  --region=$GOOGLE_CLOUD_REGION \
  --format="value(status.url)")

echo "Your service URL: $SERVICE_URL"
```

**Test the health endpoint:**
```bash
# This checks if the service is running
curl -s "$SERVICE_URL/health" | jq .
```

**Test rendering a simple animation:**
```bash
# This sends a Manim script to be rendered
curl -X POST "$SERVICE_URL/render" \
  -H "Content-Type: application/json" \
  -d '{
    "script": "from manim import *\n\nclass HelloWorld(Scene):\n    def construct(self):\n        text = Text(\"Hello from the Cloud!\")\n        text.set_color(BLUE)\n        self.play(Write(text))\n        self.wait(2)",
    "quality": "low_quality",
    "format": "mp4"
  }' | jq .
```

**Understanding the response:**
```json
{
  "success": true,
  "job_id": "render_1703123456789",
  "video_url": "https://storage.googleapis.com/your-bucket/videos/render_1703123456789.mp4",
  "render_time": 42.5,
  "file_size": 1048576,
  "message": "Video rendered successfully"
}
```

- `success`: Whether the render worked
- `job_id`: Unique identifier for this render
- `video_url`: Direct link to download the video
- `render_time`: How long it took (in seconds)
- `file_size`: Size of the video file (in bytes)

### Step 7: Monitor Your Service

#### 7.1 View Real-time Logs

```bash
# See what's happening in your service
gcloud run services logs tail manim-renderer --region=$GOOGLE_CLOUD_REGION
```

**What you'll see:**
- Incoming requests
- Render progress
- Any errors or warnings
- Performance metrics

#### 7.2 Check Service Status

```bash
# Get detailed information about your service
gcloud run services describe manim-renderer --region=$GOOGLE_CLOUD_REGION
```

**Key information to look for:**
- **URL**: Where your service is accessible
- **Status**: Should be "Ready"
- **CPU/Memory**: Resource allocation
- **Scaling**: Min/max instances

#### 7.3 Monitor Storage Usage

```bash
# See what videos have been created
gsutil ls -la gs://$GCS_BUCKET_NAME/

# Check total storage used
gsutil du -sh gs://$GCS_BUCKET_NAME/
```

**Example output:**
```
     2.1 MB  2024-01-15T10:30:00Z  gs://your-bucket/videos/render_123.mp4
     1.8 MB  2024-01-15T10:35:00Z  gs://your-bucket/videos/render_124.mp4
     
Total: 3.9 MB
```

## 🌐 Phase 2: Deploy the Web Application

Now we'll deploy the frontend that users will interact with.

### Step 1: Return to Project Root

```bash
# Go back to the main project directory
cd ..  # This takes you back to the ManimNext folder

# Verify you're in the right place
pwd
# Should show something like /Users/yourname/Desktop/ManimNext
```

### Step 2: Get Your OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up or log in
3. Go to "Keys" in your dashboard
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)
6. Add some credits ($5-10 is plenty to start)

### Step 3: Configure Environment Variables

#### 3.1 Create Local Development Environment

```bash
# Create environment file for local testing
cat > .env.local << EOF
# OpenRouter API Configuration (for AI script generation)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
CLOUD_RUN_SERVICE_URL=$SERVICE_URL
NEXT_PUBLIC_CLOUD_RUN_SERVICE_URL=$SERVICE_URL

# Development settings
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
EOF
```

**Important:** Replace `your_openrouter_api_key_here` with your actual API key!

```bash
# Edit the file to add your real API key
nano .env.local  # or use any text editor

# The file should look like:
# OPENROUTER_API_KEY=sk-or-v1-abc123def456...
```

#### 3.2 Create Production Environment File

```bash
# Create environment file for production deployment
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

### Step 4: Install Dependencies and Test Locally

```bash
# Install all required packages
npm install

# This might take a few minutes and will show output like:
# npm WARN deprecated package@version
# added 1234 packages in 45s
```

**If you see errors:**
- Make sure you have Node.js 18+ installed: `node --version`
- Try clearing npm cache: `npm cache clean --force`
- Delete node_modules and try again: `rm -rf node_modules && npm install`

```bash
# Start the development server
npm run dev
```

**Expected output:**
```
> manimnext@0.1.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully in 2.3s (18 modules)
```

**Test the application:**
1. Open your browser and go to `http://localhost:3000`
2. You should see the ManimNext interface
3. Try generating a script by entering a topic like "simple math"
4. Try rendering a video to test the full pipeline

**What to expect:**
- Script generation should work (using OpenRouter AI)
- Video rendering should work (using your Google Cloud service)
- The whole process might take 1-2 minutes for the first render

### Step 5: Build and Test Production Version

```bash
# Stop the development server (Ctrl+C)
# Then build the production version
npm run build
```

**Expected output:**
```
> manimnext@0.1.0 build
> next build

- info Creating an optimized production build...
- info Compiled successfully
- info Linting and checking validity of types...
- info Collecting page and component info...
- info Generating static pages (0/5)...
- info Generating static pages (5/5)
- info Finalizing page optimization...

Route (app)                              Size     First Load JS
┌ ○ /                                    5.02 kB        87.3 kB
├ ○ /api/generate-script                 0 B            87.3 kB
├ ○ /api/health                          0 B            87.3 kB
└ ○ /api/render                          0 B            87.3 kB

○  (Static)  automatically rendered as static HTML (uses no initial props)
```

```bash
# Test the production build locally
npm start
```

**Test again at `http://localhost:3000`** to make sure everything works in production mode.

## 🚀 Deploy to Vercel (Production)

### Step 1: Install Vercel CLI

```bash
# Install Vercel command-line tool globally
npm install -g vercel

# Verify installation
vercel --version
```

### Step 2: Login to Vercel

```bash
# Login to your Vercel account
vercel login
```

**What happens:**
1. You'll be asked to choose login method (GitHub recommended)
2. A browser window opens for authentication
3. You'll see "Success! GitHub authentication complete"

### Step 3: Deploy Your Application

```bash
# Initialize and deploy your project
vercel
```

**You'll be asked several questions:**

```
? Set up and deploy "~/Desktop/ManimNext"? [Y/n] y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] n
? What's your project's name? manimnext
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

**What happens next:**
1. Vercel uploads your code
2. Builds your application in the cloud
3. Deploys it to a URL like `https://manimnext-abc123.vercel.app`

**Expected output:**
```
🔗  Linked to yourname/manimnext (created .vercel and added it to .gitignore)
🔍  Inspect: https://vercel.com/yourname/manimnext/abc123
✅  Production: https://manimnext-abc123.vercel.app [2m 15s]
```

### Step 4: Configure Production Environment Variables

Your app is deployed but won't work yet because it doesn't have the API keys. Let's add them:

```bash
# Add OpenRouter API key
vercel env add OPENROUTER_API_KEY production
# When prompted, paste your OpenRouter API key

# Add Google Cloud project ID
vercel env add GOOGLE_CLOUD_PROJECT production
# When prompted, enter your Google Cloud project ID

# Add Cloud Run service URL
vercel env add CLOUD_RUN_SERVICE_URL production
# When prompted, enter your Cloud Run service URL

# Add public Cloud Run service URL (same as above)
vercel env add NEXT_PUBLIC_CLOUD_RUN_SERVICE_URL production
# When prompted, enter your Cloud Run service URL again
```

**To get your Cloud Run service URL:**
```bash
echo $SERVICE_URL
# Or run:
gcloud run services describe manim-renderer --region=$GOOGLE_CLOUD_REGION --format="value(status.url)"
```

### Step 5: Redeploy with Environment Variables

```bash
# Deploy again to production with the new environment variables
vercel --prod
```

**Expected output:**
```
🔍  Inspect: https://vercel.com/yourname/manimnext/def456
✅  Production: https://manimnext-abc123.vercel.app [1m 30s]
```

### Step 6: Test Your Production Deployment

#### 6.1 Basic Health Check

```bash
# Get your deployment URL
VERCEL_URL=$(vercel ls | grep manimnext | head -1 | awk '{print $2}')
echo "Your app is live at: https://$VERCEL_URL"

# Test the health API
curl -s "https://$VERCEL_URL/api/health" | jq .
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production"
}
```

#### 6.2 Full End-to-End Test

1. **Open your app:** Go to `https://your-app.vercel.app`
2. **Test script generation:**
   - Enter a topic like "quadratic equations"
   - Click "Generate Script"
   - You should see a Python script appear
3. **Test video rendering:**
   - Click "Render Video"
   - Wait 1-2 minutes
   - You should see a video player with your rendered animation

**If something doesn't work:**
- Check Vercel logs: `vercel logs`
- Check Google Cloud logs: `gcloud run services logs tail manim-renderer --region=$GOOGLE_CLOUD_REGION`
- Verify environment variables are set: Go to Vercel dashboard → Your project → Settings → Environment Variables

## 🔧 Troubleshooting Common Issues

### Google Cloud Issues

#### "Permission denied" errors
```bash
# Make sure you're authenticated
gcloud auth list
# Should show your email with an asterisk

# Re-authenticate if needed
gcloud auth login
gcloud auth application-default login
```

#### "Billing not enabled" errors
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to Billing → Link a billing account
4. Even with free credits, you need a billing account linked

#### Service won't start
```bash
# Check service logs for errors
gcloud run services logs tail manim-renderer --region=$GOOGLE_CLOUD_REGION

# Common issues:
# - Out of memory (increase memory limit)
# - Timeout (increase timeout)
# - Missing environment variables
```

#### Increase service resources if needed:
```bash
gcloud run services update manim-renderer \
  --memory=8Gi \
  --cpu=4 \
  --timeout=3600 \
  --region=$GOOGLE_CLOUD_REGION
```

### Vercel Issues

#### Build failures
```bash
# Check build logs in Vercel dashboard
# Common issues:
# 1. TypeScript errors
# 2. Missing dependencies
# 3. Environment variable issues

# Test build locally first
npm run build
```

#### Environment variable issues
```bash
# List current environment variables
vercel env ls

# Remove and re-add if needed
vercel env rm OPENROUTER_API_KEY production
vercel env add OPENROUTER_API_KEY production
```

### Integration Issues

#### CORS (Cross-Origin) errors
If you see CORS errors in the browser console:

1. **Check your Cloud Run service allows requests from Vercel:**
```bash
# Update Cloud Run service to allow all origins (for testing)
gcloud run services update manim-renderer \
  --region=$GOOGLE_CLOUD_REGION \
  --set-env-vars="CORS_ORIGINS=*"
```

2. **For production, restrict to your domain:**
```bash
gcloud run services update manim-renderer \
  --region=$GOOGLE_CLOUD_REGION \
  --set-env-vars="CORS_ORIGINS=https://your-app.vercel.app"
```

#### API key issues
```bash
# Test your OpenRouter API key
curl -H "Authorization: Bearer your-api-key" \
  https://openrouter.ai/api/v1/models

# Should return a list of available models
```

## 📊 Monitoring and Cost Management

### Set Up Budget Alerts

```bash
# Create a budget alert to avoid surprise charges
gcloud billing budgets create \
  --billing-account=$(gcloud billing accounts list --format="value(name)" | head -1) \
  --display-name="ManimNext Budget Alert" \
  --budget-amount=25USD \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100
```

**What this does:**
- Sends email alerts at 80% and 100% of $25 budget
- Helps you monitor costs before they get high

### Monitor Usage

#### Check Google Cloud costs:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Go to Billing → Reports
3. Filter by your project to see costs

#### Check Vercel usage:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → Usage
3. Monitor function executions and bandwidth

#### Check OpenRouter usage:
1. Go to [OpenRouter Dashboard](https://openrouter.ai/activity)
2. Monitor API calls and costs

### Clean Up Storage Regularly

```bash
# List old videos (older than 7 days)
gsutil ls -l gs://$GCS_BUCKET_NAME/videos/ | grep $(date -d '7 days ago' '+%Y-%m-%d')

# Delete videos older than 7 days (be careful!)
gsutil -m rm gs://$GCS_BUCKET_NAME/videos/$(date -d '7 days ago' '+%Y-%m-%d')*

# Or create an automated cleanup script
cat > cleanup-old-videos.sh << 'EOF'
#!/bin/bash
# Delete videos older than 7 days
find /tmp -name "*.mp4" -mtime +7 -delete
gsutil -m rm gs://$GCS_BUCKET_NAME/videos/$(date -d '7 days ago' '+%Y-%m-%d')*
EOF
```

## 🎉 Success! Your App is Live

Congratulations! You now have a fully deployed ManimNext application with:

✅ **Serverless video rendering** on Google Cloud Run
✅ **AI-powered script generation** via OpenRouter
✅ **Modern web interface** hosted on Vercel
✅ **Cost-effective architecture** that scales to zero when not used
✅ **Monitoring and alerts** to track usage and costs

### What You've Built

1. **Frontend (Vercel):**
   - URL: `https://your-app.vercel.app`
   - Handles user interface and script generation
   - Automatically scales and has global CDN

2. **Backend (Google Cloud Run):**
   - URL: `https://manim-renderer-xxx.run.app`
   - Renders videos on-demand
   - Scales from 0 to 100+ instances automatically

3. **Storage (Google Cloud Storage):**
   - Bucket: `gs://your-bucket-name`
   - Stores rendered videos
   - Publicly accessible for video playback

### Typical Costs

With this setup, your costs will be very low:

- **Google Cloud Run:** ~$0.10-0.50 per video render
- **Google Cloud Storage:** ~$0.02 per GB per month
- **OpenRouter:** ~$0.01-0.05 per script generation
- **Vercel:** Free for personal projects

**Example:** 100 video renders per month = ~$10-50 total cost

### Next Steps

1. **Customize the interface** to match your brand
2. **Add user authentication** if you want to track users
3. **Implement video galleries** to showcase creations
4. **Add more Manim templates** for different types of animations
5. **Set up analytics** to track usage patterns

### Getting Help

If you run into issues:

1. **Check the logs:**
   - Vercel: `vercel logs`
   - Google Cloud: `gcloud run services logs tail manim-renderer --region=$GOOGLE_CLOUD_REGION`

2. **Common resources:**
   - [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
   - [Vercel Documentation](https://vercel.com/docs)
   - [Manim Documentation](https://docs.manim.community/)

3. **Community support:**
   - Stack Overflow (tag with `google-cloud-run`, `vercel`, `manim`)
   - GitHub Issues on the ManimNext repository

You now have a production-ready, scalable application that can handle thousands of users and video renders! 🚀 