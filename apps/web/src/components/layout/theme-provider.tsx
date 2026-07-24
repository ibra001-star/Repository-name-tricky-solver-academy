'use client';

import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'tsa-theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = React.useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
    setThemeState(stored);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const effective = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      root.classList.toggle('dark', effective === 'dark');
      setResolvedTheme(effective);
    };

    apply();
    if (theme === 'system') {
      mediaQuery.addEventListener('change', apply);
      return () => mediaQuery.removeEventListener('change', apply);
    }
  }, [theme]);

  const setTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
