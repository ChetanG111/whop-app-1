'use client';

import { useState, useEffect, useRef } from 'react';
import { getSignedImageUrl, getAvatarSignedUrl } from '../lib/api';

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
