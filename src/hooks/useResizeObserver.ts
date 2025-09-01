import { useRef, useEffect, useCallback } from 'react';

interface UseResizeObserverOptions {
  onResize?: (entry: ResizeObserverEntry) => void;
  disabled?: boolean;
}

export function useResizeObserver<T extends HTMLElement>({
  onResize,
  disabled = false
}: UseResizeObserverOptions = {}) {
  const elementRef = useRef<T>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const observe = useCallback(() => {
    if (disabled || !elementRef.current || observerRef.current) return;

    observerRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && onResize) {
        onResize(entry);
      }
    });

    observerRef.current.observe(elementRef.current);
  }, [onResize, disabled]);

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!disabled) {
      observe();
    }

    return disconnect;
  }, [observe, disconnect, disabled]);

  useEffect(() => {
    if (disabled) {
      disconnect();
    } else {
      observe();
    }
  }, [disabled, observe, disconnect]);

  return {
    ref: elementRef,
    observe,
    disconnect
  };
}