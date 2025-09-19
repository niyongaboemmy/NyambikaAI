"use client";

import { Card, CardContent } from "@/components/custom-ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyClient() {
  const { t } = useLanguage();
  return (
    <div className="py-10">
      <PageHeader
        badge="Privacy"
        badgeTone="blue"
        titleKey="privacy.title"
        subtitleKey="privacy.subtitle"
      />

      <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
        <CardContent className="p-6 md:p-8 space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("privacy.section1.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("privacy.section1.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("privacy.section2.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("privacy.section2.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("privacy.section3.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("privacy.section3.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("privacy.section4.title")}
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>{t("privacy.section4.item1")}</li>
              <li>{t("privacy.section4.item2")}</li>
              <li>{t("privacy.section4.item3")}</li>
              <li>{t("privacy.section4.item4")}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("privacy.section5.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("privacy.section5.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("privacy.section6.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("privacy.section6.body")}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
