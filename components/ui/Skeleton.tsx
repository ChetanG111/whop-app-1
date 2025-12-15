import React from 'react';

/**
 * Base shimmer animation class - used by all skeleton components
 */
const shimmerClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 bg-[length:200%_100%]";

/**
 * Skeleton for ActivityCard - matches the ActivityCard layout
 */
export const SkeletonActivityCard: React.FC = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex items-start gap-4 animate-fadeIn">
            {/* Text content skeleton */}
            <div className="flex-1 space-y-3">
                {/* Username line */}
                <div className={`h-4 w-24 rounded-md ${shimmerClass}`} />

                {/* Type badge */}
                <div className={`h-5 w-16 rounded-full ${shimmerClass}`} />

                {/* Note lines */}
                <div className="space-y-2 pt-1">
                    <div className={`h-3 w-full rounded ${shimmerClass}`} />
                    <div className={`h-3 w-4/5 rounded ${shimmerClass}`} />
                </div>
            </div>

            {/* Visual indicator box skeleton */}
            <div className={`w-14 h-14 rounded-xl shrink-0 ${shimmerClass}`} />
        </div>
    );
};

/**
 * Skeleton for stats cards in YouView
 */
export const SkeletonStatCard: React.FC = () => {
    return (
        <div className={`bg-white dark:bg-zinc-900 p-3 py-4 rounded-2xl border border-gray-200 dark:border-zinc-800 text-center shadow-sm flex flex-col items-center justify-center min-h-[100px] animate-fadeIn`}>
            {/* Number */}
            <div className={`h-8 w-12 rounded-md mb-2 ${shimmerClass}`} />
            {/* Label */}
            <div className={`h-3 w-16 rounded ${shimmerClass}`} />
        </div>
    );
};

/**
 * Skeleton for member cards in CoachDashboard
 */
export const SkeletonMemberCard: React.FC = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm animate-fadeIn">
            {/* Header with avatar */}
            <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full ${shimmerClass}`} />
                {/* Name and status */}
                <div className="flex-1 space-y-2">
                    <div className={`h-5 w-32 rounded-md ${shimmerClass}`} />
                    <div className={`h-3 w-24 rounded ${shimmerClass}`} />
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-zinc-800 pt-4">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="text-center">
                        <div className={`h-5 w-8 rounded mx-auto mb-1 ${shimmerClass}`} />
                        <div className={`h-2 w-10 rounded mx-auto ${shimmerClass}`} />
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Skeleton for heatmap in YouView
 */
export const SkeletonHeatmap: React.FC = () => {
    return (
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-2xl p-5 pb-8 shadow-sm animate-fadeIn">
            {/* Month labels */}
            <div className="flex justify-between mb-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`h-3 w-8 rounded ${shimmerClass}`} />
                ))}
            </div>

            {/* Heatmap grid placeholder */}
            <div className="grid grid-cols-12 gap-1">
                {[...Array(84)].map((_, i) => (
                    <div
                        key={i}
                        className={`aspect-square rounded-sm ${shimmerClass}`}
                        style={{ animationDelay: `${(i % 12) * 50}ms` }}
                    />
                ))}
            </div>
        </div>
    );
};

/**
 * Container to display multiple skeleton activity cards
 */
export const SkeletonFeed: React.FC<{ count?: number }> = ({ count = 3 }) => {
    return (
        <div className="flex flex-col space-y-3">
            {[...Array(count)].map((_, i) => (
                <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
                    <SkeletonActivityCard />
                </div>
            ))}
        </div>
    );
};

/**
 * Container to display skeleton stat cards
 */
export const SkeletonStats: React.FC = () => {
    return (
        <div className="grid grid-cols-3 gap-3 mb-6">
            {[0, 1, 2].map((i) => (
                <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
                    <SkeletonStatCard />
                </div>
            ))}
        </div>
    );
};

/**
 * Container to display skeleton member cards grid
 */
export const SkeletonMembersGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
                    <SkeletonMemberCard />
                </div>
            ))}
        </div>
    );
};
