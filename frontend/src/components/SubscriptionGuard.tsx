'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredForRoles?: string[];
}

export default function SubscriptionGuard({ 
  children, 
  requiredForRoles = ['producer'] 
}: SubscriptionGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'valid' | 'invalid' | 'not-required'>('loading');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    checkSubscription();
  }, [isAuthenticated, user]);

  const checkSubscription = async () => {
    if (!isAuthenticated) return;
    
    if (!user) {
      setSubscriptionStatus('not-required');
      return;
    }

    // Check if user role requires subscription
    const userRole = user?.role || 'customer';
    if (!requiredForRoles.includes(userRole)) {
      setSubscriptionStatus('not-required');
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/user/${user?.id}`);
      
      if (response.ok) {
        const subscriptionData = await response.json();
        
        // Check if subscription is active and not expired
        const endDate = new Date(subscriptionData.subscription.endDate);
        const now = new Date();
        
        if (subscriptionData.subscription.status === 'active' && endDate > now) {
          setSubscription(subscriptionData);
          setSubscriptionStatus('valid');
        } else {
          setSubscriptionStatus('invalid');
        }
      } else {
        setSubscriptionStatus('invalid');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus('invalid');
    }
  };

  if (status === 'loading' || subscriptionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (subscriptionStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          {/* Animated warning icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-ping">
              <AlertTriangle className="h-20 w-20 text-orange-400 mx-auto opacity-75" />
            </div>
            <AlertTriangle className="h-20 w-20 text-orange-400 mx-auto relative" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-6">
            Subscription Required
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            To access producer features, you need an active subscription plan.
          </p>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Why do I need a subscription?</h3>
            <ul className="text-gray-300 space-y-2 text-left">
              <li>• Access to advanced AI-powered analytics</li>
              <li>• Unlimited product listings</li>
              <li>• Priority customer support</li>
              <li>• Custom branding options</li>
              <li>• Mobile payment integrations</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/subscription')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Choose a Plan
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl transition-all duration-300 hover:bg-white/20"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription status for valid subscriptions
  if (subscriptionStatus === 'valid' && subscription) {
    const endDate = new Date(subscription.subscription.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <div>
        {/* Subscription status bar */}
        {daysLeft <= 7 && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-orange-500/30 p-3">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-400 mr-2" />
                <span className="text-white">
                  Your {subscription.plan.name} plan expires in {daysLeft} days
                </span>
              </div>
              <button
                onClick={() => router.push('/subscription')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Renew Now
              </button>
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
