import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { THEME_KEY } from '../constants';
import type { Theme } from '../types';

const getInitialTheme = (): Theme => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
  } catch {
    // Ignore storage access errors.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function useTheme(): [Theme, Dispatch<SetStateAction<Theme>>] {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage access errors.
    }

    const metaTheme = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#111318' : '#f5f7fb';
    }
  }, [theme]);

  // Sync theme changes across tabs.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY) {
        return;
      }

      if (event.newValue === 'light' || event.newValue === 'dark') {
        setTheme(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return [theme, setTheme];
}