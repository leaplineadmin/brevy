import { useEffect, useRef, useState } from 'react';

interface UseAnimationTriggerOptions {
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

export const useAnimationTrigger = (options: UseAnimationTriggerOptions = {}) => {
  const { delay = 0, threshold = 0.1, rootMargin = '0px' } = options;
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [delay, threshold, rootMargin]);

  return { ref, isVisible };
};
