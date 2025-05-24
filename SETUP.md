# Learnim Setup Guide

## Quick Start

### 1. Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

```bash
# OpenRouter Configuration (Required for MVP)
OPENROUTER_API_KEY=your_openrouter_api_key
YOUR_SITE_URL=https://learnim.com
YOUR_SITE_NAME=Learnim

# Firebase Configuration (Frontend - Optional for MVP)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Get OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Create a new API key
5. Add credits to your account (minimum $5 recommended)
6. Copy the API key to your `.env.local` file

### 3. Install Dependencies

```bash
cd frontend
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Current Features (MVP Phase 1)

✅ **Beautiful Landing Page**
- Modern, responsive design
- Video generation interface
- Feature explanations

✅ **AI Script Generation**
- OpenRouter integration
- GPT-4 powered Manim script generation
- Input validation and error handling

🚧 **Coming Next (Phase 2)**
- Video rendering pipeline
- User authentication
- Video storage and management
- Video player interface

## Testing the Current MVP

1. Enter a mathematical topic (e.g., "Pythagorean theorem")
2. Click "Generate Video"
3. Check the browser console to see the generated Manim script
4. The success message will confirm script generation

## Architecture Overview

```
Frontend (Next.js)
├── Landing Page (/)
├── API Routes (/api/generate-video)
└── Future: Video Player, Dashboard

Backend Services (Future)
├── Video Rendering (Google Cloud)
├── File Storage (Firebase Storage)
└── User Management (Firebase Auth)
```

## Next Development Steps

1. **Video Rendering Pipeline** - Implement Google Cloud integration
2. **User Authentication** - Add Firebase Auth
3. **Video Storage** - Implement Firebase Storage
4. **Video Player** - Create video viewing interface
5. **User Dashboard** - Video library and management

## Troubleshooting

### Common Issues

**"Server configuration error"**
- Make sure `OPENROUTER_API_KEY` is set in `.env.local`
- Restart the development server after adding environment variables

**"OpenRouter API error: 401"**
- Check that your API key is correct
- Ensure you have credits in your OpenRouter account

**"Failed to generate video"**
- Check your internet connection
- Verify OpenRouter service status
- Check browser console for detailed error messages

### Development Tips

- Use browser developer tools to inspect API responses
- Check the console for generated Manim scripts
- Test with simple topics first (e.g., "circle", "triangle")

## Production Deployment

For production deployment, you'll need:

1. **Vercel/Netlify** - Frontend hosting
2. **OpenRouter Account** - With sufficient credits
3. **Firebase Project** - For future features
4. **Google Cloud Project** - For video rendering
5. **Domain Name** - For YOUR_SITE_URL

## Support

If you encounter issues:

1. Check this setup guide
2. Review the API documentation in `/api-reference/`
3. Check the browser console for errors
4. Verify all environment variables are set correctly 