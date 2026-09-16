import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  validate?: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const fallback = () =>
      typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;

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

  // Persist changes, but only when the serialized value actually differs.
  useEffect(() => {
    try {
      const serialized = JSON.stringify(storedValue);
      if (window.localStorage.getItem(key) !== serialized) {
        window.localStorage.setItem(key, serialized);
      }
    } catch {
      // Storage may be unavailable (private mode, quota, etc.).
    }
  }, [key, storedValue]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== key) {
        return;
      }

      if (event.newValue === null) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as unknown;
        if (validate && !validate(parsed)) {
          return;
        }
        setStoredValue(parsed as T);
      } catch {
        // Ignore malformed payloads from other tabs.
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, validate]);

  return [storedValue, setStoredValue];
}