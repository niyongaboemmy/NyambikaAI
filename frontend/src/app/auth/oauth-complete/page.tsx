"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

export default function OAuthCompletePage() {
  const [status, setStatus] = useState<string>("Finishing sign-in...");
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const { show: showLoginPrompt } = useLoginPrompt();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (typeof window === "undefined") return;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!token) {
          console.error("No token found in OAuth callback URL");
          setStatus("We couldn't complete sign-in. Redirecting home...");
          setFailed(true);
          setTimeout(() => {
            showLoginPrompt(
              "We couldn't finish signing you in with that provider. Please try again."
            );
            router.push("/");
          }, 1500);
          return;
        }

        // Clean up the URL by removing the token and user data from the URL
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("token");
        cleanUrl.searchParams.delete("user");
        window.history.replaceState(null, "", cleanUrl.toString());

        localStorage.setItem("auth_token", token);

        const userDataParam = urlParams.get("user");
        if (userDataParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (e) {
            console.error("Failed to parse user data from URL:", e);
          }
        }

        const redirectParam = urlParams.get("redirect");
        const redirect = redirectParam || "/";

        // Force a full page reload to ensure all context is properly initialized
        window.location.href = redirect;
      } catch (e) {
        console.error("OAuth completion failed:", e);
        setStatus("Something went wrong. Redirecting home...");
        setFailed(true);
        setTimeout(() => {
          showLoginPrompt("Something went wrong finishing sign-in. Please try again.");
          router.push("/");
        }, 1500);
      }
    };

    handleOAuthCallback();
  }, [router, showLoginPrompt]);

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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center p-8 rounded-3xl bg-card/95 border border-border/50 backdrop-blur-xl max-w-sm">
        <Loader2
          className={`h-8 w-8 mx-auto mb-3 text-gold-600 ${
            failed ? "" : "animate-spin"
          }`}
        />
        <div className="mb-4 text-sm text-foreground">{status}</div>
        {!failed && (
          <button
            onClick={manualContinue}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Taking too long? Continue manually
          </button>
        )}
      </div>
    </div>
  );
}
