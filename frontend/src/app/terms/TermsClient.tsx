"use client";

import { Card, CardContent } from "@/components/custom-ui/card";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsClient() {
  const { t } = useLanguage();
  return (
    <div className="py-10">
      <PageHeader
        badge="Legal"
        badgeTone="blue"
        titleKey="terms.title"
        subtitleKey="terms.subtitle"
      />

      <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
        <CardContent className="p-6 md:p-8 space-y-8">
          <section className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("terms.body.intro")}
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section1.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("terms.section1.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section2.title")}
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>{t("terms.section2.item1")}</li>
              <li>{t("terms.section2.item2")}</li>
              <li>{t("terms.section2.item3")}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section3.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("terms.section3.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section4.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("terms.section4.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section5.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("terms.section5.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section6.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("terms.section6.body")}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section7.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t("terms.section7.body")}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
