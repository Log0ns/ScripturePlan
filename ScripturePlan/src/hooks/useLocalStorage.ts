import { useState, useCallback, useRef, useEffect } from 'react';

const DEBOUNCE_MS = 300;

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  const pendingRef = useRef<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush pending writes on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (pendingRef.current !== null) {
          try { localStorage.setItem(keyRef.current, JSON.stringify(pendingRef.current)); } catch {}
        }
      }
    };
  }, []);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      pendingRef.current = valueToStore;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(keyRef.current, JSON.stringify(pendingRef.current));
        } catch (error) {
          console.error(`Failed to save ${keyRef.current}:`, error);
        }
        pendingRef.current = null;
        timerRef.current = null;
      }, DEBOUNCE_MS);

      return valueToStore;
    });
  }, []);

  return [storedValue, setValue];
}
