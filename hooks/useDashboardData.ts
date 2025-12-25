'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MemberData } from '../lib/api';
import type { LogEntry } from '../types';

interface UseDashboardDataProps {
    companyId: string;
    userId: string;
    username: string;
}

interface UseDashboardDataReturn {
    // Data
    feedItems: LogEntry[];
    members: MemberData[];

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Refresh
    refreshFeed: () => Promise<void>;
    refreshMembers: () => Promise<void>;
}

/**
 * Data hook for the Dashboard view (company-level data)
 * Fetches feed and members across all experiences for a company
 */
export function useDashboardData({
    companyId,
    userId,
    username,
}: UseDashboardDataProps): UseDashboardDataReturn {
    // State
    const [feedItems, setFeedItems] = useState<LogEntry[]>([]);
    const [members, setMembers] = useState<MemberData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch feed (company-wide)
    const refreshFeed = useCallback(async () => {
        try {
            const response = await fetch(`/api/feed?companyId=${encodeURIComponent(companyId)}`);
            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Unable to load the feed.');
                return;
            }

            if (result.feed) {
                // Import the conversion helper dynamically
                const { checkinToLogEntry } = await import('../lib/api');
                const entries = result.feed.map((checkin: any) => checkinToLogEntry(checkin));
                setFeedItems(entries as LogEntry[]);
            }
        } catch (err) {
            console.error('Error fetching company feed:', err);
            setError('Unable to load the feed. Please refresh the page.');
        }
    }, [companyId]);

    // Fetch members (company-wide)
    const refreshMembers = useCallback(async () => {
        try {
            const response = await fetch(`/api/members?companyId=${encodeURIComponent(companyId)}`);
            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Unable to load members.');
                return;
            }

            if (result.members) {
                setMembers(result.members);
            }
        } catch (err) {
            console.error('Error fetching company members:', err);
            setError('Unable to load members. Please refresh the page.');
        }
    }, [companyId]);

    // Initial data fetch
    useEffect(() => {
        async function loadInitialData() {
            setIsLoading(true);
            setError(null);
            await Promise.all([refreshFeed(), refreshMembers()]);
            setIsLoading(false);
        }
        loadInitialData();
    }, [refreshFeed, refreshMembers]);

    return {
        feedItems,
        members,
        isLoading,
        error,
        refreshFeed,
        refreshMembers,
    };
}
