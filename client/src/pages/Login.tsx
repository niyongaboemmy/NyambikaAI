import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';

export default function Login() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="glassmorphism"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-xl font-bold gradient-text">
            Kwinjira / Login
          </h1>
          <div className="w-32" />
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-16">
        <Card className="floating-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text mb-2">
              Welcome Back!
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Murakaza neza! Sign in to your account
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <LoginForm
                onSuccess={() => setLocation('/')}
                showRegisterLink
                onNavigateRegister={() => setLocation('/register')}
                showForgotLink
                onNavigateForgot={() => setLocation('/forgot-password')}
                buttonClassName="w-full gradient-bg text-white text-lg py-3"
              />

              {/* Demo Accounts */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
                  Demo Accounts:
                </h3>
                <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                  <p><strong>Customer:</strong> customer@demo.com / password</p>
                  <p><strong>Producer:</strong> producer@demo.com / password</p>
                  <p><strong>Admin:</strong> admin@demo.com / password</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
