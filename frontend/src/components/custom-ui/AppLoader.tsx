"use client";

import { Sparkles, Brain, Zap } from "lucide-react";

export function AppLoader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* AI-inspired loading animation */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto relative">
            {/* Main circle */}
            <div className="absolute inset-0 rounded-full animate-spin bg-gold-500">
              <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900"></div>
            </div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-8 w-8 text-gray-800 animate-pulse" />
            </div>

            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-bounce bg-gold-400" />
            <div
              className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full animate-bounce bg-gold-400"
              style={{ animationDelay: "0.5s" }}
            />
            <Sparkles
              className="absolute -top-1 -left-1 h-3 w-3 text-gray-700 animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <Zap
              className="absolute -bottom-1 -right-1 h-3 w-3 text-gray-700 animate-pulse"
              style={{ animationDelay: "1.5s" }}
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Nyambika
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            Initializing AI-powered experience...
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-gold-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gold-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
