'use client';

import { useState, useEffect, useRef, RefObject } from 'react';
import { getSignedImageUrl, getAvatarSignedUrl } from '../lib/api';
import { useInView } from './useInView';

// =============================================================================
// Simple module-level cache for signed URLs
// =============================================================================

interface CacheEntry {
    url: string;
    expiresAt: number;
}

// Cache expiry: 55 minutes (signed URLs expire in 60 minutes)
const CACHE_EXPIRY_MS = 55 * 60 * 1000;

// Shared cache across all hook instances
const urlCache = new Map<string, CacheEntry>();

// Track which images have been preloaded
const preloadedImages = new Set<string>();

function getCachedUrl(path: string): string | null {
    const entry = urlCache.get(path);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        urlCache.delete(path);
        return null;
    }
    return entry.url;
}

function setCachedUrl(path: string, url: string): void {
    urlCache.set(path, {
        url,
        expiresAt: Date.now() + CACHE_EXPIRY_MS,
    });
}

function preloadImage(url: string): void {
    if (typeof window === 'undefined') return;
    if (preloadedImages.has(url)) return;
    preloadedImages.add(url);
    const img = new Image();
    img.src = url;
}

/**
 * Get the initial URL value - checks cache synchronously
 */
function getInitialUrl(path: string | undefined | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    return getCachedUrl(path);
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to convert a storage path to a signed URL for display.
 * Uses caching and image preloading for instant display in modals.
 */
export function useSignedUrl(path: string | undefined | null): string | null {
    // Initialize from cache synchronously - this is the key to instant loading!
    const [url, setUrl] = useState<string | null>(() => getInitialUrl(path));
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!path) {
            setUrl(null);
            return;
        }

        // Handle full URLs and data URLs directly
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            setUrl(path);
            if (!path.startsWith('data:')) {
                preloadImage(path);
            }
            return;
        }

        // Check cache - if found, set it and we're done
        const cached = getCachedUrl(path);
        if (cached) {
            setUrl(cached);
            preloadImage(cached);
            return;
        }

        // Not cached - fetch signed URL
        getSignedImageUrl(path)
            .then(result => {
                if (mountedRef.current && result.data?.url) {
                    const signedUrl = result.data.url;
                    setCachedUrl(path, signedUrl);
                    preloadImage(signedUrl);
                    setUrl(signedUrl);
                }
            })
            .catch(err => {
                console.warn('Failed to get signed URL:', err);
            });

        return () => {
            mountedRef.current = false;
        };
    }, [path]);

    return url;
}

/**
 * Hook to convert an avatar storage path to a signed URL for display.
 */
export function useAvatarSignedUrl(path: string | undefined | null): string | null {
    // Initialize from cache synchronously
    const [url, setUrl] = useState<string | null>(() => getInitialUrl(path));
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        if (!path) {
            setUrl(null);
            return;
        }

        // Handle full URLs and data URLs directly
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            setUrl(path);
            if (!path.startsWith('data:')) {
                preloadImage(path);
            }
            return;
        }

        // Check cache - if found, set it and we're done
        const cached = getCachedUrl(path);
        if (cached) {
            setUrl(cached);
            preloadImage(cached);
            return;
        }

        // Not cached - fetch signed URL
        getAvatarSignedUrl(path)
            .then(result => {
                if (mountedRef.current && result.data?.url) {
                    const signedUrl = result.data.url;
                    setCachedUrl(path, signedUrl);
                    preloadImage(signedUrl);
                    setUrl(signedUrl);
                }
            })
            .catch(err => {
                console.warn('Failed to get avatar signed URL:', err);
            });

        return () => {
            mountedRef.current = false;
        };
    }, [path]);

    return url;
}

// =============================================================================
// Lazy/Viewport-Aware Hooks
// =============================================================================

interface UseLazySignedUrlReturn {
    /** Ref to attach to the container element */
    ref: RefObject<HTMLDivElement | null>;
    /** The signed URL (null until in view and fetched) */
    url: string | null;
    /** Whether the element has entered the viewport */
    inView: boolean;
}

/**
 * Hook to convert a storage path to a signed URL, but ONLY when the element
 * is near the viewport. This reduces unnecessary API calls for off-screen content.
 * 
 * @param path - Storage path or full URL
 * @param rootMargin - How far before viewport to trigger (default: "200px")
 * @returns Object with ref (attach to container), url, and inView status
 * 
 * @example
 * const { ref, url } = useLazySignedUrl(imageUrl);
 * return (
 *   <div ref={ref}>
 *     {url && <img src={url} alt="..." />}
 *   </div>
 * );
 */
export function useLazySignedUrl(
    path: string | undefined | null,
    rootMargin: string = '200px'
): UseLazySignedUrlReturn {
    const { ref, inView } = useInView({ rootMargin, triggerOnce: true });
    const [url, setUrl] = useState<string | null>(() => getInitialUrl(path));
    const mountedRef = useRef(true);
    const fetchedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;

        // Don't fetch if not in view yet (the key optimization!)
        if (!inView) return;

        // Already fetched or no path
        if (fetchedRef.current || !path) return;

        // Handle full URLs and data URLs directly
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            setUrl(path);
            if (!path.startsWith('data:')) {
                preloadImage(path);
            }
            fetchedRef.current = true;
            return;
        }

        // Check cache first
        const cached = getCachedUrl(path);
        if (cached) {
            setUrl(cached);
            preloadImage(cached);
            fetchedRef.current = true;
            return;
        }

        // Fetch signed URL
        fetchedRef.current = true; // Mark as fetched to prevent duplicate calls
        getSignedImageUrl(path)
            .then(result => {
                if (mountedRef.current && result.data?.url) {
                    const signedUrl = result.data.url;
                    setCachedUrl(path, signedUrl);
                    preloadImage(signedUrl);
                    setUrl(signedUrl);
                }
            })
            .catch(err => {
                console.warn('Failed to get signed URL:', err);
                fetchedRef.current = false; // Allow retry on error
            });

        return () => {
            mountedRef.current = false;
        };
    }, [path, inView]);

    return { ref, url, inView };
}

/**
 * Lazy version of useAvatarSignedUrl - only fetches when element is near viewport.
 */
export function useLazyAvatarSignedUrl(
    path: string | undefined | null,
    rootMargin: string = '200px'
): UseLazySignedUrlReturn {
    const { ref, inView } = useInView({ rootMargin, triggerOnce: true });
    const [url, setUrl] = useState<string | null>(() => getInitialUrl(path));
    const mountedRef = useRef(true);
    const fetchedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;

        if (!inView) return;
        if (fetchedRef.current || !path) return;

        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            setUrl(path);
            if (!path.startsWith('data:')) {
                preloadImage(path);
            }
            fetchedRef.current = true;
            return;
        }

        const cached = getCachedUrl(path);
        if (cached) {
            setUrl(cached);
            preloadImage(cached);
            fetchedRef.current = true;
            return;
        }

        fetchedRef.current = true;
        getAvatarSignedUrl(path)
            .then(result => {
                if (mountedRef.current && result.data?.url) {
                    const signedUrl = result.data.url;
                    setCachedUrl(path, signedUrl);
                    preloadImage(signedUrl);
                    setUrl(signedUrl);
                }
            })
            .catch(err => {
                console.warn('Failed to get avatar signed URL:', err);
                fetchedRef.current = false;
            });

        return () => {
            mountedRef.current = false;
        };
    }, [path, inView]);

    return { ref, url, inView };
}
