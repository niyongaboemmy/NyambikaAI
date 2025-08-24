"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface LoginFormProps {
  onSuccess?: () => void;
  showRegisterLink?: boolean;
  onNavigateRegister?: () => void;
  showForgotLink?: boolean;
  onNavigateForgot?: () => void;
  buttonClassName?: string;
}

export default function LoginForm({
  onSuccess,
  showRegisterLink = false,
  onNavigateRegister,
  showForgotLink = false,
  onNavigateForgot,
  buttonClassName,
}: LoginFormProps) {
  const { login, isLoading, loginWithProvider } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-rose-50 text-rose-700 text-sm px-3 py-2">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm mb-1">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {showForgotLink && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-sm text-indigo-600 hover:underline"
            onClick={onNavigateForgot}
          >
            Forgot password?
          </button>
        </div>
      )}

      <Button
        type="submit"
        className={
          "w-full " +
          (buttonClassName || "bg-indigo-600 hover:bg-indigo-700 text-white")
        }
        disabled={isLoading || submitting}
      >
        {submitting ? "Signing in..." : "Sign in"}
      </Button>

      {/* Social sign-in */}
      <div className="space-y-3">
        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-background px-2 relative z-10">
            or continue with
          </span>
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={async () => {
              setOauthLoading("google");
              try {
                await loginWithProvider("google");
              } catch (error: any) {
                toast({
                  title: "Sign-in failed",
                  description:
                    error?.message || "Failed to sign in with Google",
                  variant: "destructive",
                });
              } finally {
                setOauthLoading(null);
              }
            }}
            disabled={oauthLoading !== null || isLoading || submitting}
          >
            {oauthLoading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {oauthLoading === "google" ? "Signing in..." : "Google"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={async () => {
              setOauthLoading("facebook");
              try {
                await loginWithProvider("facebook");
              } catch (error: any) {
                toast({
                  title: "Sign-in failed",
                  description:
                    error?.message || "Failed to sign in with Facebook",
                  variant: "destructive",
                });
              } finally {
                setOauthLoading(null);
              }
            }}
            disabled={oauthLoading !== null || isLoading || submitting}
          >
            {oauthLoading === "facebook" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            {oauthLoading === "facebook" ? "Signing in..." : "Facebook"}
          </Button>
        </div>
      </div>
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
          Demo Accounts:
        </h3>
        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
          <p>
            <strong>Customer:</strong> customer@demo.com / password
          </p>
          <p>
            <strong>Producer:</strong> producer@demo.com / password
          </p>
          <p>
            <strong>Admin:</strong> admin@demo.com / password
          </p>
        </div>
      </div>

      {showRegisterLink && (
        <div className="text-center text-sm text-muted-foreground">
          New to NyambikaAI?{" "}
          <button
            type="button"
            className="text-indigo-600 hover:underline"
            onClick={onNavigateRegister}
          >
            Create an account
          </button>
        </div>
      )}
    </form>
  );
}
