"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export interface PasswordRecoveryFormProps {
  onSent?: () => void;
  buttonClassName?: string;
}

export default function PasswordRecoveryForm({ onSent, buttonClassName }: PasswordRecoveryFormProps) {
  const { requestPasswordReset, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setMessage("Password reset link sent. Check your email.");
      onSent?.();
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && (
        <div className="rounded-md bg-emerald-50 text-emerald-700 text-sm px-3 py-2">
          {message}
        </div>
      )}
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
      <Button
        type="submit"
        className={"w-full " + (buttonClassName || "bg-indigo-600 hover:bg-indigo-700 text-white")}
        disabled={isLoading || submitting}
      >
        {submitting ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
