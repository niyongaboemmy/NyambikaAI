import type { Metadata } from "next";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "About Us • NyambikaAI",
  description:
    "Learn about NyambikaAI's mission to power Rwanda's fashion ecosystem with AI try‑on, modern commerce, and local producer enablement.",
};

export default function AboutPage() {
  return (
    <div className="py-10">
      <PageHeader badge="Our Story" badgeTone="pink" titleKey="about.title" subtitleKey="about.subtitle" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
          <CardContent className="p-6 md:p-8 space-y-6">
            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                Mission
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Empower Rwanda's fashion ecosystem with accessible AI technology, enabling consumers to visualize styles instantly and helping producers reach customers efficiently.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                What We Do
              </h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>AI Try‑On for instant fit visualization</li>
                <li>Modern marketplace for local producers</li>
                <li>Personalized recommendations and search</li>
                <li>Seamless ordering and producer dashboards</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                Values
              </h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Privacy & trust</li>
                <li>Local-first impact</li>
                <li>Inclusivity & accessibility</li>
                <li>Quality and craftsmanship</li>
              </ul>
            </section>

            <div className="pt-2">
              <Button asChild className="bg-blue-600 hover:bg-blue-500">
                <Link href="/contact">Get in touch</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800">
          <CardContent className="p-6 md:p-8 space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Quick Stats
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
