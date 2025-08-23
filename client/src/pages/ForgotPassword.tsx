import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";
import { useLocation } from "wouter";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { open } = useLoginPrompt();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => open()}
            className="glassmorphism"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Open Login
          </Button>
          <h1 className="text-xl font-bold gradient-text">Forgot Password</h1>
          <div className="w-32" />
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-16">
        <Card className="floating-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text mb-2">
              Recover your password
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email and we'll send you a reset link
            </p>
          </CardHeader>
          <CardContent>
            <PasswordRecoveryForm buttonClassName="w-full gradient-bg text-white" />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Remembered it?{' '}
              <button
                type="button"
                className="text-indigo-600 hover:underline"
                onClick={() => setLocation('/login')}
              >
                Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
