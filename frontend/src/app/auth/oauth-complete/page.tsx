"use client";
import { useEffect, useState } from "react";

export default function OAuthCompletePage() {
  const [status, setStatus] = useState<string>("Finishing sign-in...");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (typeof window === "undefined") return;

        // Read token from location.hash
        const { hash, search } = window.location;
        const tokenMatch = hash.match(/token=([^&]+)/);
        const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

        if (!token) {
          setStatus("Missing token from OAuth callback.");
          // Fallback: go home after a short delay
          setTimeout(() => window.location.replace("/"), 1200);
          return;
        }

        // Persist token - ensure it's properly formatted
        const formattedToken =
          token.startsWith('"') && token.endsWith('"')
            ? token.slice(1, -1)
            : token;

        localStorage.setItem("auth_token", formattedToken);

        // Optional redirect param from query string (?redirect=/profile)
        const redirectParam = new URLSearchParams(search).get("redirect");
        const redirect = redirectParam || "/";

        // Fetch user data to ensure the token is valid
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${formattedToken}`,
                "Content-Type": "application/json",
              },
              credentials: "include", // Important for cookies
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }

          const userData = await response.json();

          // Store user data in localStorage for immediate access
          localStorage.setItem("user", JSON.stringify(userData));

          setStatus("Signed in! Redirecting...");

          // Force a full page reload to ensure all context is properly initialized
          window.location.href = redirect;
        } catch (error) {
          console.error("Error initializing session:", error);
          // Fallback to simple redirect if user data fetch fails
          window.location.href = redirect;
        }
      } catch (e) {
        console.error("OAuth completion failed:", e);
        setStatus("Sign-in completed, redirecting...");
        if (typeof window !== "undefined") {
          window.location.replace("/");
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const manualContinue = () => {
    try {
      if (typeof window === "undefined") return;
      const redirectParam = new URLSearchParams(window.location.search).get(
        "redirect"
      );
      const redirect = redirectParam || "/";
      window.location.assign(redirect);
    } catch {}
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center p-6 rounded-2xl bg-white/70 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl shadow-lg">
        {/* Immediate inline script to ensure auto-login and redirect even before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(typeof window==='undefined')return;var H=window.location.hash;var S=window.location.search;var m=H&&H.match(/token=([^&]+)/);if(m){var t=decodeURIComponent(m[1]);localStorage.setItem('auth_token', t);var r=new URLSearchParams(S).get('redirect')||'/';window.location.replace(r);} }catch(e){console.error('early oauth-complete script failed',e);}})();",
          }}
        />
        <div className="animate-spin inline-block h-6 w-6 border-2 border-current border-t-transparent rounded-full text-blue-500 mr-2 align-[-2px]" />
        <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">
          {status}
        </div>
        <button
          onClick={manualContinue}
          className="mt-2 px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
