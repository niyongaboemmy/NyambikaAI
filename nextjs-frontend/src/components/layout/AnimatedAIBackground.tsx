import React, { useEffect } from "react";

interface AnimatedAIBackgroundProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Controls whether to render the decorative orbs/circuit background layer.
   * If you want just the gradient background without floating shapes, set false.
   */
  decorations?: boolean;
}

const AnimatedAIBackground: React.FC<AnimatedAIBackgroundProps> = ({
  children,
  className = "",
  decorations = true,
}) => {
  // Inject shared styles (scrollbar + keyframes if needed)
  useEffect(() => {
    const id = "ai-shared-styles";
    if (typeof document === "undefined") return;
    if (document.getElementById(id)) return;

    const styles = `
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(59,130,246,0.1); border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #3b82f6, #8b5cf6); border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #2563eb, #7c3aed); }
      .dark .custom-scrollbar::-webkit-scrollbar-track { background: rgba(99,102,241,0.2); }
      .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #6366f1, #a855f7); }
    `;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = styles;
    document.head.appendChild(el);
    return () => {
      // keep styles for app lifetime
    };
  }, []);

  return (
    <div
      className={
        "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 " +
        "dark:from-gray-950 dark:via-gray-950 dark:to-black relative " +
        className
      }
    >
      {decorations && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-bounce"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-green-400/15 via-teal-400/15 to-blue-400/15 rounded-full blur-2xl animate-ping"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-gradient-to-r from-purple-400/15 via-pink-400/15 to-rose-400/15 rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: "2s" }}
          />

          {/* Subtle circuit lines */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-1/4 w-px h-32 bg-gradient-to-b from-blue-500 to-transparent animate-pulse" />
            <div
              className="absolute top-40 left-1/3 w-24 h-px bg-gradient-to-r from-purple-500 to-transparent animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute bottom-32 right-1/3 w-px h-24 bg-gradient-to-t from-cyan-500 to-transparent animate-pulse"
              style={{ animationDelay: "2s" }}
            />
          </div>
          <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.6"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#grid)"
                className="text-blue-600 dark:text-blue-300"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Foreground content */}
      <div className="relative z-10 pt-12">{children}</div>
    </div>
  );
};

export default AnimatedAIBackground;
