"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/config/api";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Share2,
  QrCode,
  RefreshCw,
  Users,
  Brain,
  Network,
  Zap,
  TrendingUp,
  NetworkIcon,
} from "lucide-react";

// Lightweight UI primitives (reuse existing shadcn-based components if available)
import { Button } from "@/components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/custom-ui/tabs";
import { Label } from "@/components/custom-ui/label";
import { Input } from "@/components/custom-ui/input";

interface ReferralSummary {
  directCount: number;
  indirectCount: number;
  level1Earnings: number;
  level2Earnings: number;
  totalEarnings: number;
  payoutThreshold: number;
}

interface AgentRefBrief {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  parentId?: string | null;
  isVerified?: boolean;
}

interface CommissionRow {
  id: string;
  amount: string | number;
  level: 1 | 2;
  status: string;
  createdAt: string;
  sourceAgentId: string;
}

export default function AgentReferralsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [direct, setDirect] = useState<AgentRefBrief[]>([]);
  const [indirect, setIndirect] = useState<AgentRefBrief[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [networkView, setNetworkView] = useState<"all" | "l1" | "l2">("all");

  // Require agent role
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login?next=/agent/referrals");
      } else if ((user.role || "").toLowerCase() !== "agent") {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  const referralCode =
    (user as any)?.referralCode || (user as any)?.referral_code || "";
  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = window.location.origin;
    return referralCode
      ? `${base}/register?ref=${encodeURIComponent(referralCode)}&role=agent`
      : `${base}/register`;
  }, [referralCode]);

  const qrUrl = useMemo(() => {
    // Use a lightweight QR image API (no dependency)
    const data = inviteUrl || "";
    // api.qrserver.com creates PNG; increased size to 280x280 for better scan clarity
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
      data
    )}`;
  }, [inviteUrl]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [s, n, c] = await Promise.all([
        apiClient.get<ReferralSummary>("/api/agent/referrals/summary"),
        apiClient.get<{ direct: AgentRefBrief[]; indirect: AgentRefBrief[] }>(
          "/api/agent/referrals/network"
        ),
        apiClient.get<CommissionRow[]>("/api/agent/referrals/commissions"),
      ]);
      setSummary(s.data);
      setDirect(n.data.direct || []);
      setIndirect(n.data.indirect || []);
      setCommissions(c.data || []);
    } catch (e) {
      console.error("Failed to load referral data", e);
    } finally {
      setLoadingData(false);
    }
  };

  const getInitials = (fullName?: string | null, email?: string | null) => {
    const source = (fullName || email || "").trim();
    if (!source) return "?";
    const parts = source
      .replace(/[^a-zA-Z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1200);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (user && (user.role || "").toLowerCase() === "agent") {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredDirect = useMemo(() => {
    if (!search) return direct;
    const q = search.toLowerCase();
    return direct.filter(
      (d) =>
        (d.email || "").toLowerCase().includes(q) ||
        (d.fullName || "").toLowerCase().includes(q)
    );
  }, [search, direct]);

  const filteredIndirect = useMemo(() => {
    if (!search) return indirect;
    const q = search.toLowerCase();
    return indirect.filter(
      (d) =>
        (d.email || "").toLowerCase().includes(q) ||
        (d.fullName || "").toLowerCase().includes(q)
    );
  }, [search, indirect]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // ignore
    }
  };

  const handleShare = async () => {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: "Join Nyambika as an Agent",
          text: "Sign up with my referral link to become an Agent on Nyambika!",
          url: inviteUrl,
        });
      } else {
        await handleCopy();
        alert("Link copied to clipboard. Share it anywhere!");
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen pt-6">
      {/* Compact AI Header */}
      <div className="relative overflow-hidden px-2 md:px-0 pt-6">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 100">
            <circle
              cx="50"
              cy="30"
              r="1"
              fill="currentColor"
              className="animate-pulse"
            />
            <circle
              cx="150"
              cy="20"
              r="1.5"
              fill="currentColor"
              className="animate-pulse delay-300"
            />
            <circle
              cx="250"
              cy="40"
              r="1"
              fill="currentColor"
              className="animate-pulse delay-700"
            />
            <path
              d="M50 30 L150 20 M150 20 L250 40"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.5"
            />
          </svg>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center border border-border/30">
                <NetworkIcon className="h-5 w-5 text-foreground" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Referral Hub
              </h1>
              <p className="text-xs text-muted-foreground">
                Referral network management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loadingData}
              className="h-8 px-3 text-xs border-border/50"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1.5 ${
                  loadingData ? "animate-spin" : ""
                }`}
              />
              Sync
            </Button>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-foreground/5 border border-border/30">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 md:px-0">
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-">
          <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:from-blue-500/15 hover:to-indigo-500/15 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-muted-foreground">
                L1 Nodes
              </span>
            </div>
            <div className="text-xl font-semibold text-blue-700 dark:text-blue-400">
              {summary?.directCount ?? 0}
            </div>
          </div>

          <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:from-purple-500/15 hover:to-blue-500/15 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-muted-foreground">
                L2 Nodes
              </span>
            </div>
            <div className="text-xl font-semibold text-purple-700 dark:text-purple-400">
              {summary?.indirectCount ?? 0}
            </div>
          </div>

          <div className="group p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/15 hover:to-emerald-500/15 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Yield
              </span>
            </div>
            <div className="text-xl font-semibold text-green-700 dark:text-green-400">
              {summary ? `${summary.totalEarnings.toLocaleString()}` : "0"}
              <span className="text-xs text-muted-foreground ml-1">RWF</span>
            </div>
          </div>

          <div className="group p-4 rounded-xl bg-gradient-to-br from-foreground/5 to-foreground/10 border border-border/30 hover:from-foreground/10 hover:to-foreground/15 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Neural ID
              </span>
            </div>
            <div className="font-mono text-sm font-semibold text-foreground">
              {referralCode || "PENDING"}
            </div>
          </div>
        </div>

        {/* Neural Link & Referral Code - Professional Layout */}
        <Card className="mb-4 mt-4 border border-border/50 bg-gradient-to-br from-background to-muted/5 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-foreground" />
              Share Your Referral Link
              {!referralCode && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-normal">
                  (Pending Activation)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Left: Link and Code */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Referral Link
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      readOnly
                      value={inviteUrl}
                      className="flex-1 font-mono text-sm bg-muted/20 border-border/30"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="px-3"
                        aria-label="Copy Referral Link"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={handleShare}
                        size="sm"
                        className="px-3"
                        aria-label="Share Referral Link"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Referral Code
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      readOnly
                      value={referralCode || "PENDING"}
                      className="flex-1 font-mono text-sm bg-muted/20 border-border/30"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyCode}
                        variant="outline"
                        size="sm"
                        className="px-3"
                        aria-label="Copy Referral Code"
                      >
                        {copiedCode ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: QR Card */}
              <div className="md:col-span-1">
                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30">
                  <div className="shrink-0 flex flex-col items-center sm:items-start">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Scan to Join</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background border border-border/30">
                      <img
                        src={qrUrl}
                        alt="Referral QR Code"
                        className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed hidden sm:block">
                    Share your link by showing this QR. Your code is
                    <span className="mx-1 px-1.5 py-0.5 rounded bg-foreground/5 border border-border/30 font-mono text-[11px] text-foreground inline-block">
                      {referralCode || "PENDING"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-gradient-to-r from-foreground/5 to-foreground/10 border border-border/30 rounded-2xl backdrop-blur-sm">
            <TabsTrigger
              value="network"
              className="relative text-sm font-medium data-[state=active]:bg-gradient-to-br data-[state=active]:from-background data-[state=active]:to-muted/20 data-[state=active]:border data-[state=active]:border-border/30 rounded-xl transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span>Neural Network</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="commissions"
              className="relative text-sm font-medium data-[state=active]:bg-gradient-to-br data-[state=active]:from-background data-[state=active]:to-muted/20 data-[state=active]:border data-[state=active]:border-border/30 rounded-xl transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Yield History</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-4 mb-6">
            <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-background via-background to-muted/10 rounded-2xl backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-border/30">
                      <Network className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-500/40 to-blue-500/40 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <span className="text-foreground">Network Topology</span>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      Agent Hierarchy Visualization
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Local tabs to filter within topology */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Filter view
                  </div>
                  <Tabs
                    value={networkView}
                    onValueChange={(v) => setNetworkView(v as any)}
                  >
                    <TabsList className="h-9 p-1 bg-foreground/5 border border-border/30 rounded-xl">
                      <TabsTrigger
                        value="all"
                        className="text-xs px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-border/30"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger
                        value="l1"
                        className="text-xs px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-border/30"
                      >
                        Level 1
                      </TabsTrigger>
                      <TabsTrigger
                        value="l2"
                        className="text-xs px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-border/30"
                      >
                        Level 2
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search neural network nodes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gradient-to-r from-muted/20 to-muted/10 border border-border/30 focus:border-border/60 transition-all duration-300 pl-4"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Tree Structure View */}
                <div className="space-y-6">
                  {/* Tree Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">Network Tree</h4>
                        <p className="text-xs text-muted-foreground">
                          Your referral hierarchy
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span>You</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/60 rounded-full"></div>
                        <span>Agents</span>
                      </div>
                    </div>
                  </div>

                  {/* Tree Container */}
                  <div className="relative overflow-x-auto">
                    {filteredDirect.length === 0 &&
                    filteredIndirect.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/40 flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground animate-pulse" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Your network tree is empty
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Start inviting agents to grow your network
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 min-w-[560px] md:min-w-0">
                        {/* Root Node (You) */}
                        <div className="flex items-center justify-center">
                          <div className="relative group">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-primary/30">
                              <Users className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              You
                            </div>
                          </div>
                        </div>

                        {/* Connection Lines and Direct Agents */}
                        {filteredDirect.length > 0 && (
                          <div className="relative">
                            {/* Vertical line from root */}
                            <div className="absolute left-1/2 top-0 w-0.5 h-6 bg-gradient-to-b from-primary/40 to-muted-foreground/20 transform -translate-x-0.5"></div>

                            {/* Horizontal line */}
                            {filteredDirect.length > 1 && (
                              <div
                                className="absolute left-1/2 top-6 h-0.5 bg-gradient-to-r from-muted-foreground/20 via-primary/40 to-muted-foreground/20 transform -translate-x-1/2"
                                style={{
                                  width: `${Math.min(
                                    filteredDirect.length * 120,
                                    600
                                  )}px`,
                                }}
                              ></div>
                            )}

                            {/* Direct agents */}
                            <div className="flex items-start justify-center gap-4 md:gap-8 flex-wrap">
                              {filteredDirect.map((agent, index) => (
                                <div
                                  key={agent.id}
                                  className="relative group animate-in slide-in-from-bottom-2 duration-300"
                                  style={{ animationDelay: `${index * 100}ms` }}
                                >
                                  {/* Connection line */}
                                  {index === 0 && (
                                    <div className="absolute left-1/2 -top-2 w-0.5 h-2 bg-gradient-to-b from-muted-foreground/10 to-transparent transform -translate-x-0.5"></div>
                                  )}

                                  <div className="flex items-center space-x-2">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center hover:scale-110 transition-all duration-300">
                                      <span className="text-xs font-semibold text-primary/80">
                                        {getInitials(
                                          agent.fullName,
                                          agent.email
                                        )}
                                      </span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 hover:from-muted/40 hover:to-muted/20 transition-all duration-300 min-w-[140px]">
                                      <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                        {agent.fullName || "Unnamed"}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 truncate">
                                        {agent.email || "No email"}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {new Date(
                                          agent.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="mt-1">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                            agent.isVerified
                                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                          }`}
                                        >
                                          {agent.isVerified
                                            ? "Verified"
                                            : "Pending"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Show indirect agents under this direct agent */}
                                  {networkView !== "l1" &&
                                    filteredIndirect.filter(
                                      (indirect) =>
                                        indirect.parentId === agent.id
                                    ).length > 0 && (
                                      <div className="relative mt-4">
                                        {/* Vertical line down */}
                                        <div className="absolute left-1/2 -top-4 w-0.5 h-4 bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/10 transform -translate-x-0.5"></div>

                                        {/* Indirect agents */}
                                        <div className="flex flex-col items-center space-y-2">
                                          {filteredIndirect
                                            .filter(
                                              (indirect) =>
                                                indirect.parentId === agent.id
                                            )
                                            .map(
                                              (
                                                indirectAgent,
                                                indirectIndex
                                              ) => (
                                                <div
                                                  key={indirectAgent.id}
                                                  className="relative group/indirect animate-in slide-in-from-bottom-2 duration-300"
                                                  style={{
                                                    animationDelay: `${
                                                      index * 100 +
                                                      indirectIndex * 50 +
                                                      200
                                                    }ms`,
                                                  }}
                                                >
                                                  {/* Connection line */}
                                                  {indirectIndex === 0 && (
                                                    <div className="absolute left-1/2 -top-2 w-0.5 h-2 bg-gradient-to-b from-muted-foreground/10 to-transparent transform -translate-x-0.5"></div>
                                                  )}

                                                  <div className="flex items-center space-x-2">
                                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center hover:scale-110 transition-all duration-300 border border-border/30">
                                                      <span className="text-[10px] font-semibold text-foreground/80">
                                                        {getInitials(
                                                          indirectAgent.fullName,
                                                          indirectAgent.email
                                                        )}
                                                      </span>
                                                    </div>
                                                    <div className="p-2 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 hover:from-muted/30 hover:to-muted/10 transition-all duration-300 min-w-[120px]">
                                                      <div className="text-xs font-medium text-foreground truncate">
                                                        {indirectAgent.fullName ||
                                                          "Unnamed"}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground truncate">
                                                        {indirectAgent.email ||
                                                          "No email"}
                                                      </div>
                                                      <div className="mt-1">
                                                        <span
                                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                            indirectAgent.isVerified
                                                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                          }`}
                                                        >
                                                          {indirectAgent.isVerified
                                                            ? "Verified"
                                                            : "Pending"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>

                            {/* Level 2 Flat View */}
                            {networkView === "l2" &&
                              filteredIndirect.length > 0 && (
                                <div className="relative pt-8">
                                  {/* Vertical line from root */}
                                  <div className="absolute left-1/2 top-0 w-0.5 h-6 bg-gradient-to-b from-primary/40 to-muted-foreground/20 transform -translate-x-0.5"></div>
                                  {/* Grid of L2 agents */}
                                  <div className="flex items-start justify-center gap-6 flex-wrap">
                                    {filteredIndirect.map(
                                      (indirectAgent, idx) => (
                                        <div
                                          key={indirectAgent.id}
                                          className="relative group/indirect animate-in slide-in-from-bottom-2 duration-300"
                                          style={{
                                            animationDelay: `${idx * 60}ms`,
                                          }}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center hover:scale-110 transition-all duration-300 border border-border/30">
                                              <span className="text-[10px] font-semibold text-foreground/80">
                                                {getInitials(
                                                  indirectAgent.fullName,
                                                  indirectAgent.email
                                                )}
                                              </span>
                                            </div>
                                            <div className="p-2 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 hover:from-muted/30 hover:to-muted/10 transition-all duration-300 min-w-[140px]">
                                              <div className="text-xs font-medium text-foreground truncate">
                                                {indirectAgent.fullName ||
                                                  "Unnamed"}
                                              </div>
                                              <div className="text-xs text-muted-foreground truncate">
                                                {indirectAgent.email ||
                                                  "No email"}
                                              </div>
                                              <div className="mt-1">
                                                <span
                                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                    indirectAgent.isVerified
                                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                  }`}
                                                >
                                                  {indirectAgent.isVerified
                                                    ? "Verified"
                                                    : "Pending"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="commissions" className="mt-8">
            <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-background via-background to-muted/10 rounded-2xl backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-border/30">
                      <TrendingUp className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-500/40 to-purple-500/40 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <span className="text-foreground">Yield Analytics</span>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      Commission Performance Data
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto rounded-xl border border-border/30">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-foreground/5 to-foreground/10">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-foreground/60 rounded-full"></div>
                            Timestamp
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <Network className="w-3 h-3" />
                            Level
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            Yield
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Status
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-sm text-foreground hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Brain className="w-3 h-3" />
                            Node ID
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-background/50">
                      {commissions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center border border-border/30">
                                <TrendingUp className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground mb-1">
                                  No yield data available
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Start building your neural network to generate
                                  commissions
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {commissions.map((row, index) => (
                        <tr
                          key={row.id}
                          className="border-b border-border/20 hover:bg-foreground/[0.02] transition-all duration-200 group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="p-4 text-sm font-medium text-foreground">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-foreground/10 to-foreground/5 border border-border/30">
                              <div className="w-1.5 h-1.5 bg-foreground/60 rounded-full"></div>
                              L{row.level}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-sm text-foreground">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                              {Number(row.amount).toLocaleString()} RWF
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium capitalize ${
                                row.status === "completed"
                                  ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
                                  : row.status === "pending"
                                  ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                  : "bg-gradient-to-r from-foreground/5 to-foreground/10 border border-border/30 text-muted-foreground"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  row.status === "completed"
                                    ? "bg-green-500 animate-pulse"
                                    : row.status === "pending"
                                    ? "bg-yellow-500 animate-pulse"
                                    : "bg-muted-foreground"
                                }`}
                              ></div>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-mono text-muted-foreground hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                              {row.sourceAgentId || "SYSTEM"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
