"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import LoginForm from "@/components/auth/LoginForm";
import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";
import { useRouter } from "next/navigation";

export default function LoginModal() {
  const { isOpen, close } = useLoginPrompt();
  const router = useRouter();
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          close();
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
        <div className="w-full">
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
                    onClick={() => setForgotMode(false)}
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
                onSuccess={() => close()}
                showRegisterLink
                onNavigateRegister={() => {
                  router.push("/register");
                  close();
                }}
                showForgotLink
                onNavigateForgot={() => setForgotMode(true)}
                buttonClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
