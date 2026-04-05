'use client';

import { Card, CardContent } from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ReturnsClient() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <PageHeader
        titleKey="returns.title"
        subtitleKey="returns.subtitle"
      />
      
      <div className="prose dark:prose-invert">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {t('returns.policy.title')}
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {t('returns.policy.description')}
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 my-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>{t('returns.policy.important')}:</strong> {t('returns.policy.importantText')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {t('returns.howTo.title')}
          </h2>
          <ol className="list-decimal list-inside space-y-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <li key={step} className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">
                  {t(`returns.howTo.steps.${step}.title`)}
                </span>{' '}
                {t(`returns.howTo.steps.${step}.description`)}
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            {t('returns.processing.title')}
          </h2>
          <ul className="space-y-3 text-gray-600 dark:text-gray-300">
            {['processingTime', 'refunds', 'confirmation'].map((item) => (
              <li key={item} className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t(`returns.processing.${item}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            {t('returns.needHelp.title')}
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            {t('returns.needHelp.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {t('returns.needHelp.contactButton')}
            </a>
            <a 
              href="/help" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('returns.needHelp.helpButton')}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
