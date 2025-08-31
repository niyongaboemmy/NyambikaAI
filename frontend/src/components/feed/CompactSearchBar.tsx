import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/custom-ui/input";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  placeholder?: string;
  resultsCount?: number;
  stickyTopClass?: string; // e.g., "top-20"
};

export default function CompactSearchBar({
  value,
  onChange,
  onCancel,
  placeholder = "Search products...",
  resultsCount,
  stickyTopClass = "top-20",
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = React.useState(false);
  const [topOffset, setTopOffset] = React.useState(0);

  // Detect when the sticky bar is stuck to apply elevated shadow
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const computed = window.getComputedStyle(el);
    const topPx = parseInt(computed.top || "0", 10) || 0;
    setTopOffset(topPx);

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      setStuck(rect.top <= topPx + 0.5);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (value) onChange("");
      else onCancel();
    }
  };

  return (
    <div
      ref={containerRef}
      role="search"
      aria-label="Product search"
      className={[
        "mb-4 sticky z-40",
        stickyTopClass,
        // Smooth entrance
        "animate-in slide-in-from-top-1 duration-150",
      ].join(" ")}
      style={
        {
          // Ensure it overlays content when stuck
          // backdropFilter: "saturate(1.2) blur(2px)",
        }
      }
    >
      <div className="max-w-md mx-auto px-2 sm:px-0">
        <div
          className={[
            "relative group rounded-xl",
            // Glassmorphism container
            "bg-white/80 dark:bg-slate-900/70 border border-white/60 dark:border-white/10",
            "shadow-sm",
            // Elevated shadow when stuck
            stuck ? "shadow-lg ring-1 ring-black/5 dark:ring-white/10" : "",
          ].join(" ")}
        >
          {/* Soft gradient glow on focus */}
          <div className="pointer-events-none absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-200" />

          <div className="relative flex items-center gap-2 px-3 py-2">
            <Search
              className="text-muted-foreground h-4 w-4 flex-shrink-0"
              aria-hidden="true"
            />
            <label htmlFor="compact-search" className="sr-only">
              {placeholder}
            </label>
            <Input
              id="compact-search"
              type="text"
              inputMode="search"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none p-0 px-5 border-none"
              autoFocus
              aria-describedby={
                typeof resultsCount === "number"
                  ? "search-results-count"
                  : undefined
              }
            />

            {typeof resultsCount === "number" && value && (
              <span
                id="search-results-count"
                className="hidden sm:inline-flex items-center rounded-xl px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500/20"
              >
                {resultsCount}
              </span>
            )}

            {value && (
              <button
                onClick={() => onChange("")}
                className="ml-1 h-6 w-6 inline-flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}

            <button
              onClick={onCancel}
              className="ml-1 text-[11px] font-medium text-muted-foreground px-2 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close search"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Inline helper below bar */}
        {typeof resultsCount === "number" && value && (
          <div className="px-2 sm:px-0">
            <div className="mt-1 text-xs text-muted-foreground">
              {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
              {value && (
                <button
                  onClick={() => onChange("")}
                  className="ml-2 text-primary hover:underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
