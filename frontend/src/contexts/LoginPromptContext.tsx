import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface LoginPromptContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const LoginPromptContext = createContext<LoginPromptContextType | undefined>(undefined);

export function useLoginPrompt() {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) throw new Error("useLoginPrompt must be used within LoginPromptProvider");
  return ctx;
}

export function LoginPromptProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openingRef = useRef(false);

  const open = useCallback(() => {
    if (openingRef.current) return;
    openingRef.current = true;
    setIsOpen(true);
    // allow re-open later
    setTimeout(() => (openingRef.current = false), 500);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // Global fetch interceptor for 401
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    async function wrappedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      try {
        const res = await originalFetch(input as any, init);
        // Skip auth endpoints to avoid loops
        const url = typeof input === "string" ? input : (input as URL).toString();
        const isAuthEndpoint = /\/api\/auth\//.test(url);
        if (!isAuthEndpoint && res.status === 401) {
          open();
        }
        return res;
      } catch (e) {
        throw e;
      }
    }

    (window as any).fetch = wrappedFetch as any;
    return () => {
      (window as any).fetch = originalFetch as any;
    };
  }, [open]);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <LoginPromptContext.Provider value={value}>{children}</LoginPromptContext.Provider>
  );
}
