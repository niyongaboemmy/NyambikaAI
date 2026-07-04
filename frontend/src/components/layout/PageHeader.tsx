"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  badge?: string;
  badgeTone?: "blue" | "cyan";
  titleKey: string;
  subtitleKey?: string;
}

const toneMap = {
  blue: {
    badge: "bg-gold-600/10 text-gray-900 dark:text-gray-300 ring-gold-600/20",
  },
  cyan: {
    badge: "bg-gold-300/10 text-gray-500 dark:text-gray-200 ring-gold-300/20",
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
      <h1 className="mt-3 text-2xl md:text-4xl font-bold text-foreground">
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
