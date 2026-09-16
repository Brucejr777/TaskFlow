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

    const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === 'dark' ? '#111318' : '#f5f7fb';
    }
  }, [theme]);

  return [theme, setTheme];
}