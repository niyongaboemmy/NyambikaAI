import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface LoginPromptContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  error: string | null;
  clearError: () => void;
  show: (message: string) => void;
}

const LoginPromptContext = createContext<LoginPromptContextType | undefined>(
  undefined
);

export function useLoginPrompt(): LoginPromptContextType {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) {
    // Return a no-op implementation instead of throwing during SSR/mounting
    if (typeof window === "undefined") {
      const fallback: LoginPromptContextType = {
        isOpen: false,
        open: () => {},
        close: () => {},
        error: null,
        clearError: () => {},
        show: () => {},
      };
      return fallback;
    }
    throw new Error("useLoginPrompt must be used within LoginPromptProvider");
  }
  return ctx;
}

export function LoginPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Ensure mounted ref is set to true on mount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const open = useCallback(() => {
    if (!isMountedRef.current) return;

    // Prevent rapid successive calls only if modal is already open
    if (openingRef.current && isOpen) return;

    openingRef.current = true;
    setIsOpen(true);

    // Reset the opening ref after a short delay to allow future opens
    setTimeout(() => {
      if (isMountedRef.current) {
        openingRef.current = false;
      }
    }, 100);
  }, [isOpen]);

  const close = useCallback(() => {
    if (isMountedRef.current) {
      setIsOpen(false);
      setError(null);
      // Reset opening ref to allow future opens
      openingRef.current = false;
    }
  }, []);

  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, []);

  // Open with a specific message (used for verification prompts)
  const show = useCallback(
    (message: string) => {
      if (!isMountedRef.current) return;
      setError(message);
      open();
    },
    [open]
  );

  // Listen for global unauthorized events dispatched by API client
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onUnauthorized = (e: Event) => {
      if (!isMountedRef.current) return;
      // Attempt to set a friendly default error if none set
      if (!error) {
        setError("Your session has expired. Please log in to continue.");
      }
      open();
    };

    window.addEventListener("auth:unauthorized", onUnauthorized as any);
    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized as any);
    };
  }, [error, open]);

  // Global fetch interceptor for 401
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch.bind(window);

    async function wrappedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      try {
        const res = await originalFetch(input as any, init);

        // Only handle 401s if component is still mounted
        if (!isMountedRef.current) return res;

        // Skip auth endpoints to avoid loops
        const url =
          typeof input === "string" ? input : (input as URL).toString();
        const isAuthEndpoint =
          /\/api\/auth\//.test(url) ||
          /\/api\/signin/.test(url) ||
          /\/api\/signout/.test(url);

        if (!isAuthEndpoint && res.status === 401) {
          // Set error message for better UX
          setError("Your session has expired. Please log in again.");
          open();
        }

        return res;
      } catch (e) {
        // Handle network errors gracefully
        if (isMountedRef.current) {
          console.error("Network error:", e);
          setError("Network error occurred. Please check your connection.");
        }
        throw e;
      }
    }

    (window as any).fetch = wrappedFetch as any;

    return () => {
      if (typeof window !== "undefined") {
        (window as any).fetch = originalFetch as any;
      }
    };
  }, [open]);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      error,
      clearError,
      show,
    }),
    [isOpen, open, close, error, clearError, show]
  );

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
    </LoginPromptContext.Provider>
  );
}
