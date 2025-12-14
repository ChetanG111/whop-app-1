'use client';

import { useState, useEffect } from 'react';
import { getSignedImageUrl, getAvatarSignedUrl } from '../lib/api';

/**
 * Hook to convert a storage path to a signed URL for display
 * @param path The storage path (from photo_url column)
 * @returns The signed URL or null while loading/on error
 */
export function useSignedUrl(path: string | undefined | null): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!path) {
            setUrl(null);
            return;
        }

        // If it's already a full URL (starts with http), use it directly
        if (path.startsWith('http://') || path.startsWith('https://')) {
            setUrl(path);
            return;
        }

        // Fetch signed URL for storage path
        let cancelled = false;
        getSignedImageUrl(path).then(result => {
            if (!cancelled && result.data?.url) {
                setUrl(result.data.url);
            }
        });

        return () => { cancelled = true; };
    }, [path]);

    return url;
}

/**
 * Hook to convert an avatar storage path to a signed URL for display
 * @param path The storage path (from avatar_url column)
 * @returns The signed URL or null while loading/on error
 */
export function useAvatarSignedUrl(path: string | undefined | null): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!path) {
            setUrl(null);
            return;
        }

        // If it's already a full URL (starts with http) or base64, use it directly
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
            setUrl(path);
            return;
        }

        // Fetch signed URL for storage path
        let cancelled = false;
        getAvatarSignedUrl(path).then(result => {
            if (!cancelled && result.data?.url) {
                setUrl(result.data.url);
            }
        });

        return () => { cancelled = true; };
    }, [path]);

    return url;
}
