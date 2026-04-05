import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-card shadow-2xl border border-border/50 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-background rounded-full p-4 border border-border/50 shadow-inner">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold gradient-text">Loading Model...</h2>
          <p className="text-sm text-muted-foreground animate-pulse">
            Connecting to NyambikaAI...
          </p>
        </div>
      </div>
    </div>
  );
}
