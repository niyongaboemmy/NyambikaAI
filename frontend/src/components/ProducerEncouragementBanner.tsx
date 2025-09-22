"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  TrendingUp,
  Bell,
  BarChart3,
  ShoppingBag,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  DollarSign,
  Clock,
  Shield,
} from "lucide-react";

interface ProducerEncouragementBannerProps {
  className?: string;
  showCTA?: boolean;
}

const ProducerEncouragementBanner: React.FC<
  ProducerEncouragementBannerProps
> = ({ className = "", showCTA = true }) => {
  const router = useRouter();

  const benefits = [
    {
      icon: Store,
      title: "Your Own Store",
      description: "Get a dedicated store page to showcase your products",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track sales, revenue, and product performance",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Get instant alerts for new orders and updates",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: ShoppingBag,
      title: "Order Management",
      description:
        "Manage orders, update status, and communicate with customers",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Users,
      title: "Customer Reach",
      description: "Access thousands of customers looking for your products",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: DollarSign,
      title: "No Sales Commission",
      description: "Keep 100% of your sales revenue - only pay subscription",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const features = [
    { icon: Zap, text: "Quick setup in minutes" },
    { icon: Clock, text: "24/7 order notifications" },
    { icon: Shield, text: "Secure payment processing" },
    { icon: TrendingUp, text: "Growing customer base" },
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 md:p-12 ${className}`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-green-400/25 to-emerald-400/25 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Neural Network Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping"></div>
          <div
            className="absolute top-3/4 left-3/4 w-2 h-2 bg-white rounded-full animate-ping"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 right-1/4 w-2 h-2 bg-white rounded-full animate-ping"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20">
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Join Nyambika
            </span>
          </div>

          <p className="text-base text-white/90 mb-6 font-normal">
            Become a Producer & Grow Your Business
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20"
              >
                <feature.icon className="h-4 w-4" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${benefit.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Highlight */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-6 mb-8 border border-green-400/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-semibold">
                Flexible Pricing
              </span>
              <Sparkles className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-white/90 mb-2">
              Starting from{" "}
              <span className="text-2xl font-bold text-green-400">
                15,000 RWF
              </span>{" "}
              per month
            </p>
            <p className="text-white/70 text-sm">
              Save up to 30% with annual plans • No sales commission • Keep 100%
              of your revenue
            </p>
          </div>
        </div>

        {/* Call to Action */}
        {showCTA && (
          <div className="text-center">
            <button
              onClick={() => router.push("/register")}
              className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Store className="h-5 w-5" />
              Start Selling Today
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-white/60 text-sm mt-4">
              Join hundreds of successful producers already selling on Nyambika
            </p>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProducerEncouragementBanner;
