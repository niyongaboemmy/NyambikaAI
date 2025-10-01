'use client';

import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/layout/PageHeader";

export default function HelpClient() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <PageHeader
        titleKey="help.title"
        subtitleKey="help.subtitle"
      />
      
      <div className="prose dark:prose-invert">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {t('help.faq.title')}
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">
                {t('help.faq.trackOrder.question')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {t('help.faq.trackOrder.answer')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {t('help.faq.paymentMethods.question')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {t('help.faq.paymentMethods.answer')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {t('help.faq.returnItem.question')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {t('help.faq.returnItem.answer')}
                <a 
                  href="/returns" 
                  className="text-indigo-600 hover:underline dark:text-indigo-400 ml-1"
                >
                  {t('help.faq.returnItem.link')}
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {t('help.contact.title')}
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {t('help.contact.description')}
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {t('help.contact.button')}
          </a>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            {t('help.sizeGuide.title')}
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {t('help.sizeGuide.description')}
            <a 
              href="/size-guide" 
              className="text-indigo-600 hover:underline dark:text-indigo-400 ml-1"
            >
              {t('help.sizeGuide.link')}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
