# Nyambika Backend 🚀

Node.js + Express API server with authentication, database management, and AI service integration.

## 🚀 Features

- **RESTful API**: Express.js with TypeScript
- **Authentication**: Passport.js with Google OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **Payment Processing**: Stripe integration
- **AI Integration**: Proxy to Python ClothFlow service

## 📦 Installation

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## 🔧 Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/nyambika

# Authentication
SESSION_SECRET=your-super-secret-session-key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# External Services
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
PYTHON_SERVICE_URL=http://localhost:8000

# CORS
FRONTEND_URL=http://localhost:5173
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

Server runs on: `http://localhost:3001`

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Database Operations

```bash
npm run db:push    # Push schema changes to database
npm run seed       # Seed database with sample data
```

## 🏗️ Project Structure

```
backend/
├── shared/
│   └── schema.ts          # Shared TypeScript types
├── db.ts                  # Database connection and schema
├── index.ts               # Main server entry point
├── routes.ts              # API route definitions
├── storage.ts             # Database operations
├── openai.ts              # OpenAI integration
├── tryon.ts               # Try-on service integration
├── seed.ts                # Database seeding
├── vite.ts                # Vite integration (if needed)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── drizzle.config.ts      # Database migration config
└── .env                   # Environment variables
```

## 📡 API Endpoints

### Authentication

```
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Get current user
GET  /api/auth/oauth/google # Google OAuth
```

### Users

```
GET    /api/users          # Get all users
GET    /api/users/:id      # Get user by ID
PUT    /api/users/:id      # Update user
DELETE /api/users/:id      # Delete user
```

### Products

```
GET    /api/products       # Get all products
GET    /api/products/:id   # Get product by ID
POST   /api/products       # Create product (admin)
PUT    /api/products/:id   # Update product (admin)
DELETE /api/products/:id   # Delete product (admin)
```

### Companies

```
GET    /api/companies      # Get all companies
GET    /api/companies/:id  # Get company by ID
GET    /api/companies/:id/products # Get company products
```

### Orders

```
GET    /api/orders         # Get user orders
POST   /api/orders         # Create new order
GET    /api/orders/:id     # Get order by ID
PUT    /api/orders/:id     # Update order status
```

### Try-On Service

```
POST   /api/tryon          # Start try-on session
GET    /api/tryon/:id      # Get try-on result
```

### Favorites

```
GET    /api/favorites      # Get user favorites
POST   /api/favorites      # Add to favorites
DELETE /api/favorites/:id  # Remove from favorites
```

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts and profiles
- **companies**: Fashion brands and retailers
- **products**: Clothing items and details
- **orders**: Purchase transactions
- **order_items**: Individual order line items
- **favorites**: User favorite products
- **tryon_sessions**: AI try-on session data

## 🔗 Integration Points

### Frontend Communication

- Serves API endpoints for React frontend
- Handles user authentication and sessions
- Manages shopping cart and order processing

### Python Service Integration

- Proxies try-on requests to ClothFlow service
- Manages session data and results
- Handles file uploads and processing

## 🛡️ Security Features

- **CORS**: Configured for frontend domain
- **Session Security**: Secure session cookies
- **Input Validation**: Zod schema validation
- **Authentication**: Passport.js strategies
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set secure session secrets
- [ ] Configure CORS for production domain
- [ ] Set up SSL/HTTPS
- [ ] Configure logging and monitoring
