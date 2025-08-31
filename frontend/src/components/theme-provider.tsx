'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ActualTheme = 'light' | 'dark';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  forcedTheme?: string;
  enableSystem?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: Theme) => void;
};

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent): ActualTheme => 
  (e?.matches ?? window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'nyambika-ui-theme',
  forcedTheme,
  enableSystem = true,
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // Get the initial theme from the document element class or local storage
  const [theme, setThemeState] = useState<Theme>(() => {
    // On server, return the default theme
    if (typeof window === 'undefined') return defaultTheme;
    
    // If theme is forced, use it
    if (forcedTheme) return forcedTheme as Theme;
    
    // Check if theme is already applied to the document (set by the script in layout)
    const root = document.documentElement;
    if (root.classList.contains('dark')) return 'dark';
    if (root.classList.contains('light')) return 'light';
    
    // Fallback to local storage or default
    try {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    } catch (e) {
      return defaultTheme;
    }
  });
  
  // Track the actual theme being displayed (light or dark)
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    
    // Check document first to match the initial theme application
    const root = document.documentElement;
    if (root.classList.contains('dark')) return 'dark';
    if (root.classList.contains('light')) return 'light';
    
    // Fallback to local storage or system preference
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    } catch (e) {
      console.error('Error reading theme from localStorage:', e);
    }
    
    return enableSystem ? getSystemTheme() : 'light';
  });

  // Apply the theme to the document
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === 'undefined') return null;
    
    const root = document.documentElement;
    
    if (newTheme === 'system' && enableSystem) {
      const systemTheme = getSystemTheme();
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
      setActualTheme(systemTheme);
      return systemTheme;
    }
    
    if (newTheme === 'light' || newTheme === 'dark') {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      setActualTheme(newTheme);
      return newTheme;
    }
    
    return null;
  }, [enableSystem]);

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const handleMediaQuery = (e: MediaQueryListEvent) => {
      try {
        if (theme === 'system' && enableSystem && !forcedTheme) {
          applyTheme('system');
        }
      } catch (error) {
        console.warn('Error handling media query change:', error);
      }
    };

    let media: MediaQueryList | null = null;
    
    try {
      media = window.matchMedia('(prefers-color-scheme: dark)');
      if (media && typeof media.addEventListener === 'function') {
        media.addEventListener('change', handleMediaQuery);
      }
      
      // Apply the current theme
      applyTheme(theme);
    } catch (error) {
      console.warn('Error setting up media query listener:', error);
      // Fallback: just apply the theme without media query listener
      applyTheme(theme);
    }
    
    return () => {
      try {
        if (media && typeof media.removeEventListener === 'function') {
          media.removeEventListener('change', handleMediaQuery);
        }
      } catch (error) {
        console.warn('Error removing media query listener:', error);
      }
    };
  }, [theme, forcedTheme, enableSystem, applyTheme, mounted]);

  // Handle theme changes
  const setTheme = useCallback((newTheme: Theme) => {
    if (forcedTheme) return;
    
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
    
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, [forcedTheme, storageKey, applyTheme]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme: forcedTheme ? forcedTheme as Theme : theme,
    actualTheme: forcedTheme ? forcedTheme as ActualTheme : actualTheme,
    setTheme,
  }), [theme, actualTheme, setTheme, forcedTheme]);

  // Don't render the children until we've mounted on the client
  if (!mounted) {
    return null;
  }

  return (
    <ThemeProviderContext.Provider value={contextValue} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
