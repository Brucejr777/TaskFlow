import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  validate?: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const fallback = () =>
      typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return fallback();
      }

      const parsed = JSON.parse(item) as unknown;
      if (validate && !validate(parsed)) {
        return fallback();
      }

      return parsed as T;
    } catch {
      return fallback();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Storage may be unavailable (private mode, quota, etc.).
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}