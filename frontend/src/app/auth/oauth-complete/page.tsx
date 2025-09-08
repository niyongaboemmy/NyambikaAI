"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCompletePage() {
  const [status, setStatus] = useState<string>("Finishing sign-in...");
  const router = useRouter();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (typeof window === "undefined") return;

        // Read token from URL search parameters
        const { search } = window.location;
        const urlParams = new URLSearchParams(search);
        const token = urlParams.get('token');

        if (!token) {
          console.error("No token found in URL hash");
          setStatus("Authentication failed. Redirecting to login...");
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        // Clean up the URL by removing the token and user data from the URL
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        cleanUrl.searchParams.delete('user');
        window.history.replaceState(null, '', cleanUrl.toString());

        // Store the token in localStorage
        localStorage.setItem("auth_token", token);

        // Get user data from URL parameters (passed from backend)
        const userDataParam = urlParams.get("user");

        if (userDataParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            localStorage.setItem("user", JSON.stringify(userData));
            console.log("User data stored from URL parameters");
          } catch (e) {
            console.error("Failed to parse user data from URL:", e);
          }
        }

        // Optional redirect param from query string
        const redirectParam = urlParams.get("redirect");
        const redirect = redirectParam || "/";

        // Force a full page reload to ensure all context is properly initialized
        console.log("Authentication successful, redirecting to:", redirect);
        window.location.href = redirect;
      } catch (e) {
        console.error("OAuth completion failed:", e);
        setStatus("Authentication failed. Redirecting to login...");
        setTimeout(() => router.push("/"), 2000);
      }
    };

    handleOAuthCallback();
  }, [router]);

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
