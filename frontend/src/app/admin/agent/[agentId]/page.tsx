"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Building2,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Producer {
  id: string;
  name: string;
  companyName: string;
  email: string;
  subscriptionStatus: "active" | "expired" | "pending";
  subscriptionAmount: number;
  commissionEarned: number;
  lastPayment: string;
  nextPayment: string;
}

interface AgentDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  totalProducers: number;
  totalCommissions: number;
  lastActive: string;
  status: "active" | "inactive";
  producers: Producer[];
}

export default function AgentDetails({ params }: { params: { agentId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockAgent: AgentDetails = {
      id: params.agentId,
      name: "Jean Baptiste Uwimana",
      email: "jean.uwimana@email.com",
      phone: "+250788123456",
      createdAt: "2024-01-15",
      totalProducers: 12,
      totalCommissions: 45000,
      lastActive: "2024-01-20",
      status: "active",
      producers: [
        {
          id: "prod-1",
          name: "Marie Mukamana",
          companyName: "Elegant Fashion",
          email: "marie@elegantfashion.rw",
          subscriptionStatus: "active",
          subscriptionAmount: 50000,
          commissionEarned: 10000,
          lastPayment: "2024-01-15",
          nextPayment: "2024-02-15",
        },
        {
          id: "prod-2",
          name: "Paul Nkurunziza",
          companyName: "Modern Styles",
          email: "paul@modernstyles.rw",
          subscriptionStatus: "active",
          subscriptionAmount: 75000,
          commissionEarned: 15000,
          lastPayment: "2024-01-10",
          nextPayment: "2024-02-10",
        },
        {
          id: "prod-3",
          name: "Grace Uwimana",
          companyName: "Trendy Wear",
          email: "grace@trendywear.rw",
          subscriptionStatus: "expired",
          subscriptionAmount: 60000,
          commissionEarned: 12000,
          lastPayment: "2023-12-20",
          nextPayment: "2024-01-20",
        },
      ],
    };

    setTimeout(() => {
      setAgent(mockAgent);
      setIsLoading(false);
    }, 1000);
  }, [params.agentId]);

  if (!user || user.role !== "admin") {
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
                You need admin privileges to access this page.
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
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Agent Not Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                The requested agent could not be found.
              </p>
              <Button
                onClick={() => router.push("/admin/agents-management")}
                className="mt-4"
              >
                Back to Agents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProducers = agent.producers.filter(p => p.subscriptionStatus === "active").length;
  const expiredProducers = agent.producers.filter(p => p.subscriptionStatus === "expired").length;
  const totalSubscriptionValue = agent.producers.reduce((sum, p) => sum + p.subscriptionAmount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/agents-management")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {agent.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Agent Details & Producer Management
          </p>
        </div>
      </div>

      {/* Agent Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agent Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {agent.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{agent.email}</p>
              </div>
            </div>
            {agent.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium">{agent.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                <p className="font-medium">{new Date(agent.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Total Producers
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {agent.totalProducers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                    Active Producers
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {activeProducers}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Total Commissions
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {agent.totalCommissions.toLocaleString()} RWF
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                    Subscription Value
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {totalSubscriptionValue.toLocaleString()} RWF
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Producers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Managed Producers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Next Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.producers.map((producer) => (
                  <TableRow key={producer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {producer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {producer.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {producer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{producer.companyName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {producer.subscriptionAmount.toLocaleString()} RWF
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {producer.commissionEarned.toLocaleString()} RWF
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(producer.lastPayment).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(producer.nextPayment).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={producer.subscriptionStatus === "active" ? "default" : "destructive"}
                        className={
                          producer.subscriptionStatus === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : producer.subscriptionStatus === "expired"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        }
                      >
                        {producer.subscriptionStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
