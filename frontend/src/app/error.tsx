"use client";

import { useEffect } from "react";
import { Button } from "@/components/custom-ui/button";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-lg w-full backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/30">
        <CardContent className="p-8 md:p-12 text-center">
          <div className="text-6xl font-serif font-bold mb-4 text-foreground">
            Oops
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base mb-8">
            We hit an unexpected error loading this page. You can try again,
            or head back to the homepage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => reset()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full bg-gold-600 hover:bg-gold-700 text-white">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
