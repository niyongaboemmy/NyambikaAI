"use client";

import { Camera, ChevronsDown, Sparkles, Star, Users, Zap } from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

export default function HeroSection() {
  const { t } = useLanguage();

  const handleExplore = () => {
    const el = document.getElementById("home-products");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="home-hero"
      className="flex items-center justify-center pt-8 pb-4 px-4 md:px-6 relative overflow-hidden"
    >
      {/* Layered gradient + soft blobs, on current gold token palette */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-muted/40" />
        <div className="absolute -top-24 -left-24 h-80 w-80 bg-gold-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute top-20 -right-24 h-72 w-72 bg-gold-500/20 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-3xl mx-auto py-8">
        <div className="animate-float">
          {/* Context badge */}
          <span className="inline-flex items-center gap-1.5 mb-5 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold tracking-wide text-gold-700 dark:text-gold-300 uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.hero.badge")}
          </span>

          <h1 className="text-3xl md:text-5xl font-serif font-semibold mb-4 text-foreground">
            {t("home.hero.title")}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl mx-auto">
            {t("home.hero.subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link href="/try-on" className="w-full sm:w-auto">
            <Button
              className="group w-full sm:w-auto rounded-full px-8 py-4 font-semibold text-lg shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/30 hover:scale-105 active:scale-100 transition-all duration-300"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
              {t("home.hero.ctaTryOn")}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="group w-full sm:w-auto rounded-full px-6 py-4 font-medium text-base text-muted-foreground hover:text-foreground hover:scale-105 active:scale-100 transition-all duration-300"
            size="lg"
            onClick={handleExplore}
          >
            {t("home.hero.ctaExplore")}
            <ChevronsDown className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </Button>
        </div>

        {/* Trust / stats strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
            <span className="font-semibold text-foreground">4.9</span>
            {t("home.hero.statRating")}
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-gold-500" />
            <span className="font-semibold text-foreground">10K+</span>
            {t("home.hero.statTryOns")}
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gold-500" />
            <span className="font-semibold text-foreground">5K+</span>
            {t("home.hero.statUsers")}
          </span>
        </div>
      </div>
    </section>
  );
}
