"use client";

import { useEffect } from "react";
import { Button } from "@/components/custom-ui/button";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-lg w-full backdrop-blur-xl bg-card/90 border border-border/50">
        <CardContent className="p-8 md:p-12 text-center">
          <div className="text-6xl font-serif font-bold mb-4 text-foreground">
            {t("errorPage.title")}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t("errorPage.heading")}
          </h1>
          <p className="text-muted-foreground text-base mb-8">
            {t("errorPage.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => reset()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("errorPage.tryAgain")}
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full bg-gold-600 hover:bg-gold-700 text-primary-foreground">
                <Home className="mr-2 h-4 w-4" />
                {t("errorPage.backHome")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
