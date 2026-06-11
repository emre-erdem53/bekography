"use client";

import { useCallback, useEffect, useState } from "react";

type UseInViewOnceOptions = {
  rootMargin?: string;
  threshold?: number;
};

/**
 * Öğe görünür alana (veya rootMargin ile yakına) geldiğinde bir kez `true` olur.
 */
export function useInViewOnce(options: UseInViewOnceOptions = {}) {
  const { rootMargin = "200px 0px", threshold = 0 } = options;
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  const ref = useCallback((node: HTMLDivElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, inView, rootMargin, threshold]);

  return { ref, inView };
}
