"use client";
import React, { useState } from "react";
import { Button } from "@/components/custom-ui/button";
import { FormInput } from "@/components/custom-ui/form-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
      return;
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
      setPassword("");
      return;
    } finally {
      setSubmitting(false);
      return;
    }
  };

  return (
    <div className="">
      <main className="p-0.5 max-h-screen overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card className="relative backdrop-blur-xl bg-gradient-to-br from-white/95 via-blue-50/90 to-purple-50/85 dark:from-black/95 dark:via-blue-950/90 dark:to-black/85 border border-white/30 dark:border-gray-700/40 shadow-2xl shadow-blue-500/20 dark:shadow-blue-400/10 overflow-hidden">
            {/* Animated AI-inspired background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Primary animated gradient orb */}
              <motion.div
                className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/30 via-purple-400/25 to-cyan-400/20 rounded-full blur-2xl"
                animate={{
                  x: [0, 20, 0],
                  y: [0, -15, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Secondary animated gradient orb */}
              <motion.div
                className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-purple-400/25 via-pink-400/20 to-indigo-400/15 rounded-full blur-xl"
                animate={{
                  x: [0, -15, 0],
                  y: [0, 10, 0],
                  scale: [1, 0.9, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />

              {/* Neural network inspired dots */}
              <motion.div
                className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/40 rounded-full"
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-purple-400/40 rounded-full"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
              <motion.div
                className="absolute top-1/2 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full"
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.4, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                }}
              />

              {/* Subtle connecting lines for neural network effect */}
              <motion.div
                className="absolute top-1/4 left-1/4 w-16 h-px bg-gradient-to-r from-blue-400/20 to-transparent"
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute top-1/2 right-1/3 w-12 h-px bg-gradient-to-l from-purple-400/20 to-transparent rotate-45"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
              />
            </div>
            <CardHeader className="text-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
                  ✨ Welcome Back
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sign in to your AI-powered fashion account
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
                {error && (
                  <motion.div
                    className="p-3 text-sm text-red-600 bg-red-50/80 dark:bg-red-950/50 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 rounded-xl backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <FormInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    label="Email Address"
                    placeholder="Enter your email address"
                    icon={Mail}
                    autoComplete="username"
                  />
                </motion.div>
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <div className="relative">
                    <FormInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      label="Password"
                      placeholder="Enter your password"
                      icon={Lock}
                      className="pr-11"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-9 h-8 w-8 rounded-lg hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </Button>
                  </div>
                </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading || submitting}
                    className="w-full text-white text-lg py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
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
                        Signing you in...
                      </>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <span>🚀</span>
                        Sign In
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </motion.div>

                {/* Enhanced Social sign-in */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <div className="relative text-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-white/90 dark:bg-gray-900/90 px-3 relative z-10 backdrop-blur-sm">
                      or continue with
                    </span>
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 rounded-lg font-medium"
                      disabled={oauthLoading !== null || isLoading}
                      onClick={async () => {
                        setOauthLoading("google");
                        try {
                          await loginWithProvider("google");
                          onSuccess?.();
                        } catch (err: any) {
                          setError(err?.message || "Google sign-in failed");
                        } finally {
                          setOauthLoading(null);
                        }
                      }}
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
                      <span className="text-sm">
                        {oauthLoading === "google" ? "Signing in..." : "Google"}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 rounded-lg font-medium"
                      disabled={oauthLoading !== null || isLoading}
                      onClick={async () => {
                        setOauthLoading("facebook");
                        try {
                          await loginWithProvider("facebook");
                          onSuccess?.();
                        } catch (err: any) {
                          setError(err?.message || "Facebook sign-in failed");
                        } finally {
                          setOauthLoading(null);
                        }
                      }}
                    >
                      {oauthLoading === "facebook" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                          />
                        </svg>
                      )}
                      <span className="text-sm">
                        {oauthLoading === "facebook"
                          ? "Signing in..."
                          : "Facebook"}
                      </span>
                    </Button>
                  </div>
                </motion.div>

                {/* Demo Users Section
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  <div className="relative text-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-white/90 dark:bg-gray-900/90 px-3 relative z-10 backdrop-blur-sm">
                      or try demo accounts
                    </span>
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  </div>

                  <div className="grid gap-2">
                    {[
                      {
                        role: "Customer",
                        email: "customer@demo.com",
                        password: "password",
                        icon: "👤",
                        color: "from-blue-500/10 to-cyan-500/10",
                        borderColor:
                          "border-blue-200/50 dark:border-blue-700/50",
                      },
                      {
                        role: "Producer",
                        email: "producer@demo.com",
                        password: "password",
                        icon: "🏭",
                        color: "from-purple-500/10 to-pink-500/10",
                        borderColor:
                          "border-purple-200/50 dark:border-purple-700/50",
                      },
                      {
                        role: "Agent",
                        email: "agent@demo.com",
                        password: "password",
                        icon: "⚡",
                        color: "from-orange-500/10 to-red-500/10",
                        borderColor:
                          "border-orange-200/50 dark:border-orange-700/50",
                      },
                    ].map((demo, index) => (
                      <motion.button
                        key={demo.role}
                        type="button"
                        onClick={() => {
                          setEmail(demo.email);
                          setPassword(demo.password);
                        }}
                        className={`p-3 rounded-xl border ${demo.borderColor} bg-gradient-to-r ${demo.color} backdrop-blur-sm hover:scale-[1.02] transition-all duration-200 text-left group`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.0 + index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-lg">{demo.icon}</div>
                            <div>
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {demo.role} Demo
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {demo.email}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            Click to fill
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      💡 Click any demo account to auto-fill login credentials
                    </p>
                  </div>
                </motion.div> */}

                {showRegisterLink && (
                  <motion.div
                    className="text-center text-sm text-gray-600 dark:text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                  >
                    New to NyambikaAI?{" "}
                    <button
                      type="button"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      onClick={onNavigateRegister}
                    >
                      Create an account
                    </button>
                  </motion.div>
                )}
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
