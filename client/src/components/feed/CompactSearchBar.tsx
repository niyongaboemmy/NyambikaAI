import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  return (
    <div className={`mb-4 sticky ${stickyTopClass} z-40 animate-in slide-in-from-top-1 duration-150`}>
      <div className="max-w-md mx-auto">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
          <div className="relative flex items-center bg-muted rounded-full px-4 py-2 border border-border shadow-sm">
            <Search className="text-muted-foreground h-4 w-4 mr-3 flex-shrink-0" />
            <Input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:ring-0 focus:outline-none p-0 px-3"
              autoFocus
            />
            {value && (
              <button
                onClick={() => onChange("")}
                className="ml-2 p-1 rounded-full hover:bg-accent transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={onCancel}
              className="ml-2 text-xs font-medium text-muted-foreground px-2 py-1 rounded-full hover:bg-accent"
            >
              Cancel
            </button>
          </div>
          {typeof resultsCount === "number" && value && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background rounded-xl shadow-lg border border-border p-2 z-50">
              <div className="text-xs text-muted-foreground px-2 py-1">
                {resultsCount} result{resultsCount !== 1 ? "s" : ""} found
                {value && (
                  <button onClick={() => onChange("")} className="ml-2 text-primary hover:underline font-medium">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
