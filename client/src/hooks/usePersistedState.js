// client/src/hooks/usePersistedState.js
// State that survives navigating away from a page (and a browser refresh).

import { useState, useEffect, useRef } from 'react';

export function usePersistedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) return initialValue;
      return JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      // storage full / unavailable - not fatal
    }
  }, [value]);

  return [value, setValue];
}

export function clearPersistedState(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
