"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { apiClient, API_ENDPOINTS } from "@/config/api";

interface AgentPaymentItem {
  id: string;
  amount: string;
  agentCommission: string;
  status: string;
  paymentMethod: string;
  paymentReference?: string | null;
  createdAt?: string;
  agentPayoutStatus?: string;
  agentPayoutDate?: string | null;
  agentPayoutReference?: string | null;
  agentPayoutNotes?: string | null;
  producerName?: string | null;
  planName?: string | null;
}

export default function AdminAgentPaymentsPage() {
  const params = useParams<{ agentId: string }>();
  const agentId = params?.agentId as string;
  const search = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<AgentPaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState<string>(search.get("from") || "");
  const [to, setTo] = useState<string>(search.get("to") || "");
  const [status, setStatus] = useState<string>(search.get("status") || "");
  const [payoutStatus, setPayoutStatus] = useState<string>(
    search.get("payoutStatus") || ""
  );

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (status) q.set("status", status);
    if (payoutStatus) q.set("payoutStatus", payoutStatus);
    return q.toString();
  }, [from, to, status, payoutStatus]);

  const load = async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${API_ENDPOINTS.ADMIN_AGENT_PAYMENTS(agentId)}${
        queryString ? `?${queryString}` : ""
      }`;
      const res = await apiClient.get<AgentPaymentItem[]>(url);
      setItems(res.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const onApplyFilters = () => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (status) q.set("status", status);
    if (payoutStatus) q.set("payoutStatus", payoutStatus);
    router.replace(`?${q.toString()}`);
    load();
  };

  const csvUrl = useMemo(() => {
    const base = API_ENDPOINTS.ADMIN_AGENT_PAYMENTS(agentId).replace(
      "/payments",
      "/payments.csv"
    );
    return `${base}${queryString ? `?${queryString}` : ""}`;
  }, [agentId, queryString]);

  return (
    <ProtectedRoute>
      <div className="py-4 pt-10">
        <div className="px-2 md:px-0">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-indigo-700 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
                ✨ Agent Payments Dashboard
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Agent ID:
                </span>
                <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border">
                  {agentId}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={csvUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </a>
              <Link
                href="/admin-users"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Users
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              Filters & Search
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="group">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  From Date
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-indigo-300"
                />
              </div>
              <div className="group">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  To Date
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-indigo-300"
                />
              </div>
              <div className="group">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Payment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-indigo-300"
                >
                  <option value="">All Payments</option>
                  <option value="completed">✅ Completed</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="failed">❌ Failed</option>
                </select>
              </div>
              <div className="group">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Payout Status
                </label>
                <select
                  value={payoutStatus}
                  onChange={(e) => setPayoutStatus(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-indigo-300"
                >
                  <option value="">All Payouts</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="paid">💰 Paid</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={onApplyFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Apply Filters
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Loading payments...
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-red-600 dark:text-red-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>No payments found for this agent.</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900">
                    <tr className="text-left">
                      <th className="py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Producer
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Commission (40%)
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Payout
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((p, index) => (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200 group"
                      >
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100">
                          {p.producerName || "—"}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-900 dark:text-gray-100">
                          {p.planName || "—"}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {p.amount} RWF
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-300">
                            {p.agentCommission || "—"} RWF
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              p.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : p.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {p.status === "completed" && "✅"}
                            {p.status === "pending" && "⏳"}
                            {p.status === "failed" && "❌"} {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {p.agentPayoutStatus === "paid" ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm">
                              💰 Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm animate-pulse">
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
