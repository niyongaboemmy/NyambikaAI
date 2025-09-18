"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  apiClient,
  API_ENDPOINTS,
  RoleEnum,
  UserInterface,
} from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

interface TermsSection {
  id: string;
  heading: string;
  content: string;
}

interface TermsResponse {
  version: string;
  updatedAt: string;
  site: string;
  role: string;
  title: string;
  sections: TermsSection[];
}

export default function AgentTermsModal() {
  const { user, setSession } = useAuth() as any;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<TermsResponse | null>(null);
  const isAgentNeedingTerms = useMemo(() => {
    if (!user) return false;
    return user.role === RoleEnum.AGENT && !Boolean(user.termsAccepted);
  }, [user]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!isAgentNeedingTerms) return;
      try {
        const res = await apiClient.get<TermsResponse>(
          API_ENDPOINTS.TERMS_BY_ROLE("agent")
        );
        if (!ignore) {
          setTerms(res.data);
          setOpen(true);
        }
      } catch (e) {
        // Fallback minimal terms on failure
        if (!ignore) {
          setTerms({
            version: "1.0",
            updatedAt: new Date().toISOString().slice(0, 10),
            site: "Nyambika",
            role: "agent",
            title: "Agent Terms & Conditions",
            sections: [
              {
                id: "scope",
                heading: "Scope of Work",
                content:
                  "Agents help producers subscribe and process payments.",
              },
            ],
          });
          setOpen(true);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [isAgentNeedingTerms]);

  const accept = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post<{ ok: boolean; user: UserInterface }>(
        API_ENDPOINTS.AGENT_ACCEPT_TERMS,
        {}
      );
      const updatedUser = res.data?.user as UserInterface;
      // Preserve token and update session with provided user
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token") || ""
          : "";
      await setSession(token, updatedUser);
      setOpen(false);
    } catch (e) {
      console.error("Failed to accept terms", e);
      alert("Failed to accept terms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !isAgentNeedingTerms) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-white/80 dark:bg-gray-900/80 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header with gradient ring */}
        <div className="relative px-6 sm:px-8 pt-6 pb-4 bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 animate-pulse" />
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                {terms?.title || "Agent Terms & Conditions"}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Version {terms?.version} • Updated {terms?.updatedAt}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {terms?.sections?.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-black/5 dark:border-white/5"
            >
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {s.heading}
              </h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {s.content}
              </p>
            </div>
          ))}

          {/* Summary bullet points visually modern */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="text-sm font-medium">40% Commission</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Earn on every subscription you process
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="text-sm font-medium">Professional Conduct</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Follow policies and local regulations
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-white/60 dark:bg-gray-900/60">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              // Block app usage until acceptance; just no-op
            }}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-gray-300/60 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/80"
          >
            Read Again
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={accept}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:from-purple-500 hover:to-pink-500 disabled:opacity-60"
          >
            {loading ? "Confirming..." : "I Agree & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
