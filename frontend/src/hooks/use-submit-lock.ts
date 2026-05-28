import { useCallback, useRef, useState } from 'react';

/**
 * Çift tıklama / spam istek engeli. `run` içinde async iş yapın.
 */
export function useSubmitLock() {
  const [loading, setLoading] = useState(false);
  const guard = useRef(false);

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (guard.current) return undefined;
    guard.current = true;
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
      guard.current = false;
    }
  }, []);

  return { run, loading, locked: loading };
}
