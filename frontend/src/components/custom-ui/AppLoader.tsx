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
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin">
              <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-900"></div>
            </div>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-8 w-8 text-blue-500 animate-pulse" />
            </div>

            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
            <div
              className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.5s" }}
            />
            <Sparkles
              className="absolute -top-1 -left-1 h-3 w-3 text-purple-400 animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <Zap
              className="absolute -bottom-1 -right-1 h-3 w-3 text-yellow-400 animate-pulse"
              style={{ animationDelay: "1.5s" }}
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nyambika
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            Initializing AI-powered experience...
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
