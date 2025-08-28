"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import LoginForm from "@/components/auth/LoginForm";
import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";
import { useRouter } from "next/navigation";

export default function LoginModal() {
  const { isOpen, close, error, clearError } = useLoginPrompt();
  const router = useRouter();
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);



  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
          clearError();
          // Check if current page is protected and redirect to home if needed
          const currentPath = window.location.pathname;
          const protectedRoutes = [
            "/checkout",
            "/profile",
            "/cart",
            "/orders",
            "/product-registration",
            "/product-edit/",
            "/producer-dashboard",
            "/producer-products",
            "/producer-orders",
            "/producer-analytics",
            "/admin",
            "/agent-dashboard",
            "/agent/",
          ];

          const isProtectedRoute = protectedRoutes.some(
            (route) => currentPath.startsWith(route) || currentPath === route
          );

          if (
            isProtectedRoute &&
            !window.location.pathname.includes("/product/")
          ) {
            router.push("/");
          }
        }
      }}
    >
      {isOpen && <div className="fixed inset-0 bg-black/5 backdrop-blur-md" />}
      <DialogContent
        // allow closing; onOpenChange will handle navigation
        className="p-0 overflow-hidden border-0 shadow-xl max-h-[95vh] overflow-y-auto rounded-2xl bg-transparent"
        hideClose={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to your account to access all features
          </DialogDescription>
        </DialogHeader>
        <div className="w-full">
          {/* Error Message Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="w-full">
            {forgotMode ? (
              <div className="relative">
                <PasswordRecoveryForm
                  onSent={() =>
                    setMessage("Password reset link sent. Check your email.")
                  }
                />
                <div className="absolute top-4 left-4 z-10">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-2 rounded-full border border-blue-200/50 dark:border-blue-700/50 hover:bg-white dark:hover:bg-gray-900"
                    onClick={() => {
                      setForgotMode(false);
                      clearError();
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to login
                  </button>
                </div>
              </div>
            ) : (
              <LoginForm
                onSuccess={() => {
                  clearError();
                  close();
                }}
                showRegisterLink
                onNavigateRegister={() => {
                  router.push("/register");
                  clearError();
                  close();
                }}
                showForgotLink
                onNavigateForgot={() => {
                  setForgotMode(true);
                  clearError();
                }}
                buttonClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
