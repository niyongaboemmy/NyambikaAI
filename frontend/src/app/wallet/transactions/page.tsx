"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, API_ENDPOINTS } from "@/config/api";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
} from "lucide-react";

interface WalletPayment {
  id: string;
  type: "topup" | "debit";
  amount: string;
  currency: string;
  method: string;
  provider?: string;
  phone?: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  description?: string | null;
  externalReference?: string | null;
}

const StatusPill = ({ status }: { status: WalletPayment["status"] }) => {
  const base =
    "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1";
  if (status === "completed")
    return (
      <span
        className={`${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}
      >
        <CheckCircle className="h-3 w-3" /> Completed
      </span>
    );
  if (status === "pending")
    return (
      <span
        className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}
      >
        <Clock className="h-3 w-3 animate-spin" /> Pending
      </span>
    );
  return (
    <span
      className={`${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`}
    >
      <AlertCircle className="h-3 w-3" /> Failed
    </span>
  );
};

export default function TransactionsPage() {
  const { data: payments = [], isLoading } = useQuery<WalletPayment[]>({
    queryKey: [API_ENDPOINTS.WALLET_PAYMENTS],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.WALLET_PAYMENTS);
      return data || [];
    },
  });

  const [statusFilter, setStatusFilter] = useState<
    "all" | WalletPayment["status"]
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | WalletPayment["type"]>(
    "all"
  );
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selected, setSelected] = useState<WalletPayment | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let list = payments;
    if (statusFilter !== "all")
      list = list.filter((p) => p.status === statusFilter);
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((p) => new Date(p.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime();
      list = list.filter((p) => new Date(p.createdAt).getTime() <= to);
    }
    return list;
  }, [payments, statusFilter, typeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getIcon = (p: WalletPayment) =>
    p.type === "debit" ? (
      <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    );

  return (
    <div className="container mx-auto px-3 md:px-0 py-6 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Wallet Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View all your wallet top-ups and payments
          </p>
        </div>
        <button
          onClick={() => {
            // Build CSV from filtered list
            const headers = [
              "id",
              "type",
              "status",
              "amount",
              "currency",
              "method",
              "provider",
              "phone",
              "externalReference",
              "description",
              "createdAt",
            ];
            const rows = filtered.map((p) => [
              p.id,
              p.type,
              p.status,
              p.amount,
              p.currency,
              p.method,
              p.provider || "",
              p.phone || "",
              p.externalReference || "",
              (p.description || "").replace(/\n/g, " "),
              new Date(p.createdAt).toISOString(),
            ]);
            const csv = [
              headers.join(","),
              ...rows.map((r) =>
                r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `wallet-transactions-${new Date()
              .toISOString()
              .slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-4 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 backdrop-blur">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 rounded-md border bg-transparent text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            className="px-3 py-2 rounded-md border bg-transparent text-sm"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="all">All types</option>
            <option value="topup">Top-up</option>
            <option value="debit">Debit</option>
          </select>

          <input
            type="date"
            className="px-3 py-2 rounded-md border bg-transparent text-sm"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />

          <input
            type="date"
            className="px-3 py-2 rounded-md border bg-transparent text-sm"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
        </div>
      ) : pageItems.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No transactions to display
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageItems.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/80 transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      p.type === "topup"
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    {getIcon(p)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {p.type === "topup" ? "Top-up" : "Payment"}
                      </p>
                      <StatusPill status={p.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(p.createdAt).toLocaleString()} •{" "}
                      {p.provider?.toUpperCase() || p.method}
                    </p>
                    {p.externalReference && (
                      <p className="text-[11px] text-gray-400">
                        Ref: {p.externalReference}
                      </p>
                    )}
                    {p.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      p.type === "debit"
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {p.type === "debit" ? "-" : "+"} RWF{" "}
                    {Number(p.amount).toLocaleString()}
                  </p>
                  <button
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    onClick={() => setSelected(p)}
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-60"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-60"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Transaction Details</h2>
              <button
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-500">ID:</span> {selected.id}
              </p>
              <p>
                <span className="text-gray-500">Type:</span> {selected.type}
              </p>
              <p>
                <span className="text-gray-500">Status:</span> {selected.status}
              </p>
              <p>
                <span className="text-gray-500">Amount:</span> RWF{" "}
                {Number(selected.amount).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-500">Currency:</span>{" "}
                {selected.currency}
              </p>
              <p>
                <span className="text-gray-500">Method:</span> {selected.method}
              </p>
              <p>
                <span className="text-gray-500">Provider:</span>{" "}
                {selected.provider || "-"}
              </p>
              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                {selected.phone || "-"}
              </p>
              <p>
                <span className="text-gray-500">Reference:</span>{" "}
                {selected.externalReference || "-"}
              </p>
              <p>
                <span className="text-gray-500">Created:</span>{" "}
                {new Date(selected.createdAt).toLocaleString()}
              </p>
              {selected.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {selected.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
