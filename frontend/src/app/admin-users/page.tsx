"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { apiClient, API_ENDPOINTS, handleApiError } from "@/config/api";
import SubscriptionPlanSelector from "@/components/SubscriptionPlanSelector";
import { useAuth } from "@/contexts/AuthContext";

type Role = "producer" | "agent" | "customer" | "admin";

interface AdminUserItem {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  role: "customer" | "producer" | "admin" | "agent";
  phone?: string | null;
  isVerified?: boolean | null;
  createdAt?: string;
}

interface ProducerCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: string;
}

function formatDate(d?: string) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | Role>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminUserItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // status filter (Verified/Pending/All)
  const [statusFilter, setStatusFilter] = useState<
    "all" | "verified" | "pending"
  >("pending");

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [producers, setProducers] = useState<AdminUserItem[]>([]);
  const [agents, setAgents] = useState<AdminUserItem[]>([]);
  const [customers, setCustomers] = useState<AdminUserItem[]>([]);
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);

  // Create user form state
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Role>("customer");
  const [formPhone, setFormPhone] = useState("");

  // Company details for selected producer
  const [company, setCompany] = useState<ProducerCompany | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Admin subscription activation state (for producers)
  const [activationPlanId, setActivationPlanId] = useState<string>("");
  const [activationBilling, setActivationBilling] = useState<
    "monthly" | "annual"
  >("monthly");
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationMessage, setActivationMessage] = useState<string | null>(
    null
  );

  // Current subscription (for selected producer)
  interface AdminProducerSubscription {
    subscription: {
      id: string;
      status: "active" | "expired" | "pending" | string;
      startDate?: string;
      endDate?: string;
      billingCycle?: "monthly" | "annual" | string;
    };
    plan: {
      id: string;
      name: string;
    } | null;
  }
  const [subInfo, setSubInfo] = useState<AdminProducerSubscription | null>(
    null
  );
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Enforce admin role on the page level (ProtectedRoute ensures auth only)
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [prodRes, agentRes, custRes, admRes] = await Promise.all([
          apiClient.get<AdminUserItem[]>(API_ENDPOINTS.ADMIN_PRODUCERS),
          apiClient.get<AdminUserItem[]>(API_ENDPOINTS.ADMIN_AGENTS),
          apiClient.get<AdminUserItem[]>(API_ENDPOINTS.ADMIN_CUSTOMERS),
          apiClient.get<AdminUserItem[]>(API_ENDPOINTS.ADMIN_ADMINS),
        ]);
        if (!isMounted) return;
        setProducers(prodRes.data || []);
        setAgents(agentRes.data || []);
        setCustomers(custRes.data || []);
        setAdmins(admRes.data || []);
      } catch (e) {
        if (!isMounted) return;
        setError(handleApiError(e));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch producer company when modal opens for a producer
  useEffect(() => {
    let ignore = false;
    const loadCompany = async (producerId: string) => {
      setCompanyLoading(true);
      setCompanyError(null);
      try {
        const res = await apiClient.get<ProducerCompany>(
          API_ENDPOINTS.ADMIN_PRODUCER_COMPANY(producerId)
        );
        if (!ignore) setCompany(res.data);
      } catch (e) {
        if (!ignore) setCompanyError(handleApiError(e));
      } finally {
        if (!ignore) setCompanyLoading(false);
      }
    };
    if (isModalOpen && selected?.role === "producer") {
      loadCompany(selected.id);
    }
    return () => {
      ignore = true;
    };
  }, [isModalOpen, selected]);

  // Fetch current subscription for producer when modal opens
  useEffect(() => {
    let ignore = false;
    const loadSub = async (producerId: string) => {
      setSubLoading(true);
      setSubError(null);
      try {
        const res = await apiClient.get<AdminProducerSubscription>(
          API_ENDPOINTS.ADMIN_PRODUCER_SUBSCRIPTION(producerId)
        );
        if (!ignore) setSubInfo(res.data);
      } catch (e) {
        // It's okay if none exists; show a subtle message only if it's a true error
        if (!ignore) setSubError(null);
      } finally {
        if (!ignore) setSubLoading(false);
      }
    };
    if (isModalOpen && selected?.role === "producer") {
      loadSub(selected.id);
    }
    return () => {
      ignore = true;
    };
  }, [isModalOpen, selected]);

  const listAll = useMemo(
    () => [...producers, ...agents, ...customers, ...admins],
    [producers, agents, customers, admins]
  );

  // Stats for summary boxes
  const stats = useMemo(() => {
    const counts = {
      total: listAll.length,
      producers: producers.length,
      agents: agents.length,
      customers: customers.length,
      admins: admins.length,
      pendingVerifications:
        producers.filter((p) => !p.isVerified).length +
        agents.filter((a) => !a.isVerified).length,
      verified:
        producers.filter((p) => p.isVerified).length +
        agents.filter((a) => a.isVerified).length,
    };
    return counts;
  }, [listAll.length, producers, agents, customers.length, admins.length]);

  const rows = useMemo(() => {
    const base =
      activeTab === "producer"
        ? producers
        : activeTab === "agent"
        ? agents
        : activeTab === "customer"
        ? customers
        : activeTab === "admin"
        ? admins
        : listAll;
    const q = search.trim().toLowerCase();
    // First filter by status if applicable
    const byStatus = base.filter((u) => {
      if (statusFilter === "all") return true;
      // apply only to roles that have verification
      if (u.role === "producer" || u.role === "agent") {
        const verified = Boolean(u.isVerified);
        return statusFilter === "verified" ? verified : !verified;
      }
      // For roles without verification, include only when 'all'
      return false;
    });

    if (!q) return byStatus;
    return byStatus.filter((u) => {
      const name = (u.fullName || u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [
    activeTab,
    producers,
    agents,
    customers,
    admins,
    listAll,
    search,
    statusFilter,
  ]);

  // reset pagination on tab/search change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const openDetails = (u: AdminUserItem) => {
    setSelected(u);
    setIsModalOpen(true);
  };

  const closeDetails = () => {
    setIsModalOpen(false);
    setSelected(null);
    setCompany(null);
    setCompanyError(null);
    setActivationPlanId("");
    setActivationBilling("monthly");
    setActivationLoading(false);
    setActivationMessage(null);
    setSubInfo(null);
    setSubError(null);
    setSubLoading(false);
  };

  const verifySelected = async () => {
    if (!selected) return;
    if (!(selected.role === "producer" || selected.role === "agent")) return;
    setIsVerifying(true);
    setError(null);
    try {
      if (selected.role === "producer") {
        await apiClient.post(API_ENDPOINTS.ADMIN_VERIFY_PRODUCER(selected.id));
        // update local state
        setProducers((prev) =>
          prev.map((p) =>
            p.id === selected.id ? { ...p, isVerified: true } : p
          )
        );
      } else if (selected.role === "agent") {
        await apiClient.post(API_ENDPOINTS.ADMIN_VERIFY_AGENT(selected.id));
        setAgents((prev) =>
          prev.map((a) =>
            a.id === selected.id ? { ...a, isVerified: true } : a
          )
        );
      }
      // reflect in selected
      setSelected((prev) => (prev ? { ...prev, isVerified: true } : prev));
    } catch (e) {
      setError(handleApiError(e));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-4 pt-10">
        <div className="">
          <div className="mb-3 rounded-2xl bg-gradient-to-r from-indigo-600/10 via-fuchsia-500/10 to-cyan-500/10 dark:from-indigo-400/10 dark:via-fuchsia-400/10 dark:to-cyan-400/10 p-5 border dark:border-none border-gray-200/60 dark:border-gray-700/60">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Admin • Users
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Manage producers, agents, customers, and admins. Search, filter,
              verify, and review accounts.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <div className="relative overflow-hidden rounded-2xl border dark:border-none border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-4">
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20" />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Users
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border dark:border-none border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-4">
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20" />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Verified (Producers & Agents)
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.verified}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border dark:border-none border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-4">
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20" />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Pending Verifications
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.pendingVerifications}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border dark:border-none border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-4">
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20" />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Producers • Agents
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.producers} • {stats.agents}
              </div>
            </div>
          </div>

          {!isAdmin ? (
            <div className="rounded-xl border dark:border-none border-red-200/40 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-200">
              You need admin permissions to view this page.
            </div>
          ) : (
            <>
              {/* Controls: tabs + search + filters */}
              <div className="mb-6 space-y-3">
                {/* Role tabs - horizontal scroll on small screens */}
                <div className="overflow-x-auto pb-1">
                  <div className="inline-flex whitespace-nowrap gap-1 px-0 rounded-full border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 overflow-hidden shadow-sm">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === "all"
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTab("producer")}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === "producer"
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
                      }`}
                    >
                      Producers
                    </button>
                    <button
                      onClick={() => setActiveTab("agent")}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === "agent"
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
                      }`}
                    >
                      Agents
                    </button>
                    <button
                      onClick={() => setActiveTab("customer")}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === "customer"
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
                      }`}
                    >
                      Customers
                    </button>
                    <button
                      onClick={() => setActiveTab("admin")}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        activeTab === "admin"
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
                      }`}
                    >
                      Admins
                    </button>
                  </div>
                </div>

                {/* Search + filters row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="relative w-full sm:flex-1 md:w-80">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      aria-label="Search users"
                      className="w-full rounded-lg border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex w-full sm:w-auto items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      <label
                        className="text-xs text-gray-600 dark:text-gray-300"
                        htmlFor="status-filter"
                      >
                        Status:
                      </label>
                      <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full sm:w-auto rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      <label
                        className="text-xs text-gray-600 dark:text-gray-300"
                        htmlFor="rows-select"
                      >
                        Rows:
                      </label>
                      <select
                        id="rows-select"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="w-full sm:w-auto rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-2 py-1 text-sm"
                      >
                        {[10, 20, 50].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create User (Admin only) */}
              <div className="mb-6 rounded-2xl border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Create New User
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Admins can create users with any role.
                    </p>
                  </div>
                  <button
                    onClick={() => setFormOpen((v) => !v)}
                    className="text-sm px-3 py-1.5 rounded-md border dark:border-none border-gray-200 dark:border-gray-700"
                  >
                    {formOpen ? "Hide" : "Open"}
                  </button>
                </div>
                {formOpen && (
                  <form
                    className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setError(null);
                      setCreating(true);
                      try {
                        const payload = {
                          email: formEmail.trim(),
                          password: formPassword,
                          name: formName.trim(),
                          role: formRole,
                          phone: formPhone.trim() || undefined,
                        };
                        const res = await apiClient.post<AdminUserItem>(
                          API_ENDPOINTS.ADMIN_CREATE_USER,
                          payload
                        );
                        const created = res.data;
                        // Append to corresponding list
                        if (created.role === "producer")
                          setProducers((prev) => [created, ...prev]);
                        else if (created.role === "agent")
                          setAgents((prev) => [created, ...prev]);
                        else if (created.role === "customer")
                          setCustomers((prev) => [created, ...prev]);
                        else if (created.role === "admin")
                          setAdmins((prev) => [created, ...prev]);

                        // Reset form
                        setFormName("");
                        setFormEmail("");
                        setFormPassword("");
                        setFormRole("customer");
                        setFormPhone("");
                        setFormOpen(false);
                      } catch (e) {
                        setError(handleApiError(e));
                      } finally {
                        setCreating(false);
                      }
                    }}
                  >
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      placeholder="Full name"
                      className="w-full rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-2 text-sm"
                    />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="w-full rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-2 text-sm"
                    />
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Password"
                      className="w-full rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-2 text-sm"
                    />
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as Role)}
                      className="w-full rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-2 text-sm"
                    >
                      <option value="customer">Customer</option>
                      <option value="producer">Producer</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="flex gap-3 md:col-span-5">
                      <input
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="flex-1 rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={creating}
                        className="px-4 py-2 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-60"
                      >
                        {creating ? "Creating..." : "Create User"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {error && (
                <div className="mb-4 rounded-lg border dark:border-none border-red-200/50 dark:border-red-800/40 bg-red-50/60 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-200">
                  {error}
                </div>
              )}

              {/* Data view: mobile cards */}
              <div className="md:hidden space-y-3">
                {isLoading ? (
                  <div className="rounded-xl border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-4 text-center text-gray-500">
                    Loading…
                  </div>
                ) : rows.length === 0 ? (
                  <div className="rounded-xl border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-4 text-center text-gray-500">
                    No users found.
                  </div>
                ) : (
                  paginatedRows.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-xl border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/70 to-fuchsia-500/70 text-white flex items-center justify-center text-sm font-semibold">
                            {(u.fullName || u.username || u.email || "?")
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {u.fullName || u.username || "—"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.role === "producer"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : u.role === "agent"
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
                              : u.role === "customer"
                              ? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="text-gray-600 dark:text-gray-300">
                          {formatDate(u.createdAt)}
                        </div>
                        <div>
                          {u.role === "producer" || u.role === "agent" ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                u.isVerified
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                              }`}
                            >
                              {u.isVerified ? "✅ Verified" : "🕒 Pending"}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              —
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => openDetails(u)}
                          className="w-full rounded-md border dark:border-none border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Data view: table for md+ */}
              <div className="hidden md:block rounded-xl border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50/70 dark:bg-gray-900/40 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Verified
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-gray-500 dark:text-gray-300"
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-gray-500 dark:text-gray-300"
                          >
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((u) => (
                          <tr
                            key={u.id}
                            className="hover:bg-gray-50/60 dark:hover:bg-gray-900/30"
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/70 to-fuchsia-500/70 dark:from-indigo-400/60 dark:to-fuchsia-400/60 text-white flex items-center justify-center text-xs font-medium">
                                  {(u.fullName || u.username || u.email || "?")
                                    .split(" ")
                                    .map((p) => p[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div className="leading-tight">
                                  <div className="font-medium">
                                    {u.fullName || u.username || "—"}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium 
                                ${
                                  u.role === "producer"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                                    : u.role === "agent"
                                    ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
                                    : u.role === "customer"
                                    ? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                              {formatDate(u.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="truncate">
                                {u.role === "producer" || u.role === "agent" ? (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      u.isVerified
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                                    }`}
                                  >
                                    {u.isVerified
                                      ? "✅ Verified"
                                      : "🕒 Pending"}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    —
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <button
                                className="rounded-md border dark:border-none border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 px-3 py-1.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/60"
                                onClick={() => openDetails(u)}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination controls */}
              {rows.length > 0 && (
                <div className="mt-3 flex items-center justify-between text-sm text-gray-700 dark:text-gray-200">
                  <div>
                    Showing {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, rows.length)} of {rows.length}
                  </div>
                  <div className="inline-flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-md border dark:border-none border-gray-200 dark:border-gray-700 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="px-2 py-1.5">
                      Page {page} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="px-3 py-1.5 rounded-md border dark:border-none border-gray-200 dark:border-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Tip: "All" currently aggregates Producers and Agents. Extend the
                backend to list Customers if needed.
              </p>

              {/* Details Modal */}
              {isModalOpen && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
                  <div className="w-full max-w-full sm:max-w-2xl lg:max-w-4xl rounded-2xl border dark:border-none border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 sm:p-6 shadow-2xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          User Details
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {selected.role.toUpperCase()}
                        </p>
                      </div>
                      <button
                        onClick={closeDetails}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-3 text-sm text-gray-800 dark:text-gray-100 max-h-[75vh] overflow-y-auto pr-1">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Name:
                          </span>{" "}
                          {selected.fullName || selected.username || "—"}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Email:
                          </span>{" "}
                          {selected.email}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Phone:
                          </span>{" "}
                          {selected.phone || "—"}
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Created:
                          </span>{" "}
                          {formatDate(selected.createdAt)}
                        </div>
                        {(selected.role === "producer" ||
                          selected.role === "agent") && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Verification:
                            </span>{" "}
                            {selected.isVerified ? (
                              <span className="text-emerald-600 dark:text-emerald-300">
                                Verified
                              </span>
                            ) : (
                              <span className="text-yellow-700 dark:text-yellow-300">
                                Pending
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {selected.role === "producer" && (
                        <div className="mt-3 rounded-lg border dark:border-none border-gray-200 dark:border-gray-700 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold">Company</h4>
                            {companyLoading && (
                              <span className="text-xs text-gray-500">
                                Loading…
                              </span>
                            )}
                          </div>
                          {companyError && (
                            <div className="text-xs text-red-600 dark:text-red-300 mb-2">
                              {companyError}
                            </div>
                          )}
                          {company ? (
                            <div className="flex items-start gap-3">
                              {company.logoUrl ? (
                                <img
                                  src={company.logoUrl}
                                  alt="Company logo"
                                  className="h-12 w-12 rounded-md object-cover border dark:border-none border-gray-200 dark:border-gray-700"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                                  Logo
                                </div>
                              )}
                              <div className="text-sm">
                                <div className="font-medium">
                                  {company.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                  {company.email} • {company.phone}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                  {company.location}
                                </div>
                                {company.websiteUrl && (
                                  <a
                                    href={company.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-indigo-600 dark:text-indigo-300 underline"
                                  >
                                    Website
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : !companyLoading && !companyError ? (
                            <div className="text-xs text-gray-500">
                              No company details found.
                            </div>
                          ) : null}
                        </div>
                      )}
                      {selected.role === "producer" && (
                        <div className="mt-3 rounded-lg border dark:border-none border-gray-200 dark:border-gray-700 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold">
                              Subscription
                            </h4>
                            {subLoading && (
                              <span className="text-xs text-gray-500">
                                Loading…
                              </span>
                            )}
                          </div>
                          {subInfo ? (
                            <div className="text-sm">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-gray-600 dark:text-gray-300">
                                  Status:
                                </span>
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  {subInfo.subscription.status}
                                </span>
                              </div>
                              <div className="mt-1 text-gray-600 dark:text-gray-300">
                                Plan:{" "}
                                <span className="font-medium">
                                  {subInfo.plan?.name || "—"}
                                </span>
                              </div>
                              <div className="mt-1 text-gray-600 dark:text-gray-300">
                                Billing:{" "}
                                {subInfo.subscription.billingCycle || "—"}
                              </div>
                              <div className="mt-1 text-gray-600 dark:text-gray-300">
                                Ends:{" "}
                                {subInfo.subscription.endDate
                                  ? new Date(
                                      subInfo.subscription.endDate
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                          ) : !subLoading && !subError ? (
                            <div className="text-xs text-gray-500">
                              No subscription found.
                            </div>
                          ) : null}
                        </div>
                      )}
                      {selected.role === "producer" && (
                        <div className="mt-4 pt-3 border-t dark:border-gray-700 text-sm">
                          <h5 className="font-medium mb-2">
                            Activate Subscription
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Select a plan and billing cycle, then activate. No
                            payment or wallet balance is required.
                          </p>
                          <div className="flex items-center gap-3 mb-3">
                            <label className="text-xs text-gray-600 dark:text-gray-300">
                              Billing cycle:
                            </label>
                            <div className="inline-flex rounded-md overflow-hidden border dark:border-gray-700">
                              <button
                                type="button"
                                onClick={() => setActivationBilling("monthly")}
                                className={`px-3 py-1 text-xs ${
                                  activationBilling === "monthly"
                                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                    : "bg-transparent"
                                }`}
                              >
                                Monthly
                              </button>
                              <button
                                type="button"
                                onClick={() => setActivationBilling("annual")}
                                className={`px-3 py-1 text-xs ${
                                  activationBilling === "annual"
                                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                    : "bg-transparent"
                                }`}
                              >
                                Annual
                              </button>
                            </div>
                          </div>
                          <div className="mb-3">
                            <SubscriptionPlanSelector
                              onPlanSelect={(planId, cycle) => {
                                setActivationPlanId(planId);
                                if (cycle && cycle !== activationBilling)
                                  setActivationBilling(cycle);
                              }}
                              selectedPlanId={activationPlanId}
                              selectedBillingCycle={activationBilling}
                              className="max-h-80"
                            />
                          </div>
                          {activationMessage && (
                            <div className="mb-2 text-xs text-emerald-600 dark:text-emerald-300">
                              {activationMessage}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              disabled={!activationPlanId || activationLoading}
                              onClick={async () => {
                                if (!selected) return;
                                setActivationLoading(true);
                                setActivationMessage(null);
                                try {
                                  await apiClient.post(
                                    API_ENDPOINTS.ADMIN_ACTIVATE_SUBSCRIPTION(
                                      selected.id
                                    ),
                                    {
                                      planId: activationPlanId,
                                      billingCycle: activationBilling,
                                    }
                                  );
                                  // Refresh lists and close modal
                                  try {
                                    const [prodRes, agentRes, custRes, admRes] =
                                      await Promise.all([
                                        apiClient.get<AdminUserItem[]>(
                                          API_ENDPOINTS.ADMIN_PRODUCERS
                                        ),
                                        apiClient.get<AdminUserItem[]>(
                                          API_ENDPOINTS.ADMIN_AGENTS
                                        ),
                                        apiClient.get<AdminUserItem[]>(
                                          API_ENDPOINTS.ADMIN_CUSTOMERS
                                        ),
                                        apiClient.get<AdminUserItem[]>(
                                          API_ENDPOINTS.ADMIN_ADMINS
                                        ),
                                      ]);
                                    setProducers(prodRes.data || []);
                                    setAgents(agentRes.data || []);
                                    setCustomers(custRes.data || []);
                                    setAdmins(admRes.data || []);
                                  } catch (_) {}
                                  closeDetails();
                                } catch (e) {
                                  setActivationMessage(handleApiError(e));
                                } finally {
                                  setActivationLoading(false);
                                }
                              }}
                              className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 disabled:opacity-60"
                            >
                              {activationLoading
                                ? "Activating…"
                                : activationPlanId
                                ? "Activate"
                                : "Select a plan"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    {!selected.isVerified &&
                      (selected.role === "producer" ||
                        selected.role === "agent") && (
                        <button
                          disabled={isVerifying}
                          onClick={verifySelected}
                          className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 disabled:opacity-60"
                        >
                          {isVerifying ? "Verifying..." : "Verify"}
                        </button>
                      )}
                    <button
                      onClick={closeDetails}
                      className="rounded-md border dark:border-none border-gray-200 dark:border-gray-700 px-3 py-1.5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminUsersPage;
