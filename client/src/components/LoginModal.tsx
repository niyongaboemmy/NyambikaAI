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
          setLocation("/");
          close();
        }
      }}
    >
      <DialogContent
        // allow closing; onOpenChange will handle navigation
        className="sm:max-w-md p-0 overflow-hidden border-0 shadow-xl"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-fuchsia-700 to-rose-700 opacity-90" />
          <div className="relative px-6 py-5 text-white">
            <h2 className="text-2xl font-bold tracking-tight">NyambikaAI</h2>
            <p className="text-sm opacity-90">Sign in to continue</p>
          </div>
        </div>

        <div className="px-6 pb-6 bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {forgotMode ? "Recover your password" : "Login to your account"}
            </DialogTitle>
          </DialogHeader>
          {message && (
            <div className="mt-3 rounded-md bg-emerald-50 text-emerald-700 text-sm px-3 py-2">
              {message}
            </div>
          )}
          <div className="mt-4">
            {forgotMode ? (
              <>
                <PasswordRecoveryForm
                  onSent={() =>
                    setMessage("Password reset link sent. Check your email.")
                  }
                  buttonClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
                />
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-sm text-indigo-600 hover:underline"
                    onClick={() => setForgotMode(false)}
                  >
                    Back to login
                  </button>
                </div>
              </>
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
