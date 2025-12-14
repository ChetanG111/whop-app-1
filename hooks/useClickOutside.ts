import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect clicks outside of a referenced element
 * @param onClickOutside - Callback when click happens outside
 * @param enabled - Whether the hook is active (usually tied to modal isOpen state)
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    onClickOutside: () => void,
    enabled: boolean = true
): React.RefObject<T | null> {
    const ref = useRef<T>(null);

    const handleClick = useCallback(
        (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClickOutside();
            }
        },
        [onClickOutside]
    );

    useEffect(() => {
        if (!enabled) return;

        // Add slight delay to avoid catching the opening click
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClick);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [enabled, handleClick]);

    return ref;
}
