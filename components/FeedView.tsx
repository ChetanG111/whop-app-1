import React, { useMemo } from 'react';
import { ActivityCard } from './ActivityCard';
import { LogEntry } from '../types';

interface FeedViewProps {
    items: LogEntry[];
    onActivityClick: (activity: any, rect: DOMRect) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ items, onActivityClick }) => {
    // Calculate today's updates
    const todaysUpdates = useMemo(() => {
        const todayStr = new Date().toDateString();
        return items.filter(item => new Date(item.timestamp).toDateString() === todayStr).length;
    }, [items]);

    return (
        <div className="w-full max-w-2xl mx-auto p-4 pb-32">
            <div className="flex items-center justify-between mb-6 px-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Feed</h1>

                {/* Today's Updates Indicator */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {todaysUpdates} New Today
                    </span>
                </div>
            </div>

            <div className="flex flex-col space-y-3">
                {items.map((item) => (
                    <ActivityCard
                        key={item.id}
                        username={item.username ?? 'Anonymous'} // Fallback if username missing
                        type={item.type}
                        workoutType={item.workoutType}
                        // Conditionally render note and image based on public flags
                        note={item.isPublicNote ? item.note : undefined}
                        imageUrl={item.isPublicPhoto ? item.photoUrl : undefined}
                        onClick={(e) => onActivityClick(item, e.currentTarget.getBoundingClientRect())}
                    />
                ))}
            </div>
        </div>
    );
};
