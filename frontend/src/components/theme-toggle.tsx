import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="rounded-full transition-all duration-300 hover:rotate-180 hover:scale-110 relative overflow-hidden group"
      title={`Current: ${
        theme === "system" ? `System (${actualTheme})` : theme
      }`}
    >
      {/* Enhanced background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

      {/* Light mode icon */}
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-amber-400" />

      {/* Dark mode icon */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-slate-700 dark:text-slate-300" />

      {/* System mode indicator */}
      {theme === "system" && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
      )}

      <span className="sr-only">
        Toggle theme (Current:{" "}
        {theme === "system" ? `System (${actualTheme})` : theme})
      </span>
    </Button>
  );
}
