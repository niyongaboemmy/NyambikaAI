"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Brain, Sparkles } from "lucide-react";

export function GlobalAuthLoader() {
  const { isLoading } = useAuth();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Loader Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6">
          {/* AI Brain Icon with Animation */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-20"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="h-10 w-10 text-white animate-pulse" />
            </div>
            {/* Orbiting Sparkles */}
            <div className="absolute inset-0 animate-spin">
              <Sparkles className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-blue-500" />
            </div>
            <div
              className="absolute inset-0 animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "3s" }}
            >
              <Sparkles className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-purple-500" />
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nyambika
            </h2>
            <p className="text-gray-600 dark:text-gray-400 animate-pulse">
              Initializing AI fashion experience...
            </p>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>

          {/* Status Text */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Checking authentication status</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
