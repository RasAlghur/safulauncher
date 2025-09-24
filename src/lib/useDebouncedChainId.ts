// src/lib/useDebouncedChainId.ts
import { useState, useEffect } from 'react';

export function useDebouncedChainId(chainId: number, delay: number = 5000) {
  const [debouncedChainId, setDebouncedChainId] = useState(chainId);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedChainId(chainId);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [chainId, delay]);

  return debouncedChainId;
}