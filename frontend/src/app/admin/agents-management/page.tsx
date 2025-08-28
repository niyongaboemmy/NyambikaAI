"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  UserCheck,
  DollarSign,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  totalProducers: number;
  totalCommissions: number;
  lastActive: string;
  status: "active" | "inactive";
}

export default function AgentsManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockAgents: Agent[] = [
      {
        id: "agent-1",
        name: "Jean Baptiste Uwimana",
        email: "jean.uwimana@email.com",
        phone: "+250788123456",
        createdAt: "2024-01-15",
        totalProducers: 12,
        totalCommissions: 45000,
        lastActive: "2024-01-20",
        status: "active",
      },
      {
        id: "agent-2",
        name: "Marie Claire Mukamana",
        email: "marie.mukamana@email.com",
        phone: "+250789654321",
        createdAt: "2024-02-10",
        totalProducers: 8,
        totalCommissions: 32000,
        lastActive: "2024-01-19",
        status: "active",
      },
      {
        id: "agent-3",
        name: "Patrick Nkurunziza",
        email: "patrick.nkurunziza@email.com",
        phone: "+250787456123",
        createdAt: "2024-03-05",
        totalProducers: 15,
        totalCommissions: 67500,
        lastActive: "2024-01-18",
        status: "inactive",
      },
    ];

    setTimeout(() => {
      setAgents(mockAgents);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAgents = agents.length;
  const activeAgents = agents.filter((agent) => agent.status === "active").length;
  const totalCommissions = agents.reduce((sum, agent) => sum + agent.totalCommissions, 0);
  const totalProducers = agents.reduce((sum, agent) => sum + agent.totalProducers, 0);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Agents Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage subscription agents and their commissions
          </p>
        </div>
      </div>

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
                    Total Agents
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {totalAgents}
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
                    Active Agents
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {activeAgents}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                    {totalCommissions.toLocaleString()} RWF
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
                    Managed Producers
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {totalProducers}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search agents by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Agents Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Producers</TableHead>
                  <TableHead>Commissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          <div>
                            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                            <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-40 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm ? "No agents found matching your search." : "No agents found."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {agent.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {agent.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {agent.email}
                            </span>
                          </div>
                          {agent.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">
                                {agent.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{agent.totalProducers}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {agent.totalCommissions.toLocaleString()} RWF
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={agent.status === "active" ? "default" : "secondary"}
                          className={
                            agent.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                          }
                        >
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Calendar className="h-3 w-3" />
                          {new Date(agent.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/agent/${agent.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
