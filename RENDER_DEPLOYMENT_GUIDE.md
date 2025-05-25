# ManimNext Deployment Guide - Render.com Edition (Simplified)

This guide provides step-by-step instructions for deploying ManimNext using Render.com for cloud rendering. This simplified version returns videos directly to the browser without requiring any cloud storage setup.

## 📋 Prerequisites

Before starting, ensure you have:

- **Render.com Account** (free tier available)
- **GitHub Account** (for code repository)
- **Node.js** 18+ and npm/yarn
- **Git** for version control

## 🔧 Environment Setup

### 1. Install Required Tools

```bash
# Install jq for JSON processing (optional but recommended for testing)
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (via Chocolatey)
choco install jq
```

## 🚀 Phase 1: Render.com Deployment

### Step 1: Prepare Your Repository

1. **Create a new repository on GitHub** (or use existing)
2. **Copy the Render.com files to your repository:**

```bash
# Copy the render-com directory to your project root
cp -r cloud-render/render-com/* ./
```

3. **Commit and push to GitHub:**

```bash
git add .
git commit -m "Add Render.com deployment files for direct video return"
git push origin main
```

### Step 2: Deploy to Render.com

1. **Login to Render.com**
2. **Click "New +" and select "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   - **Name:** `manim-renderer`
   - **Environment:** `Docker`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance Type:** `Starter` (can upgrade later)

### Step 3: Set Environment Variables (Optional)

In the Render.com dashboard, you can optionally add these environment variables:

**Optional Configuration:**
- `MAX_RENDER_TIME`: `3600` (1 hour timeout)
- `DEFAULT_QUALITY`: `medium_quality`
- `DEFAULT_FORMAT`: `mp4`
- `RENDER_SERVICE_NAME`: `manim-renderer`

**Note:** No AWS credentials or storage setup required!

### Step 4: Deploy and Wait

1. **Click "Create Web Service"**
2. **Wait for deployment** (first build takes 10-15 minutes due to LaTeX/FFmpeg installation)
3. **Monitor logs** for any errors

### Step 5: Test Your Deployment

Once deployed, you'll get a URL like `https://manim-renderer-xxx.onrender.com`

**Test the health endpoint:**
```bash
curl https://your-service.onrender.com/health
```

**Run comprehensive tests:**
```bash
# Make the test script executable
chmod +x test-render-com.sh

# Run tests
./test-render-com.sh https://your-service.onrender.com
```

## 🎯 Phase 2: Next.js Integration

### Step 1: Update Environment Variables

Create/update your environment files:

**`.env.local` (for development):**
```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Render.com Configuration
RENDER_SERVICE_URL=https://your-service.onrender.com
NEXT_PUBLIC_RENDER_SERVICE_URL=https://your-service.onrender.com

# Development settings
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

**`.env.production` (for production):**
```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Render.com Configuration
RENDER_SERVICE_URL=https://your-service.onrender.com
NEXT_PUBLIC_RENDER_SERVICE_URL=https://your-service.onrender.com

# Production settings
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### Step 2: Test Local Integration

```bash
# Install dependencies
npm install

# Test the application locally
npm run dev
```

Open http://localhost:3000 and test:
1. Script generation with OpenRouter
2. Cloud rendering integration with Render.com
3. End-to-end workflow

## 🌍 Phase 3: Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? manim-next
# - Directory? ./
# - Override settings? No
```

### Step 3: Set Environment Variables in Vercel

```bash
# Set production environment variables
vercel env add OPENROUTER_API_KEY production
# Enter your OpenRouter API key when prompted

vercel env add RENDER_SERVICE_URL production
# Enter your Render.com service URL

vercel env add NEXT_PUBLIC_RENDER_SERVICE_URL production
# Enter your Render.com service URL (same as above)

# Set preview environment variables (optional)
vercel env add OPENROUTER_API_KEY preview
vercel env add RENDER_SERVICE_URL preview
vercel env add NEXT_PUBLIC_RENDER_SERVICE_URL preview
```

### Step 4: Deploy to Production

```bash
# Deploy to production
vercel --prod
```

## 🎬 How Video Delivery Works

### Direct Video Return Options

The service offers two ways to get your rendered videos:

1. **Base64 Embedded Response** (for small videos):
   ```javascript
   const result = await renderClient.renderScript({
     script: manimScript,
     quality: 'low_quality',
     return_base64: true  // Video data included in response
   });
   
   if (result.video_base64) {
     const videoUrl = renderClient.createVideoUrl(result.video_base64);
     // Use videoUrl in your video element
   }
   ```

2. **Download Endpoint** (for larger videos):
   ```javascript
   const result = await renderClient.renderScript({
     script: manimScript,
     quality: 'medium_quality'
     // return_base64: false (default)
   });
   
   // Get download URL
   const downloadUrl = renderClient.getDownloadUrl(result.request_id);
   
   // Or download as blob
   const videoBlob = await renderClient.downloadVideo(result.request_id);
   ```

### Integration Example

```typescript
import { createRenderClient } from '@/lib/render-client';

