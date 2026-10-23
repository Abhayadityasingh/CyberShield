import { useCallback, useEffect, useRef } from 'react';

// Returns a function that waits `delay` ms after the LAST call before running fn
export function useDebouncedCallback(fn, delay) {
  const fnRef = useRef(fn);
  const timer = useRef();
  useEffect(() => { fnRef.current = fn; });
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);
}