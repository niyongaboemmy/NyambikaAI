# NyambikaAI Frontend 🎨

Modern React + Vite frontend for the AI-powered fashion try-on platform.

## 🚀 Features

- **AI Try-On Studio**: Interactive virtual clothing try-on experience
- **Modern UI/UX**: Glassmorphism design with dark/light theme support
- **Multi-language**: Support for English, Kinyarwanda, and French
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: React Query for efficient data fetching

## 📦 Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## 🔧 Configuration

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_PYTHON_API_URL=http://localhost:8000

# Authentication
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
Access at: `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components (shadcn/ui)
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── contexts/          # React contexts
│   │   ├── LanguageContext.tsx
│   │   ├── CartContext.tsx
│   │   └── CompanyContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── use-toast.ts
│   └── lib/               # Utilities
│       ├── queryClient.ts
│       └── utils.ts
├── index.html             # Entry HTML file
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS config
└── tsconfig.json          # TypeScript config
```

## 🎨 Design System

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom AI-themed components
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Lucide React + React Icons
- **Animations**: Framer Motion + CSS animations
- **Theme**: Dark/Light mode with system preference detection

## 🔗 API Integration

The frontend communicates with:
- **Backend API** (`localhost:3001`): User auth, orders, favorites
- **Python Service** (`localhost:8000`): AI try-on processing

## 📱 Key Features

### AI Try-On Studio
- Product selection with category filtering
- Photo upload with preview
- Real-time try-on processing
- Results gallery and sharing

### User Experience
- Multi-language support (EN/RW/FR)
- Theme switching (light/dark)
- Shopping cart functionality
- User profile management
- Order history tracking

### Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Optimized for all screen sizes
- Progressive Web App ready

## 🛠️ Development

### Code Quality
```bash
npm run check    # TypeScript type checking
```

### Key Dependencies
- **React Router**: Client-side routing with Wouter
- **State Management**: React Query + Context API
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe integration
- **Charts**: Recharts for analytics
