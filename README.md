# Learnim - AI-Powered Educational Video Generator

> Transform any learning topic into personalized, animated educational videos using AI and Manim.

## 🎯 Overview

Learnim is an innovative platform that democratizes high-quality educational content by generating personalized, animated explanations for any topic. Users simply input what they want to learn, and our AI-powered system creates custom 2-3 minute Manim-animated videos.

### Key Features

- **Instant Video Generation**: AI-powered Manim script creation
- **Google Authentication**: Secure login with Google OAuth
- **Personal Library**: Save and organize your generated videos
- **Cloud Rendering**: Scalable video processing on Google Cloud
- **Professional Quality**: 720p animated educational content

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI   │────│   FastAPI API   │────│  Google Cloud   │
│   (Frontend)    │    │   (Backend)     │    │   (Rendering)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   Firebase      │    │   OpenRouter    │    │   Manim +       │
    │   (Auth/DB)     │    │   (LLM API)     │    │   Docker        │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **Firebase Auth** for authentication
- **Lucide React** for icons

### Backend
- **FastAPI** (Python)
- **Firebase Admin SDK**
- **OpenRouter API** for LLM integration
- **Google Cloud Run** for deployment

### Infrastructure
- **Cloud Firestore** (Database)
- **Firebase Storage** (File storage)
- **Google Cloud Platform** (Video rendering)
- **Vercel** (Frontend deployment)

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **Docker** (for local development)
- **Google Cloud Platform** account
- **Firebase** project
- **OpenRouter** API key

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/learnim.git
cd learnim
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
OPENROUTER_API_KEY=your_openrouter_key
GOOGLE_CLOUD_PROJECT=your_gcp_project
```

### 4. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Google provider
3. Create Firestore database
4. Setup Firebase Storage
5. Generate service account key for backend

### 5. Google Cloud Setup

1. Create GCP project
2. Enable required APIs:
   - Compute Engine API
   - Cloud Run API
   - Cloud Storage API
3. Setup service account with appropriate permissions

## 🏃‍♂️ Running the Application

### Development Mode

**Frontend:**
```bash
cd frontend
npm run dev
```
Visit: http://localhost:3000

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### Production Deployment

**Frontend (Vercel):**
```bash
npm run build
vercel deploy
```

**Backend (Google Cloud Run):**
```bash
docker build -t gcr.io/your-project/learnim-api .
docker push gcr.io/your-project/learnim-api
gcloud run deploy learnim-api --image gcr.io/your-project/learnim-api
```

## 📁 Project Structure

```
learnim/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── requirements.txt
│   └── Dockerfile
├── docs/                   # Documentation
├── PRD.md                  # Product Requirements Document
├── DEVELOPMENT_PLAN.md     # Detailed development plan
└── README.md              # This file
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:e2e
```

### Backend Tests
```bash
cd backend
pytest
pytest --cov=app tests/
```

## 📊 Monitoring & Analytics

- **Frontend**: Vercel Analytics
- **Backend**: Google Cloud Logging
- **Errors**: Sentry (optional)
- **Performance**: Google Cloud Monitoring

## 🔒 Security

- Firebase Authentication with Google OAuth
- JWT token validation
- API rate limiting
- Secure environment variables
- HTTPS everywhere

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🗺️ Roadmap

### Phase 1 (MVP) - Weeks 1-6
- [x] Project setup and infrastructure
- [x] Authentication system
- [ ] Video generation pipeline
- [ ] Basic UI and user experience
- [ ] Cloud rendering system

### Phase 2 - Weeks 7-12
- [ ] Advanced video customization
- [ ] Multiple animation styles
- [ ] Collaborative features
- [ ] Mobile app

### Phase 3 - Months 4-6
- [ ] Interactive video elements
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Enterprise features

## 📈 Performance Targets

- **Time to First Video**: < 2 minutes
- **Video Generation**: < 5 minutes
- **API Response Time**: < 500ms (95th percentile)
- **System Uptime**: > 99.5%

---

**Built with ❤️ for learners everywhere** # PersoLearner
