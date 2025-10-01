'use client';

import { Card, CardContent } from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SizeGuideClient() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <PageHeader
        titleKey="sizeGuide.title"
        subtitleKey="sizeGuide.subtitle"
      />
      
      <div className="prose dark:prose-invert">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            {t('sizeGuide.howToMeasure.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-3">
                {t('sizeGuide.howToMeasure.bust.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('sizeGuide.howToMeasure.bust.description')}
              </p>
              <h3 className="text-lg font-medium mb-3">
                {t('sizeGuide.howToMeasure.waist.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('sizeGuide.howToMeasure.waist.description')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">
                {t('sizeGuide.howToMeasure.hips.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('sizeGuide.howToMeasure.hips.description')}
              </p>
              <h3 className="text-lg font-medium mb-3">
                {t('sizeGuide.howToMeasure.inseam.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('sizeGuide.howToMeasure.inseam.description')}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">
            {t('sizeGuide.womensSizeChart.title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('sizeGuide.womensSizeChart.headers.size')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('sizeGuide.womensSizeChart.headers.bust')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('sizeGuide.womensSizeChart.headers.waist')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('sizeGuide.womensSizeChart.headers.hips')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <tr key={size} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {t(`sizeGuide.womensSizeChart.sizes.${size}.bust`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {t(`sizeGuide.womensSizeChart.sizes.${size}.waist`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {t(`sizeGuide.womensSizeChart.sizes.${size}.hips`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            {t('sizeGuide.needHelp.title')}
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            {t('sizeGuide.needHelp.description')}
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {t('sizeGuide.needHelp.button')}
          </a>
        </section>
      </div>
    </div>
  );
}
