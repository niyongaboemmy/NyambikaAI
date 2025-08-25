import CategoryCards from "@/components/CategoryCards";
import HeroSection from "@/components/HeroSection";
import HomeProducts from "@/components/HomeProducts";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen pt-8 md:pt-10 pb-12">
      {/* AI Try-On Banner - Enhanced with Modern AI Design & Mobile Optimized */}
      <div className="mb-4">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/40 dark:border-white/5 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/30 dark:from-gray-950 dark:via-slate-900/40 dark:to-gray-900/60 backdrop-blur-sm">
          {/* Holographic Aurora Background - Optimized for mobile */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-20 sm:-top-32 -right-16 sm:-right-20 h-60 sm:h-80 w-60 sm:w-80 rounded-full blur-2xl sm:blur-3xl opacity-30 bg-gradient-to-br from-blue-400/60 via-purple-500/40 to-pink-400/50 animate-pulse"
              style={{ animationDuration: "4s" }}
            />
            <div
              className="absolute -bottom-20 sm:-bottom-32 -left-16 sm:-left-24 h-72 sm:h-96 w-72 sm:w-96 rounded-full blur-2xl sm:blur-3xl opacity-20 bg-gradient-to-tr from-cyan-400/50 via-indigo-500/40 to-violet-500/50 animate-pulse"
              style={{ animationDuration: "6s", animationDelay: "1s" }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 sm:h-64 w-48 sm:w-64 rounded-full blur-2xl sm:blur-3xl opacity-15 bg-gradient-to-r from-emerald-400/40 to-teal-500/40 animate-pulse"
              style={{ animationDuration: "8s", animationDelay: "2s" }}
            />
          </div>

          {/* Neural Network Grid Pattern - Simplified for mobile */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.12] sm:opacity-[0.15] mix-blend-multiply dark:opacity-8 sm:dark:opacity-10"
            style={{
              backgroundImage: `
                  radial-gradient(circle at 2px 2px, rgba(59,130,246,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px),
                  linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px)
                `,
              backgroundSize: "20px 20px, 20px 20px, 20px 20px",
            }}
          />

          {/* Animated AI Particles - Reduced for mobile performance */}
          <div className="pointer-events-none absolute inset-0">
            {/* Main floating particles */}
            <span
              className="absolute left-4 sm:left-8 top-4 sm:top-8 h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-blue-400/90 animate-ping"
              style={{ animationDuration: "2s", animationDelay: "0s" }}
            />
            <span
              className="absolute right-6 sm:right-12 top-6 sm:top-12 h-1 w-1 rounded-full bg-purple-400/90 animate-ping"
              style={{ animationDuration: "3s", animationDelay: "0.5s" }}
            />
            <span
              className="absolute left-1/4 bottom-6 sm:bottom-10 h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-cyan-400/90 animate-ping"
              style={{ animationDuration: "2.5s", animationDelay: "1s" }}
            />
            <span
              className="absolute right-1/4 bottom-8 sm:bottom-16 h-1 w-1 rounded-full bg-pink-400/90 animate-ping"
              style={{ animationDuration: "3.5s", animationDelay: "1.5s" }}
            />

            {/* Scanning line effect - Hidden on very small screens */}
            <div className="hidden sm:block absolute inset-0 opacity-20">
              <div
                className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400/60 to-transparent animate-pulse"
                style={{
                  position: "absolute",
                  top: "30%",
                  animationDuration: "4s",
                  transform: "translateY(-50%)",
                }}
              />
            </div>
          </div>

          {/* Content - Mobile Optimized Layout */}
          <div className="w-full relative flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
            <div className="flex-1 w-full">
              {/* Status Badge - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-3">
                <span className="relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-200 ring-1 ring-blue-200/50 dark:ring-blue-400/20 bg-white/90 dark:bg-white/5 backdrop-blur-sm w-fit">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  AI POWERED
                </span>
                <div className="flex sm:hidden items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex gap-0.5">
                    <div
                      className="h-1 w-1 rounded-full bg-blue-400 animate-pulse"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="h-1 w-1 rounded-full bg-purple-400 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="h-1 w-1 rounded-full bg-pink-400 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                  <span>Neural processing</span>
                </div>
                <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex gap-0.5">
                    <div
                      className="h-1 w-1 rounded-full bg-blue-400 animate-pulse"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="h-1 w-1 rounded-full bg-purple-400 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="h-1 w-1 rounded-full bg-pink-400 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                  <span>Neural processing active</span>
                </div>
              </div>

              {/* Main Title with Enhanced AI Icon - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-3 w-full">
                {/* Enhanced AI Icon with Multiple Animations - Smaller on mobile */}
                <span className="relative inline-flex items-center justify-center shrink-0 self-start sm:self-auto">
                  {/* Outer rotating ring - Smaller on mobile */}
                  <span
                    className="absolute -inset-3 sm:-inset-4 rounded-full bg-gradient-conic from-blue-500 via-purple-500 to-pink-500 opacity-40 blur-sm animate-spin"
                    style={{ animationDuration: "8s" }}
                  />
                  {/* Inner counter-rotating ring - Smaller on mobile */}
                  <span
                    className="absolute -inset-1.5 sm:-inset-2 rounded-full bg-gradient-conic from-cyan-400 via-blue-500 to-purple-500 opacity-30 blur-sm animate-spin"
                    style={{
                      animationDuration: "6s",
                      animationDirection: "reverse",
                    }}
                  />
                  {/* Icon container - Smaller on mobile */}
                  <span className="relative z-10 rounded-full bg-white/95 dark:bg-slate-900/95 text-blue-600 dark:text-blue-400 p-2 sm:p-3 shadow-lg ring-1 ring-blue-200/50 dark:ring-blue-400/20 backdrop-blur-sm">
                    <Sparkles className="h-6 w-6 sm:h-5 sm:w-5 animate-pulse" />
                  </span>
                  {/* Orbiting dots - Hidden on mobile for performance */}
                  <span
                    className="hidden sm:block absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 animate-spin"
                    style={{
                      animationDuration: "3s",
                      transformOrigin: "0 20px",
                    }}
                  />
                </span>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    Try On with AI
                  </span>
                </h1>
              </div>

              {/* Description - Mobile Optimized */}
              <div className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-4 w-full">
                Upload a photo and try outfits in seconds. AI matches your
                shape, tone, and style.
              </div>

              {/* Feature Pills - Mobile Optimized */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Real-time
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                  Smart Style
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-pink-100/80 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                  Perfect Fit
                </span>
              </div>
            </div>

            {/* CTA Buttons - Mobile Optimized */}
            <div className="flex flex-col md:flex-row gap-3 w-full sm:w-auto sm:shrink-0">
              <div className="relative group">
                {/* Enhanced glow effect */}
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50 blur-lg transition-all duration-300 group-hover:opacity-75 group-hover:blur-xl animate-pulse" />
                <Button
                  asChild
                  className="relative rounded-full w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6 py-6 sm:py-6 text-base sm:text-sm shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  <Link
                    href="/try-on"
                    className="flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-5 w-5 sm:h-4 sm:w-4" />
                    Start AI Try-On
                  </Link>
                </Button>
              </div>
              <div></div>
              {/* <Button
                  asChild
                  variant="outline"
                  className="hidden md:flex items-center justify-center w-full sm:w-auto border-blue-200/60 dark:border-white/10 text-blue-700 dark:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-white/5 backdrop-blur-sm font-medium px-6 py-6 sm:py-6 rounded-full text-base sm:text-sm transition-all duration-300 hover:scale-105"
                >
                  <Link
                    href="/products"
                    className="flex items-center justify-center gap-2"
                  >
                    Browse Collection
                  </Link>
                </Button> */}
            </div>
          </div>

          {/* Bottom scanning line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse"
            style={{ animationDuration: "3s" }}
          />
        </div>
      </div>
      <HomeProducts />
    </div>
  );
}
