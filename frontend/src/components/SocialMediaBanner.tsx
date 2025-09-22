"use client";

import React from "react";
import {
  Store,
  TrendingUp,
  Bell,
  BarChart3,
  ShoppingBag,
  Users,
  DollarSign,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface SocialMediaBannerProps {
  variant?: "facebook" | "instagram" | "twitter" | "linkedin";
  className?: string;
}

const SocialMediaBanner: React.FC<SocialMediaBannerProps> = ({
  variant = "facebook",
  className = "",
}) => {
  // Dimensions optimized for different platforms
  const dimensions = {
    facebook: "w-[1200px] h-[630px]", // Facebook post/share
    instagram: "w-[1080px] h-[1080px]", // Instagram square
    twitter: "w-[1200px] h-[675px]", // Twitter card
    linkedin: "w-[1200px] h-[627px]", // LinkedIn post
  };

  const benefits = [
    { icon: Store, text: "Your Own Store", color: "text-purple-300" },
    { icon: BarChart3, text: "Analytics Dashboard", color: "text-blue-300" },
    { icon: Bell, text: "Real-time Notifications", color: "text-green-300" },
    { icon: DollarSign, text: "No Sales Commission", color: "text-yellow-300" },
  ];

  return (
    <div
      className={`${dimensions[variant]} ${className} relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col justify-between p-12`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Animated Orbs */}
        <div className="absolute top-20 left-20 w-48 h-48 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-green-400/25 to-emerald-400/25 rounded-full blur-2xl"></div>

        {/* Neural Network Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full"></div>
          <div className="absolute top-3/4 left-3/4 w-3 h-3 bg-white rounded-full"></div>
          <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-white rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white rounded-full"></div>

          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full">
            <line
              x1="25%"
              y1="25%"
              x2="50%"
              y2="50%"
              stroke="white"
              strokeWidth="1"
              opacity="0.2"
            />
            <line
              x1="75%"
              y1="75%"
              x2="50%"
              y2="50%"
              stroke="white"
              strokeWidth="1"
              opacity="0.2"
            />
            <line
              x1="75%"
              y1="50%"
              x2="50%"
              y2="50%"
              stroke="white"
              strokeWidth="1"
              opacity="0.2"
            />
          </svg>
        </div>
      </div>

      {/* Header Section */}
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-75"></div>
            <div className="relative bg-white/10 backdrop-blur-md p-6 rounded-full border-2 border-white/30">
              <Store className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Nyambika
          </span>
        </h1>

        <h2 className="text-4xl font-bold text-white mb-6">
          Join as a Producer
        </h2>

        <p className="text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
          Start selling your products on Rwanda's leading AI-powered fashion
          platform
        </p>
      </div>

      {/* Benefits Section */}
      <div className="relative z-10">
        <div className="grid grid-cols-2 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <benefit.icon className="h-8 w-8 text-white" />
              </div>
              <span className={`text-2xl font-semibold ${benefit.color}`}>
                {benefit.text}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing and CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-3xl p-8 mb-8 border border-green-400/30 inline-block">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-green-400" />
              <span className="text-3xl font-bold text-green-400">
                Starting from 50,000 RWF/month
              </span>
              <Sparkles className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xl text-white/90">
              Keep 100% of your sales revenue • No commission fees
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-white/80 text-xl">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <span>Thousands of customers</span>
            </div>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Growing marketplace</span>
            </div>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              <span>Easy setup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-12 rounded-2xl shadow-2xl inline-flex items-center gap-4 text-2xl">
          <Store className="h-8 w-8" />
          <span>Start Selling Today</span>
          <ArrowRight className="h-8 w-8" />
        </div>

        <p className="text-white/70 text-lg mt-6">
          Visit nyambika.ai to get started • Join hundreds of successful
          producers
        </p>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-8 right-8 opacity-30">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 opacity-20">
        <Sparkles className="h-12 w-12 text-white" />
      </div>
    </div>
  );
};

export default SocialMediaBanner;
