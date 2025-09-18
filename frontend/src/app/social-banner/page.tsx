'use client';

import React, { useState } from 'react';
import SocialMediaBanner from '@/components/SocialMediaBanner';
import { Download, Share2, Copy, Check } from 'lucide-react';

export default function SocialBannerPage() {
  const [selectedVariant, setSelectedVariant] = useState<'facebook' | 'instagram' | 'twitter' | 'linkedin'>('facebook');
  const [copied, setCopied] = useState(false);

  const variants = [
    { key: 'facebook' as const, name: 'Facebook', dimensions: '1200×630px', description: 'Perfect for Facebook posts and shares' },
    { key: 'instagram' as const, name: 'Instagram', dimensions: '1080×1080px', description: 'Square format for Instagram posts' },
    { key: 'twitter' as const, name: 'Twitter', dimensions: '1200×675px', description: 'Twitter card format' },
    { key: 'linkedin' as const, name: 'LinkedIn', dimensions: '1200×627px', description: 'LinkedIn post format' }
  ];

  const copyInstructions = async () => {
    const instructions = `How to save as PNG:
1. Right-click on the banner below
2. Select "Save image as..." or "Copy image"
3. Save as PNG format
4. Share on your preferred social media platform

Alternative method:
1. Take a screenshot of the banner area
2. Crop to remove surrounding elements
3. Save as PNG file`;

    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy instructions');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Social Media Banner Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Create and download producer recruitment banners for social media
          </p>
          
          {/* Platform Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {variants.map((variant) => (
              <button
                key={variant.key}
                onClick={() => setSelectedVariant(variant.key)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedVariant === variant.key
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="text-sm font-semibold">{variant.name}</div>
                <div className="text-xs opacity-75">{variant.dimensions}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Download className="h-6 w-6" />
              How to Save as PNG
            </h2>
            <button
              onClick={copyInstructions}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Instructions'}
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Method 1: Right-click Save</h3>
              <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>Right-click on the banner below</li>
                <li>Select "Save image as..." or "Copy image"</li>
                <li>Save as PNG format</li>
                <li>Share on your social media platform</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Method 2: Screenshot</h3>
              <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-1">
                <li>Take a screenshot of the banner area</li>
                <li>Crop to remove surrounding elements</li>
                <li>Save as PNG file</li>
                <li>Upload to your social media</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Tip:</strong> The banner is optimized for {variants.find(v => v.key === selectedVariant)?.description.toLowerCase()}. 
              Use this format for best results on {variants.find(v => v.key === selectedVariant)?.name}.
            </p>
          </div>
        </div>

        {/* Banner Preview */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-2">
            <Share2 className="h-6 w-6" />
            Preview & Download
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Current format: <strong>{variants.find(v => v.key === selectedVariant)?.name}</strong> 
            ({variants.find(v => v.key === selectedVariant)?.dimensions})
          </p>
        </div>

        {/* Banner Container */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl">
            <SocialMediaBanner 
              variant={selectedVariant}
              className="border-2 border-gray-200 dark:border-gray-600 rounded-xl"
            />
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Social Media Usage Tips</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Facebook</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Use 1200×630px for link previews</li>
                <li>Post in relevant business groups</li>
                <li>Add engaging caption about opportunities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Instagram</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Square format works best for feed posts</li>
                <li>Use relevant hashtags like #Rwanda #Business</li>
                <li>Share in stories with swipe-up link</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Twitter</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>1200×675px for Twitter cards</li>
                <li>Include call-to-action in tweet text</li>
                <li>Tag relevant accounts and use hashtags</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">LinkedIn</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Professional format for business posts</li>
                <li>Share in entrepreneur groups</li>
                <li>Write detailed post about opportunity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
