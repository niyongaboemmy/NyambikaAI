"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient, handleApiError } from "@/config/api";
import { Button } from "@/components/custom-ui/button";
import { FormInput } from "@/components/custom-ui/form-input";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Eye, EyeOff, Loader2, CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] rounded-md px-2 py-1 transition-colors ${
        met
          ? "bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-300"
          : "bg-muted/40 text-muted-foreground"
      }`}
    >
      <CheckCircle2 className={`h-3 w-3 ${met ? "opacity-100" : "opacity-30"}`} />
      {label}
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const requirements = {
    minLength: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const passwordValid = Object.values(requirements).every(Boolean);
  const mismatch = confirm.length > 0 && newPassword !== confirm;

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-muted-foreground text-sm">
          This reset link is invalid or missing its token.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 underline underline-offset-4"
        >
          Return home and request a new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError("Your password doesn't meet all the requirements below.");
      return;
    }
    if (mismatch) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/api/auth/reset-password", { token, newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 rounded-full bg-gold-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Password updated</h2>
        <p className="text-muted-foreground text-sm">
          Redirecting you to the home page…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FormInput
          id="new-password"
          label="New password"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Create a strong password"
          icon={Lock}
          required
          autoFocus
          className="pr-11"
        />
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 -top-9 h-8 w-8 rounded-lg"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <PasswordRequirement met={requirements.minLength} label="8+ characters" />
          <PasswordRequirement met={requirements.upper} label="Uppercase letter" />
          <PasswordRequirement met={requirements.lower} label="Lowercase letter" />
          <PasswordRequirement met={requirements.digit} label="Number" />
          <PasswordRequirement met={requirements.special} label="Special character" />
        </div>
      </div>

      <div>
        <FormInput
          id="confirm-password"
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password"
          icon={Lock}
          required
          className="pr-11"
          error={mismatch ? "Passwords do not match" : undefined}
        />
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 -top-9 h-8 w-8 rounded-lg"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-gold-600 hover:bg-gold-700 text-white font-medium"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          "Reset password"
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-full bg-gold-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="text-lg font-serif font-semibold tracking-tight text-foreground">
            Nyambika
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="backdrop-blur-xl border border-border/50 rounded-3xl bg-card/95">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Set new password
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a strong password for your account.
                </p>
              </div>

              <Suspense
                fallback={
                  <p className="text-sm text-muted-foreground">Loading…</p>
                }
              >
                <ResetPasswordForm />
              </Suspense>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Back to home
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
