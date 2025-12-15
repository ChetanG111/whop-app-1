'use client';

import { useState, useEffect, useRef, RefObject } from 'react';

interface UseInViewOptions {
    /** Margin around the root element (default: "200px" to preload before visible) */
    rootMargin?: string;
    /** Visibility threshold (0-1, default: 0) */
    threshold?: number;
    /** Only trigger once (default: true) */
    triggerOnce?: boolean;
}

interface UseInViewReturn {
    /** Ref to attach to the target element */
    ref: RefObject<HTMLDivElement | null>;
    /** Whether the element is/was in view */
    inView: boolean;
}

/**
 * Hook to detect when an element enters the viewport.
 * Uses IntersectionObserver for efficient detection.
 * 
 * @example
 * const { ref, inView } = useInView({ rootMargin: '200px' });
 * return <div ref={ref}>{inView && <ExpensiveContent />}</div>;
 */
export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
    const {
        rootMargin = '200px', // Preload 200px before element is visible
        threshold = 0,
        triggerOnce = true,
    } = options;

    const ref = useRef<HTMLDivElement | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // If already triggered and triggerOnce is true, skip
        if (inView && triggerOnce) return;

        // Check for IntersectionObserver support (SSR safety)
        if (typeof IntersectionObserver === 'undefined') {
            // Fallback: assume in view
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    setInView(true);
                    if (triggerOnce) {
                        observer.disconnect();
                    }
                } else if (!triggerOnce) {
                    setInView(false);
                }
            },
            {
                rootMargin,
                threshold,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [rootMargin, threshold, triggerOnce, inView]);

    return { ref, inView };
}
