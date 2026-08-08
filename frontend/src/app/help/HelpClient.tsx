"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/custom-ui/accordion";

type FaqKey =
  | "trackOrder"
  | "paymentMethods"
  | "returnItem"
  | "cancelOrder"
  | "deliveryTime"
  | "changeAddress"
  | "resetPassword"
  | "deleteAccount"
  | "producerAccount"
  | "tryOnAccuracy";

const CATEGORIES: { titleKey: string; faqs: FaqKey[] }[] = [
  {
    titleKey: "help.category.orders",
    faqs: ["trackOrder", "cancelOrder", "deliveryTime", "changeAddress"],
  },
  {
    titleKey: "help.category.payments",
    faqs: ["paymentMethods", "returnItem"],
  },
  {
    titleKey: "help.category.account",
    faqs: ["resetPassword", "deleteAccount", "producerAccount"],
  },
  {
    titleKey: "help.category.tryOn",
    faqs: ["tryOnAccuracy"],
  },
];

export default function HelpClient() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <PageHeader titleKey="help.title" subtitleKey="help.subtitle" />

      <section className="mb-12 space-y-8">
        {CATEGORIES.map((category) => (
          <div key={category.titleKey}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {t(category.titleKey)}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {category.faqs.map((faq) => (
                <AccordionItem key={faq} value={faq}>
                  <AccordionTrigger className="text-left">
                    {t(`help.faq.${faq}.question`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(`help.faq.${faq}.answer`)}
                    {faq === "returnItem" && (
                      <a
                        href="/returns"
                        className="text-foreground hover:underline ml-1"
                      >
                        {t("help.faq.returnItem.link")}
                      </a>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          {t("help.contact.title")}
        </h2>
        <p className="mb-4 text-muted-foreground">
          {t("help.contact.description")}
        </p>
        <a
          href="/contact"
          className="inline-flex items-center px-4 py-2 bg-gold-600 text-white rounded-full hover:bg-gold-700 transition-colors"
        >
          {t("help.contact.button")}
        </a>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">
          {t("help.sizeGuide.title")}
        </h2>
        <p className="mb-4 text-muted-foreground">
          {t("help.sizeGuide.description")}
          <a
            href="/size-guide"
            className="text-foreground hover:underline ml-1"
          >
            {t("help.sizeGuide.link")}
          </a>
        </p>
      </section>
    </div>
  );
}
