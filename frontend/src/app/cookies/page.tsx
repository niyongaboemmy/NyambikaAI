import type { Metadata } from "next";
import { Card, CardContent } from "@/components/custom-ui/card";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Cookie Policy • NyambikaAI",
  description:
    "Understand how NyambikaAI uses cookies and similar technologies to improve your experience.",
};

export default function CookiesPage() {
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
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              1. What Are Cookies?
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Cookies are small text files stored on your device to remember
              preferences and improve site performance. We also use similar
              technologies like local storage and pixels.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              2. Types of Cookies We Use
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>
                Essential: required for core functionality (auth, cart,
                navigation)
              </li>
              <li>
                Performance: helps us understand usage and improve features
              </li>
              <li>Preferences: remembers your theme, language, and settings</li>
              <li>Analytics: helps measure engagement and product quality</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              3. Managing Cookies
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You can control cookies through your browser settings. Disabling
              some cookies may affect site functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              4. Contact
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              For questions about this policy, email{" "}
              <a
                href="mailto:privacy@nyambika.com"
                className="text-blue-600 hover:underline"
              >
                privacy@nyambika.com
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
