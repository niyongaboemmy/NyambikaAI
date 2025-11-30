"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  badge?: string;
  badgeTone?: "blue" | "purple" | "pink" | "cyan";
  titleKey: string;
  subtitleKey?: string;
}

const toneMap = {
  blue: {
    badge: "bg-blue-600/10 text-blue-700 dark:text-blue-300 ring-blue-600/20",
    gradient:
      "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400",
  },
  purple: {
    badge:
      "bg-purple-600/10 text-purple-700 dark:text-purple-300 ring-purple-600/20",
    gradient:
      "bg-gradient-to-r from-purple-600 via-blue-600 to-blue-600 dark:from-purple-400 dark:via-blue-400 dark:to-blue-400",
  },
  pink: {
    badge: "bg-blue-600/10 text-blue-700 dark:text-blue-300 ring-blue-600/20",
    gradient:
      "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400",
  },
  cyan: {
    badge: "bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 ring-cyan-600/20",
    gradient:
      "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400",
  },
};

export default function PageHeader({
  badge,
  badgeTone = "blue",
  titleKey,
  subtitleKey,
}: PageHeaderProps) {
  const { t } = useLanguage();
  const tone = toneMap[badgeTone];
  return (
    <div className="mb-8">
      {badge && (
        <div
          className={`inline-flex items-center gap-2 rounded-full ${tone.badge} ring-1 px-3 py-1 text-xs`}
        >
          {badge}
        </div>
      )}
      <h1
        className={`mt-3 text-2xl md:text-4xl font-bold ${tone.gradient} bg-clip-text text-transparent`}
      >
        {t(titleKey)}
      </h1>
      {subtitleKey && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
          {t(subtitleKey)}
        </p>
      )}
    </div>
  );
}
