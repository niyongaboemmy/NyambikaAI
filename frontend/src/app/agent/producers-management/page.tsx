"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Filter,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Producer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  subscriptionStatus: "active" | "expired" | "pending";
  subscriptionExpiry: string;
  lastPayment: string;
  totalPaid: number;
  commissionEarned: number;
  productsCount: number;
  joinedDate: string;
}

interface ProducerStats {
  totalProducers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalCommissions: number;
}

export default function ProducersManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [filteredProducers, setFilteredProducers] = useState<Producer[]>([]);
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockProducers: Producer[] = [
      {
        id: "1",
        name: "Marie Mukamana",
        email: "marie@example.com",
        phone: "+250788123456",
        company: "Marie's Fashion",
        location: "Kigali, Rwanda",
        subscriptionStatus: "active",
        subscriptionExpiry: "2024-03-15",
        lastPayment: "2024-01-15",
        totalPaid: 150000,
        commissionEarned: 30000,
        productsCount: 25,
        joinedDate: "2023-06-15",
      },
      {
        id: "2",
        name: "Paul Nkurunziza",
        email: "paul@example.com",
        phone: "+250788234567",
        company: "Paul's Boutique",
        location: "Butare, Rwanda",
        subscriptionStatus: "active",
        subscriptionExpiry: "2024-02-28",
        lastPayment: "2024-01-19",
        totalPaid: 225000,
        commissionEarned: 45000,
        productsCount: 18,
        joinedDate: "2023-04-10",
      },
      {
        id: "3",
        name: "Grace Uwimana",
        email: "grace@example.com",
        phone: "+250788345678",
        company: "Grace Collections",
        location: "Musanze, Rwanda",
        subscriptionStatus: "expired",
        subscriptionExpiry: "2024-01-10",
        lastPayment: "2023-12-10",
        totalPaid: 75000,
        commissionEarned: 15000,
        productsCount: 12,
        joinedDate: "2023-08-20",
      },
      {
        id: "4",
        name: "John Doe",
        email: "john@example.com",
        phone: "+250788456789",
        company: "Modern Styles",
        location: "Kigali, Rwanda",
        subscriptionStatus: "active",
        subscriptionExpiry: "2024-04-20",
        lastPayment: "2024-01-17",
        totalPaid: 300000,
        commissionEarned: 60000,
        productsCount: 35,
        joinedDate: "2023-02-05",
      },
      {
        id: "5",
        name: "Alice Smith",
        email: "alice@example.com",
        phone: "+250788567890",
        company: "Alice Fashion Hub",
        location: "Gisenyi, Rwanda",
        subscriptionStatus: "pending",
        subscriptionExpiry: "2024-01-25",
        lastPayment: "2023-11-25",
        totalPaid: 60000,
        commissionEarned: 12000,
        productsCount: 8,
        joinedDate: "2023-09-15",
      },
    ];

    const mockStats: ProducerStats = {
      totalProducers: mockProducers.length,
      activeSubscriptions: mockProducers.filter(p => p.subscriptionStatus === "active").length,
      expiredSubscriptions: mockProducers.filter(p => p.subscriptionStatus === "expired").length,
      totalCommissions: mockProducers.reduce((sum, p) => sum + p.commissionEarned, 0),
    };

    setTimeout(() => {
      setProducers(mockProducers);
      setFilteredProducers(mockProducers);
      setStats(mockStats);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = producers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (producer) =>
          producer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((producer) => producer.subscriptionStatus === statusFilter);
    }

    setFilteredProducers(filtered);
  }, [searchTerm, statusFilter, producers]);

  if (!user || user.role !== "agent") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 p-6">
        <div className="w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Expired</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Producers Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your producers and their subscriptions
          </p>
        </div>
        <Button
          onClick={() => router.push("/agent-dashboard")}
          variant="outline"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    {stats.totalProducers}
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
                    Active Subscriptions
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {stats.activeSubscriptions}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                    Expired Subscriptions
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {stats.expiredSubscriptions}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Total Commissions
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {stats.totalCommissions.toLocaleString()} RWF
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search producers by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
                size="sm"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "expired" ? "default" : "outline"}
                onClick={() => setStatusFilter("expired")}
                size="sm"
              >
                Expired
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
              >
                Pending
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Producers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Producers ({filteredProducers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducers.map((producer) => (
                  <TableRow key={producer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {producer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {producer.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {producer.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{producer.company}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{producer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{producer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(producer.subscriptionStatus)}
                          {getStatusBadge(producer.subscriptionStatus)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Expires: {new Date(producer.subscriptionExpiry).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {producer.productsCount}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">products</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {producer.commissionEarned.toLocaleString()}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">RWF earned</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/agent/producer/${producer.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {producer.subscriptionStatus === "expired" && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/agent/subscription/renew/${producer.id}`)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Renew
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProducers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No producers found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't managed any producers yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
