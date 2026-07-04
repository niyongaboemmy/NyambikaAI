import React, { useEffect } from "react";

interface AnimatedAIBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedAIBackground: React.FC<AnimatedAIBackgroundProps> = ({
  children,
  className = "",
}) => {
  // Inject shared styles (scrollbar)
  useEffect(() => {
    const id = "ai-shared-styles";
    if (typeof document === "undefined") return;
    if (document.getElementById(id)) return;

    const styles = `
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #D4D4D4; border-radius: 3px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #B0B0B0; }
      .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; }
      .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4A4A4A; }
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
    <div className={"min-h-screen bg-background relative " + className}>
      {/* Foreground content */}
      <div className="relative z-10 pt-12">{children}</div>
    </div>
  );
};

export default AnimatedAIBackground;
