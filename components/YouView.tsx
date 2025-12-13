import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { UserProfile, LogEntry } from '../types';
import { ActivityCard } from './ActivityCard';
import { Heatmap } from './Heatmap';
import { calculateStreaks } from '../utils/analytics';

interface YouViewProps {
    onOpenHeatmap: (rect: DOMRect) => void;
    onActivityClick: (activity: any, rect: DOMRect) => void;
    userProfile: UserProfile;
    activities: LogEntry[];
}

export const YouView: React.FC<YouViewProps> = ({ onOpenHeatmap, onActivityClick, userProfile, activities }) => {
    const handleHeatmapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onOpenHeatmap(rect);
    };

    const { current, max } = useMemo(() => calculateStreaks(activities), [activities]);

    const cardHoverClasses = "hover:shadow-xl hover:-translate-y-1 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 active:scale-[0.98] transition-all duration-300 cursor-pointer";

    return (
        <div className="w-full max-w-2xl mx-auto p-4 pb-32">
            <div className="flex items-center gap-3 mb-6 px-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className={`bg-white dark:bg-zinc-900 p-3 py-4 rounded-2xl border border-gray-200 dark:border-zinc-800 text-center shadow-sm flex flex-col justify-center min-h-[100px] ${cardHoverClasses}`}>
                    <span className="block text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{activities.length}</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-bold mt-1">Total Logs</span>
                </div>
                <div className={`bg-white dark:bg-zinc-900 p-3 py-4 rounded-2xl border border-gray-200 dark:border-zinc-800 text-center shadow-sm flex flex-col justify-center min-h-[100px] ${cardHoverClasses}`}>
                    <span className="block text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">{current}</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-bold mt-1">Streak</span>
                </div>
                <div className={`bg-white dark:bg-zinc-900 p-3 py-4 rounded-2xl border border-gray-200 dark:border-zinc-800 text-center shadow-sm flex flex-col justify-center min-h-[100px] ${cardHoverClasses}`}>
                    <span className="block text-2xl sm:text-3xl font-bold text-orange-500 dark:text-orange-400">{max}</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-bold mt-1">Max Streak</span>
                </div>
            </div>

            <div className="mb-8 group">
                <div
                    onClick={handleHeatmapClick}
                    className={`relative w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-2xl p-5 pb-8 shadow-sm ${cardHoverClasses} group`}
                >
                    <Heatmap logs={activities} />

                    {/* Expand Text Overlay - Absolutely positioned to avoid layout shift */}
                    <div className="absolute bottom-3 right-5 flex items-center text-indigo-500 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        Expand <ChevronRight size={14} className="ml-1" />
                    </div>
                </div>
            </div>

            {/* Personal Activity Feed */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold px-1 text-gray-500 dark:text-zinc-400">Recent History</h3>
                <div className="flex flex-col space-y-3">
                    {activities.map(item => (
                        <ActivityCard
                            key={item.id}
                            username={item.username as string}
                            type={item.type}
                            workoutType={item.workoutType}
                            note={item.note}
                            imageUrl={item.photoUrl}
                            onClick={(e) => onActivityClick(item, e.currentTarget.getBoundingClientRect())}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
