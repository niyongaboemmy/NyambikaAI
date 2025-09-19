"use client";

import { Card, CardContent } from "@/components/custom-ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CookiesClient() {
  const { t } = useLanguage();
  return (
    <div className="py-10">
      <PageHeader
        badge="Transparency"
        badgeTone="cyan"
        titleKey="cookies.title"
        subtitleKey="cookies.subtitle"
      />

      <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
        <CardContent className="p-6 md:p-8 space-y-8">
          <section className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("cookies.body.intro")}
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("cookies.section1.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("cookies.section1.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("cookies.section2.title")}
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>{t("cookies.section2.item1")}</li>
              <li>{t("cookies.section2.item2")}</li>
              <li>{t("cookies.section2.item3")}</li>
              <li>{t("cookies.section2.item4")}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("cookies.section3.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("cookies.section3.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("cookies.section4.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("cookies.section4.body")}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
