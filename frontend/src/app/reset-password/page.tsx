"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/config/api";
import { handleApiError } from "@/config/api";
import { Button } from "@/components/custom-ui/button";
import { Input } from "@/components/custom-ui/input";
import { Label } from "@/components/custom-ui/label";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-neutral-500 text-sm">Invalid or missing reset token.</p>
        <Link href="/" className="text-sm font-medium underline underline-offset-4">
          Back to home
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
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
      <div className="text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center mx-auto">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Password updated</h2>
        <p className="text-neutral-500 text-sm">Redirecting you to the home page…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="text-sm font-medium text-neutral-700">
          New password
        </Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password" className="text-sm font-medium text-neutral-700">
          Confirm password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
      >
        {submitting ? "Updating…" : "Reset password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-md bg-neutral-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-900">Nyambika</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Set new password</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Choose a strong password for your account.
            </p>
          </div>

          <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>

          <p className="mt-6 text-center text-xs text-neutral-400">
            <Link href="/" className="hover:text-neutral-700 transition-colors">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
