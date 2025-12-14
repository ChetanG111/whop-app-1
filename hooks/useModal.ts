import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage modal state with body scroll locking
 */
export function useModal(initialState: boolean = false): {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
} {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    return { isOpen, open, close, toggle };
}

/**
 * Hook to lock body scroll when any modal is open
 * Pass in multiple modal states to manage scroll lock
 */
export function useBodyScrollLock(modalStates: boolean[]) {
    useEffect(() => {
        const anyOpen = modalStates.some((state) => state);

        if (anyOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [modalStates]);
}
