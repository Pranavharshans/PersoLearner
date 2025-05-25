# ManimNext - AI-Powered Educational Video Generator

ManimNext is a Next.js application that automatically generates animated educational videos using Manim (Mathematical Animation Engine). Users can input any educational topic and receive a professionally animated video explanation within minutes.

## 🎯 Overview

This application transforms hours of manual animation work into a simple text-to-video process, making high-quality mathematical and scientific animations accessible to educators, students, and content creators.

### Key Features

- **AI-Powered Script Generation**: Uses OpenRouter API with advanced LLMs to generate Manim scripts
- **Cloud-Based Rendering**: Leverages Google Cloud Run for scalable video rendering
- **Real-time Progress Tracking**: Live updates during video generation process
- **User Authentication**: Firebase-based user management and authentication
- **Video Storage**: Secure video storage and management with Firebase Storage
- **Responsive Design**: Modern, mobile-friendly interface built with Next.js and Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │    │   OpenRouter     │    │  Google Cloud   │
│   (Frontend)    │◄──►│   API (LLM)      │    │  Run (Manim)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   Firebase      │                            │  Google Cloud   │
│   (Auth/DB)     │                            │  Storage        │
└─────────────────┘                            └─────────────────┘
```

## 📚 Documentation

### API Documentation
- **[Next.js API Routes](docs/api/next-js-api.md)** - Complete API implementation guide
- **[OpenRouter Integration](docs/api/openrouter-api.md)** - LLM integration and script generation
- **[Firebase Services](docs/api/firebase-api.md)** - Authentication, Firestore, and Storage
- **[Google Cloud Run](docs/api/google-cloud-run-api.md)** - Video rendering service setup

### Development Workflow
- **[Task Master Integration](docs/workflow/taskmaster.md)** - Project management and task tracking
- **[Development Guidelines](docs/workflow/development.md)** - Coding standards and best practices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account
- Firebase project
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ManimNext.git
   cd ManimNext
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following environment variables:
   ```bash
   # OpenRouter API
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   
   # Google Cloud
   GOOGLE_CLOUD_PROJECT=your-project-id
   CLOUD_RUN_RENDER_URL=https://your-cloud-run-service.run.app
   GOOGLE_CLOUD_TOKEN=your-access-token
   
   # Application
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development Setup

### Task Master Integration

This project uses Task Master for project management and development workflow:

```bash
# Initialize Task Master (already done)
npx task-master-ai init

# View current tasks
npx task-master-ai list

# Get next task to work on
npx task-master-ai next

# Mark task as complete
npx task-master-ai set-status --id=<task-id> --status=done
```

### Firebase Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com)

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password and Google providers

3. **Create Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see `docs/api/firebase-api.md`)

4. **Enable Storage**
   - Go to Storage
   - Create default bucket
   - Configure security rules

### Google Cloud Run Setup

1. **Enable required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

2. **Deploy the Manim rendering service**
   ```bash
   cd cloud-run
   chmod +x setup-gcp.sh deploy.sh
   ./setup-gcp.sh
   ./deploy.sh
   ```

3. **Configure environment variables**
   Update your `.env.local` with the Cloud Run service URL

## 📁 Project Structure

```
ManimNext/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   └── generate/          # Video generation interface
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── ui/                # UI components
│   │   └── video/             # Video-related components
│   ├── lib/                   # Utility libraries
│   │   ├── firebase.ts        # Firebase configuration
│   │   ├── openrouter.ts      # OpenRouter client
│   │   └── cloudRun.ts        # Cloud Run client
│   ├── services/              # Business logic services
│   │   ├── scriptGenerator.ts # Manim script generation
│   │   ├── videoService.ts    # Video management
│   │   └── userService.ts     # User management
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # Global styles
├── docs/                      # Documentation
│   └── api/                   # API documentation
├── cloud-run/                 # Google Cloud Run service
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   ├── deploy.sh
│   └── setup-gcp.sh
├── tasks/                     # Task Master files
└── scripts/                   # Utility scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Task Management
npm run tasks:list   # List all tasks
npm run tasks:next   # Get next task
npm run tasks:status # Check task status

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting provider**
   ```bash
   npm run start
   ```

## 🔐 Security

- **Authentication**: Firebase Authentication with email/password and Google OAuth
- **Authorization**: Role-based access control with Firebase security rules
- **API Security**: Rate limiting, input validation, and CORS protection
- **Data Protection**: Encrypted data transmission and secure storage

## 📊 Monitoring

- **Application Monitoring**: Built-in Next.js analytics
- **Error Tracking**: Integrated error logging and reporting
- **Performance Monitoring**: Real-time performance metrics
- **Custom Metrics**: Video generation success rates and rendering times

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the development workflow** using Task Master
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Follow the coding standards outlined in the documentation
- Write tests for new features
- Update documentation as needed
- Use Task Master for project management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Manim Community** - For the amazing animation engine
- **OpenRouter** - For providing access to advanced LLMs
- **Firebase** - For authentication and database services
- **Google Cloud** - For scalable rendering infrastructure
- **Next.js Team** - For the excellent React framework

## 📞 Support

- **Documentation**: Check the `docs/` directory for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🗺️ Roadmap

- [ ] **Phase 1**: Core MVP functionality (Current)
- [ ] **Phase 2**: Advanced features and optimizations
- [ ] **Phase 3**: Enterprise features and scaling
- [ ] **Phase 4**: Mobile app and additional integrations

For detailed task tracking, see the Task Master dashboard or run `npx task-master-ai list`.

---

**Built with ❤️ using Next.js, Firebase, and Manim** 