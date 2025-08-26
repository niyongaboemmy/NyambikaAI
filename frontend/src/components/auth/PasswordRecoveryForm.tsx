"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export interface PasswordRecoveryFormProps {
  onSent?: () => void;
  buttonClassName?: string;
}

export default function PasswordRecoveryForm({
  onSent,
  buttonClassName,
}: PasswordRecoveryFormProps) {
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
    <div className="">
      <main className="p-1 max-h-screen overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card className="relative backdrop-blur-xl bg-gradient-to-br from-white/95 via-indigo-50/90 to-purple-50/85 dark:from-black/95 dark:via-indigo-950/90 dark:to-purple-950/85 border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-400/10 overflow-hidden">
            {/* Animated AI-inspired background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Primary animated gradient orb */}
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-400/30 via-purple-400/25 to-blue-400/20 rounded-full blur-2xl"
                animate={{
                  x: [0, 15, 0],
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Secondary animated gradient orb */}
              <motion.div
                className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-blue-400/25 via-indigo-400/20 to-purple-400/15 rounded-full blur-xl"
                animate={{
                  x: [0, -10, 0],
                  y: [0, 8, 0],
                  scale: [1, 0.95, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.8,
                }}
              />

              {/* Security-themed dots */}
              <motion.div
                className="absolute top-1/3 left-1/3 w-2 h-2 bg-indigo-400/40 rounded-full"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-purple-400/40 rounded-full"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.7,
                }}
              />
            </div>

            <CardHeader className="text-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center shadow-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl dark:text-white font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 dark:from-indigo-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
                  🔐 Reset Password
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Enter your email to receive a secure reset link
                </p>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.form
                onSubmit={onSubmit}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {message && (
                  <motion.div
                    className="p-3 text-sm text-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ✅ {message}
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    className="p-3 text-sm text-red-600 bg-red-50/80 dark:bg-red-950/50 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 rounded-xl backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ❌ {error}
                  </motion.div>
                )}

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    Email Address
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-blue-400/20 blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300" />
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-10 pl-10 pr-4 bg-gradient-to-br from-white/90 via-indigo-50/60 to-purple-50/40 dark:from-gray-900/90 dark:via-indigo-950/60 dark:to-purple-950/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl backdrop-blur-xl focus:border-indigo-400/70 dark:focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 transition-all duration-300 shadow-md shadow-indigo-500/5 group-hover:shadow-indigo-500/8 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100 font-medium"
                        placeholder="Enter your email address"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading || submitting}
                    className="w-full text-white text-lg py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Sending reset link...
                      </>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <span>🔐</span>
                        Send Reset Link
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </motion.div>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
