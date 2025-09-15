import type { Metadata } from "next";
import { Card, CardContent } from "@/components/custom-ui/card";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Privacy Policy • NyambikaAI",
  description:
    "Learn how NyambikaAI collects, uses, and protects your data. We value your privacy and are committed to transparency.",
};

export default function PrivacyPage() {
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
              1. Information We Collect
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We collect information to provide and improve our services,
              including account details, device information, usage data, and
              content you upload (e.g., profile photos for AI try‑on). We
              minimize collection and store only what is necessary.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Account data: name, email, role, preferences</li>
              <li>Usage data: pages visited, actions, approximate location</li>
              <li>Content: images you upload for try‑on, orders, favorites</li>
              <li>
                Technical: browser, device, IP (for security and fraud
                prevention)
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              2. How We Use Your Information
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We use data to operate NyambikaAI, deliver personalized
              experiences, ensure security, and comply with legal obligations.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Provide AI try‑on, recommendations, and shopping features</li>
              <li>Improve product quality, reliability, and performance</li>
              <li>Prevent abuse, secure accounts, and detect fraud</li>
              <li>Communicate updates, support, and important notices</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              3. Data Sharing
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We do not sell your personal information. We share data only with
              trusted providers and partners necessary to operate our platform
              (e.g., hosting, analytics, payment, or content delivery), subject
              to strict confidentiality and security measures.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              4. Your Rights & Choices
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Access, update, or delete your account data</li>
              <li>Download your data where applicable</li>
              <li>Opt out of non-essential communications</li>
              <li>Control cookies in your browser settings</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              5. Data Security & Retention
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We use industry-standard security practices. Data is retained only
              as long as necessary to provide the service or meet legal
              requirements, after which it is deleted or anonymized.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              6. Contact Us
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              For privacy questions or requests, reach us at{" "}
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
