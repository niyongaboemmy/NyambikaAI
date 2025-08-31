// frontend/src/app/try-on/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TryOnWidget } from "@/components/TryOnWidget";
import { useRouter } from "next/navigation";

export default function TryOnPage() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const router = useRouter();

  const handleNavigateToProduct = () => {
    // Navigate to the product details page
    router.push("/products/example-product");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Virtual Try-On
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            See how our clothes look on you before you buy
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg
                  className="h-12 w-12 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Try It On Virtually
              </h2>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Upload your photo and see how our clothes look on you
              </p>
              <div className="mt-8">
                <Button
                  onClick={() => setIsWidgetOpen(true)}
                  size="lg"
                  className="px-8 py-6 text-lg"
                >
                  Start Virtual Try-On
                </Button>
              </div>
            </div>
          </div>
          <div className="px-4 py-6 bg-gray-50 dark:bg-gray-700/30 text-center sm:px-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't worry, we don't store your photos. Your privacy is important
              to us.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Upload Your Photo",
                description:
                  "Take a full-body selfie or upload a photo with good lighting and clear visibility.",
                icon: (
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                ),
              },
              {
                title: "Choose Your Style",
                description:
                  "Browse our collection and select the clothing item you want to try on.",
                icon: (
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                ),
              },
              {
                title: "See the Result",
                description:
                  "Our AI will show you how the clothing looks on you in seconds!",
                icon: (
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ),
              },
            ].map((step, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {step.icon}
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isWidgetOpen && (
        <TryOnWidget
          onClose={() => setIsWidgetOpen(false)}
          onNavigateToProduct={handleNavigateToProduct}
        />
      )}
    </div>
  );
}
