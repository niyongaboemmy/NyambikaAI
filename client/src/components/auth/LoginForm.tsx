"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
        className={"w-full " + (buttonClassName || "bg-indigo-600 hover:bg-indigo-700 text-white")}
        disabled={isLoading || submitting}
      >
        {submitting ? "Signing in..." : "Sign in"}
      </Button>

      {/* Social sign-in */}
      <div className="space-y-2">
        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-background px-2 relative z-10">or continue with</span>
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="w-full" onClick={() => loginWithProvider('google')}>
            <span className="mr-2 rounded-sm bg-red-500 h-3 w-3" /> Sign in with Google
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => loginWithProvider('facebook')}>
            <span className="mr-2 rounded-sm bg-blue-600 h-3 w-3" /> Sign in with Facebook
          </Button>
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
