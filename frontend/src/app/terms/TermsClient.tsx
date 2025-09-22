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
        badgeTone="purple"
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
              By using Nyambika, you agree to these Terms. If you do not agree,
              please discontinue use of the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section2.title")}
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>You must provide accurate account information.</li>
              <li>Do not misuse the platform, including attempts to disrupt or reverse engineer services.</li>
              <li>Respect intellectual property and community guidelines.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section3.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You retain rights to the photos you upload. You grant Nyambika a limited license to process and display your content solely to provide the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section4.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Orders are placed directly with producers on the platform. Nyambika facilitates discovery and ordering. Payment and fulfillment terms may vary by producer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section5.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              The service is provided "as is" without warranties. To the maximum extent permitted by law, Nyambika is not liable for indirect or consequential damages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section6.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We may update these Terms from time to time. Material changes will be communicated through the platform or by email.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {t("terms.section7.title")}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              For questions about these Terms, contact <a href="mailto:legal@nyambika.com" className="text-blue-600 hover:underline">legal@nyambika.com</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
