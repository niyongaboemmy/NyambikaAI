"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import { Badge } from "@/components/custom-ui/badge";
import { Separator } from "@/components/custom-ui/separator";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Brain,
  Sparkles,
  Globe,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/config/api";

interface ProducerDetails {
  id: string;
  username: string;
  email: string;
  fullName: string;
  businessName: string;
  phone: string;
  location: string;
  isVerified: boolean;
  createdAt: string;
  subscriptionId: string;
  subscriptionStatus: "active" | "expired" | "pending" | null;
  subscriptionEndDate: string;
  subscriptionStartDate: string;
  planName: string;
  planPrice: string;
  billingCycle: string;
  productsCount: number;
  commissionEarned: number;
  paymentHistory: PaymentRecord[];
  // Company fields
  companyId?: string | null;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyLocation?: string | null;
  companyTin?: string | null;
  companyLogoUrl?: string | null;
  companyWebsiteUrl?: string | null;
  companyCreatedAt?: string | null;
}

interface PaymentRecord {
  id: string;
  amount: string;
  agentCommission: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export default function ProducerSubscriptionDetails() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [producer, setProducer] = useState<ProducerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const producerId = params.id as string;

  // Fetch producer details
  const fetchProducerDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/agent/producer/${producerId}`);
      setProducer(response.data);
    } catch (error) {
      console.error("Error fetching producer details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch producer details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (producerId) {
      fetchProducerDetails();
    }
  }, [producerId]);

  if (!user || user.role !== "agent") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You need agent privileges to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Producer Not Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                The producer you're looking for doesn't exist or is not assigned
                to you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Expired
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">No Subscription</Badge>;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen pt-6">
      {/* Holographic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.4) 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.4) 2px, transparent 2px)
              `,
              backgroundSize: "50px 50px, 50px 50px, 100px 100px, 100px 100px",
            }}
          />
        </div>
      </div>

      <div className="relative space-y-6 px-2 sm:px-3 lg:px-0 py-6">
        {/* Enhanced AI-Themed Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 md:gap-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/agent/producers-management")}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Producers
            </Button>
            <div className="flex items-center gap-4 md:gap-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  className="absolute -inset-2 rounded-2xl border-2 border-blue-500/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -inset-1 rounded-2xl border border-purple-500/30"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-2 h-2 text-white" />
                </motion.div>
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  Subscription Details
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {producer.fullName || producer.username} -{" "}
                  {producer.companyName}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={fetchProducerDetails}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Producer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Producer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {producer.companyLogoUrl ? (
                    <img
                      src={producer.companyLogoUrl}
                      alt={producer.companyName || "Company Logo"}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                      {producer.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-lg">
                      {producer.fullName || producer.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Joined {new Date(producer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Business:</span>
                    <span>{producer.businessName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Email:</span>
                    <span>{producer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Phone:</span>
                    <span>{producer.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Location:</span>
                    <span>{producer.location || "N/A"}</span>
                  </div>
                </div>

                <Separator />

                {/* Company Information */}
                {(producer.companyName ||
                  producer.companyEmail ||
                  producer.companyPhone ||
                  producer.companyLocation ||
                  producer.companyTin ||
                  producer.companyWebsiteUrl) && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Company Information
                    </p>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Name:</span>
                      <span>{producer.companyName || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span>{producer.companyEmail || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Phone:</span>
                      <span>{producer.companyPhone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Location:</span>
                      <span>{producer.companyLocation || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-gray-200 dark:bg-gray-700 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                        TIN
                      </span>
                      <span className="font-medium">Tax ID:</span>
                      <span>{producer.companyTin || "N/A"}</span>
                    </div>
                    {producer.companyWebsiteUrl && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Website:</span>
                        <a
                          href={producer.companyWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {producer.companyWebsiteUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="font-medium">Products:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {producer.productsCount}
                  </span>
                </div>

                <Button
                  onClick={() => router.push(`/store/${producer.companyId}`)}
                  variant="outline"
                  className="w-full border-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Store
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(producer.subscriptionStatus)}
                    {getStatusBadge(producer.subscriptionStatus)}
                  </div>
                </div>

                {producer.subscriptionStatus && (
                  <>
                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Plan:</span>
                        <span>{producer.planName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Price:</span>
                        <span>
                          {Number(producer.planPrice || 0).toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Billing:</span>
                        <span className="capitalize">
                          {producer.billingCycle || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Start Date:</span>
                        <span>
                          {producer.subscriptionStartDate
                            ? new Date(
                                producer.subscriptionStartDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">End Date:</span>
                        <span>
                          {producer.subscriptionEndDate
                            ? new Date(
                                producer.subscriptionEndDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-medium">Commission Earned:</span>
                      <span className="text-lg font-semibold text-green-600">
                        {producer.commissionEarned.toLocaleString()} RWF
                      </span>
                    </div>

                    {producer.subscriptionStatus === "expired" && (
                      <Button
                        onClick={() =>
                          router.push(
                            `/agent/subscription/renew/${producer.id}`
                          )
                        }
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renew Subscription
                      </Button>
                    )}
                  </>
                )}

                {!producer.subscriptionStatus && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      This producer doesn't have an active subscription.
                    </p>
                    <Button
                      onClick={() =>
                        router.push(`/agent/subscription/create/${producer.id}`)
                      }
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Create Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {/* Payment History */}
        {producer.paymentHistory && producer.paymentHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {producer.paymentHistory.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-br from-gray-50/60 to-white/60 dark:from-gray-800/40 dark:to-gray-900/40 backdrop-blur-xl p-3 sm:p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {payment.paymentMethod}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Amount
                          </p>
                          <p className="font-semibold">
                            {Number(payment.amount).toLocaleString()} RWF
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Commission
                          </p>
                          <p className="font-semibold text-green-600">
                            {Number(payment.agentCommission).toLocaleString()}{" "}
                            RWF
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