const renderClient = createRenderClient();

// Render and get video
const result = await renderClient.renderScript({
  script: generatedScript,
  quality: 'medium_quality',
  format: 'mp4'
});

if (result.success) {
  // Option 1: Use download URL
  const videoUrl = renderClient.getDownloadUrl(result.request_id);
  
  // Option 2: Download as blob
  const videoBlob = await renderClient.downloadVideo(result.request_id);
  const videoUrl = URL.createObjectURL(videoBlob);
  
  // Use in video element
  setVideoUrl(videoUrl);
}
```

## 🔧 Troubleshooting

### Render.com Issues

**Service Won't Start:**
- Check the build logs in Render.com dashboard
- Verify Dockerfile syntax
- Ensure all dependencies are properly installed

**Rendering Failures:**
- Check service logs in Render.com dashboard
- Test with simple scripts first
- Verify script syntax and Manim imports

**Timeout Issues:**
- Increase `MAX_RENDER_TIME` environment variable
- Consider upgrading to a higher Render.com plan for more resources
- Use lower quality settings for faster rendering

**Video Download Issues:**
- Check if the request_id is valid
- Verify the video file was created successfully
- Try using base64 return for small videos

### Vercel Integration Issues

**Environment Variables:**
- Ensure all required variables are set in Vercel dashboard
- Check variable names match exactly
- Verify URLs don't have trailing slashes

**CORS Errors:**
- The Flask app includes CORS support
- Verify Render.com service allows requests from your Vercel domain

**Video Playback Issues:**
- Check browser console for errors
- Verify video URL is accessible
- Try different video formats if needed

## 💰 Cost Analysis

### Render.com Pricing

**Free Tier:**
- 750 hours/month
- Service sleeps after 15 minutes of inactivity
- Perfect for development and testing

**Starter Plan ($7/month):**
- Always-on service (no sleeping)
- Better for production use
- More reliable performance

### No Storage Costs!

- **No AWS S3 fees**
- **No cloud storage setup**
- **No data transfer charges**
- Videos are served directly from Render.com

## 📊 Monitoring and Maintenance

### Render.com Monitoring

- **Service Logs:** Available in Render.com dashboard
- **Metrics:** CPU, memory, and request metrics
- **Health Checks:** Automatic health monitoring at `/health`

### Performance Optimization

- **Quality Settings:** Use `low_quality` for faster rendering
- **Video Cleanup:** Videos are automatically cleaned up after some time
- **Caching:** Consider implementing client-side caching for repeated requests

## 🎉 Success Checklist

- [ ] Render.com service deployed successfully
- [ ] Health check endpoint responding
- [ ] Test rendering works with simple script
- [ ] Test rendering works with complex script
- [ ] Base64 video return working
- [ ] Download endpoint working
- [ ] Status endpoint working
- [ ] Next.js application builds successfully
- [ ] Local integration testing passed
- [ ] Vercel deployment successful
- [ ] Production environment variables configured
- [ ] End-to-end workflow tested

## 🚀 Advanced Features

### Video Quality Options

- `low_quality`: Fast rendering, smaller files
- `medium_quality`: Balanced quality and speed
- `high_quality`: Best quality, slower rendering

### Supported Formats

- `mp4`: Most compatible (recommended)
- `mov`: High quality, larger files
- `avi`: Legacy format support

### Error Handling

The service includes comprehensive error handling:
- Script validation
- Security checks
- Timeout management
- Detailed error messages

## 📚 Additional Resources

- [Render.com Documentation](https://render.com/docs)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Manim Documentation](https://docs.manim.community/)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**Estimated Setup Time:** 15-20 minutes
**Monthly Cost:** $0-7 (depending on usage and Render.com plan)
**Complexity:** Low
**Storage Requirements:** None (videos served directly) 