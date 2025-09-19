"use client";

import { Card, CardContent } from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutClient() {
  const { t } = useLanguage();
  return (
    <div className="py-10">
      <PageHeader
        badge="Our Story"
        badgeTone="pink"
        titleKey="about.title"
        subtitleKey="about.subtitle"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
          <CardContent className="p-6 md:p-8 space-y-6">
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                {t("about.mission")}
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t("about.mission.body")}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                {t("about.whatWeDo")}
              </h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>{t("about.whatWeDo.item1")}</li>
                <li>{t("about.whatWeDo.item2")}</li>
                <li>{t("about.whatWeDo.item3")}</li>
                <li>{t("about.whatWeDo.item4")}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                {t("about.values")}
              </h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>{t("about.values.item1")}</li>
                <li>{t("about.values.item2")}</li>
                <li>{t("about.values.item3")}</li>
                <li>{t("about.values.item4")}</li>
              </ul>
            </section>

            <div className="pt-2">
              <Button asChild className="bg-blue-600 hover:bg-blue-500">
                <Link href="/contact">{t("about.getInTouch")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
          <CardContent className="p-6 md:p-8 space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("about.quickStats")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• 1000+ products showcased</li>
              <li>• 50+ local producers supported</li>
              <li>• 10k+ try‑on sessions</li>
            </ul>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Figures are illustrative and updated as we grow the platform.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
