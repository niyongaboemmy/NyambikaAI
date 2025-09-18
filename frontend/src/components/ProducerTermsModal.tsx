"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiClient, API_ENDPOINTS, RoleEnum, UserInterface } from "@/config/api";
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

export default function ProducerTermsModal() {
  const { user, setSession } = useAuth() as any;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<TermsResponse | null>(null);
  const needsTerms = useMemo(() => {
    if (!user) return false;
    return user.role === RoleEnum.PRODUCER && !Boolean(user.termsAccepted);
  }, [user]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!needsTerms) return;
      try {
        const res = await apiClient.get<TermsResponse>(API_ENDPOINTS.TERMS_BY_ROLE("producer"));
        if (!ignore) {
          setTerms(res.data);
          setOpen(true);
        }
      } catch (e) {
        if (!ignore) {
          setTerms({
            version: "1.0",
            updatedAt: new Date().toISOString().slice(0, 10),
            site: "Nyambika",
            role: "producer",
            title: "Producer Terms & Conditions",
            sections: [
              { id: "eligibility", heading: "Eligibility & Verification", content: "An active subscription and verified business details are required to sell on Nyambika." }
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
  }, [needsTerms]);

  const accept = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post<{ ok: boolean; user: UserInterface }>(API_ENDPOINTS.AGENT_ACCEPT_TERMS.replace("/api/agent/terms/accept", "/api/terms/accept"), {});
      const updatedUser = res.data?.user as UserInterface;
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";
      await setSession(token, updatedUser);
      setOpen(false);
    } catch (e) {
      console.error("Failed to accept terms", e);
      alert("Failed to accept terms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !needsTerms) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-white/80 dark:bg-gray-900/80 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="relative px-6 sm:px-8 pt-6 pb-4 bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 animate-pulse" />
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                {terms?.title || "Producer Terms & Conditions"}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">Version {terms?.version} • Updated {terms?.updatedAt}</p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {terms?.sections?.map((s) => (
            <div key={s.id} className="p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-black/5 dark:border-white/5">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{s.heading}</h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{s.content}</p>
            </div>
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20">
              <div className="text-sm font-medium">Verified Business</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Keep details accurate for trust and visibility</div>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <div className="text-sm font-medium">Timely Fulfillment</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Acknowledge and ship orders on time</div>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-white/60 dark:bg-gray-900/60">
          <button
            type="button"
            disabled={loading}
            onClick={() => {}}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-gray-300/60 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/80"
          >
            Read Again
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={accept}
            className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60"
          >
            {loading ? "Confirming..." : "I Agree & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
