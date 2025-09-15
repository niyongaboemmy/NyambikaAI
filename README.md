# NyambikaAI - AI-Powered Fashion Try-On Platform 🤖👗

A comprehensive fashion e-commerce platform with AI-powered virtual try-on capabilities, built with modern microservices architecture.

## 🏗️ Architecture Overview

This project is structured as three independent applications:

```
NyambikaAI/
├── frontend/          # React + Vite client application
├── backend/           # Node.js + Express API server
├── python/            # Python FastAPI AI service
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database

### 1. Install All Dependencies

```bash
npm run install:all
```

### 2. Environment Setup

Copy and configure environment files for each service:

- `frontend/.env` - Frontend configuration
- `backend/.env` - Backend API and database
- `python/clothflow_service/.env` - Python AI service

### 3. Database Setup

```bash
npm run db:push    # Push database schema
npm run seed       # Seed with sample data
```

### 4. Start All Services

```bash
npm run dev
```

This starts:

- **Frontend**: http://localhost:5173 (React + Vite)
- **Backend**: http://localhost:3001 (Express API)
- **Python Service**: http://localhost:8000 (FastAPI AI)

## 📦 Individual Services

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

- Modern React 18 with TypeScript
- Tailwind CSS with glassmorphism design
- Multi-language support (EN/RW/FR)
- Dark/Light theme switching
- AI-powered UI components

### Backend (Node.js + Express)

```bash
cd backend
npm install
npm run dev
```

- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Google OAuth authentication
- Stripe payment integration
- Session management

### Python Service (FastAPI)

```bash
cd python/clothflow_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- FastAPI with async support
- AI-powered virtual try-on
- Image processing pipeline
- ClothFlow integration

## 🛠️ Available Scripts

### Root Level Commands

```bash
npm run dev              # Start all services in development
npm run build            # Build frontend and backend
npm run start            # Start all services in production
npm run install:all      # Install dependencies for all services
npm run check            # Run TypeScript checks
npm run db:push          # Push database schema
npm run seed             # Seed database with sample data
```

### Individual Service Commands

```bash
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run dev:python       # Start only Python service
```

## 🌟 Key Features

### AI Try-On Studio

- **Virtual Clothing Try-On**: Advanced AI simulation
- **Real-time Processing**: Instant results with progress tracking
- **Multi-format Support**: JPG, PNG, WEBP image formats
- **Session Management**: Save and retrieve try-on sessions

### User Experience

- **Multi-language**: English, Kinyarwanda, French
- **Theme Support**: Dark/Light mode with system detection
- **Responsive Design**: Mobile-first with touch optimization
- **Progressive Web App**: Offline capabilities

### E-commerce Features

- **Product Catalog**: Browse by categories and companies
- **Shopping Cart**: Add to cart and checkout
- **Order Management**: Track orders and history
- **Favorites**: Save preferred items
- **Company Stores**: Dedicated brand pages

### Authentication & Security

- **Google OAuth**: Secure social login
- **Session Management**: Persistent user sessions
- **CORS Protection**: Configured security headers
- **Input Validation**: Zod schema validation

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**

```env
VITE_API_URL=http://localhost:3001
VITE_PYTHON_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

**Backend (.env)**

```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/nyambika
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret
PYTHON_SERVICE_URL=http://localhost:8000
```

**Python Service (.env)**

```env
PORT=8000
HOST=0.0.0.0
CLOTHFLOW_API_URL=your_clothflow_api_url
CLOTHFLOW_API_KEY=your_api_key
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Docker Support

Each service includes Docker configuration for containerized deployment.

### Environment-Specific Deployment

- **Development**: All services run locally
- **Staging**: Deploy to staging environment
- **Production**: Deploy to production with proper scaling

## 📊 Monitoring & Analytics

- **Performance Monitoring**: Built-in performance tracking
- **Error Logging**: Comprehensive error handling
- **Analytics**: User interaction tracking
- **Health Checks**: Service health monitoring

## 📚 Documentation

- Documentation Index: `frontend/docs/README.md`
- Agent
  - `frontend/docs/agent/Agent_Documentation.md`
  - `frontend/docs/agent/Agent_Agreement_of_Work.md`
- Producer
  - `frontend/docs/producer/Producer_Documentation.md`
  - `frontend/docs/producer/Producer_Agreement_of_Work.md`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see individual service README files for details.

## 🆘 Support

For support and questions:

- Check individual service README files
- Review environment configuration
- Ensure all services are running on correct ports
- Verify database connections and API keys
