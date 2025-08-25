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
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";

export default function LoginModal() {
  const { isOpen, close } = useLoginPrompt();
  const [, setLocation] = useLocation();
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
            '/products', '/companies', '/try-on/start', '/try-on', '/product/',
            '/checkout', '/profile', '/cart', '/orders', '/product-registration',
            '/product-edit/', '/producer-dashboard', '/producer-products',
            '/producer-orders', '/producer-analytics', '/admin'
          ];
          
          const isProtectedRoute = protectedRoutes.some(route => 
            currentPath.startsWith(route) || currentPath === route
          );
          
          if (isProtectedRoute) {
            setLocation('/');
          }
        }
      }}
    >
      {isOpen && <div className="fixed inset-0 bg-black/5 backdrop-blur-md" />}
      <DialogContent
        // allow closing; onOpenChange will handle navigation
        className="p-0 overflow-hidden border-0 shadow-xl"
        hideClose={true}
      >
        <div className="bg-background w-full">
          <div className="w-full">
            {forgotMode ? (
              <div className="p-3">
                <div className="font-bold text-xl mb-3 px-3 pt-3">
                  Password Recovery
                </div>
                <div className="p-3 pt-1">
                  <PasswordRecoveryForm
                    onSent={() =>
                      setMessage("Password reset link sent. Check your email.")
                    }
                    buttonClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
                  />
                </div>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    className="text-sm text-indigo-600 hover:underline"
                    onClick={() => setForgotMode(false)}
                  >
                    Back to login
                  </button>
                </div>
              </div>
            ) : (
              <LoginForm
                onSuccess={() => close()}
                showRegisterLink
                onNavigateRegister={() => {
                  setLocation("/register");
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
