"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<string>("Finishing sign-in...");

  useEffect(() => {
    try {
      // Token passed in location.hash: #token=...
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const tokenMatch = hash.match(/token=([^&]+)/);
      const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

      if (!token) {
        setStatus("Missing token from OAuth callback.");
        // Fallback: go home after a short delay
        setTimeout(() => router.replace("/"), 1200);
        return;
      }

      // Persist token on frontend origin
      localStorage.setItem("auth_token", token);

      // Optional: redirect target from query (?redirect=/profile)
      const redirect = params.get("redirect") || "/";

      setStatus("Signed in! Redirecting...");
      // Use replace to avoid keeping the intermediate page in history
      router.replace(redirect);
    } catch (e) {
      console.error("OAuth completion failed:", e);
      setStatus("Sign-in completed, redirecting...");
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center p-6 rounded-2xl bg-white/70 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl shadow-lg">
        <div className="animate-spin inline-block h-6 w-6 border-2 border-current border-t-transparent rounded-full text-blue-500 mr-2 align-[-2px]" />
        <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
      </div>
    </div>
  );
}
