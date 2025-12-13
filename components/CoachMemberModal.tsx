import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Trophy, Activity, Flame } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { ActivityCard } from './ActivityCard';
import { LogType } from '../types';

interface CoachMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRect: DOMRect | null;
    memberData: {
        username: string;
        logs: any[];
        stats: {
            current: number;
            max: number;
            total: number;
        }
    } | null;
    onActivityClick: (activity: any, rect: DOMRect) => void;
}

export const CoachMemberModal: React.FC<CoachMemberModalProps> = ({
    isOpen,
    onClose,
    triggerRect,
    memberData,
    onActivityClick
}) => {
    const [isRendered, setIsRendered] = useState(false);
    const [animStyles, setAnimStyles] = useState<React.CSSProperties>({});
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (isOpen && triggerRect) {
            setIsRendered(true);
            setShowContent(false);

            // Start State
            setAnimStyles({
                position: 'fixed',
                top: `${triggerRect.top}px`,
                left: `${triggerRect.left}px`,
                width: `${triggerRect.width}px`,
                height: `${triggerRect.height}px`,
                borderRadius: '1rem',
                opacity: 1,
                zIndex: 50,
                overflow: 'hidden',
                transform: 'none',
                transition: 'none'
            });

            // Target State
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const viewportW = window.innerWidth;
                    const viewportH = window.innerHeight;

                    const margin = 24;
                    const targetW = Math.min(viewportW - (margin * 2), 800);
                    const targetH = Math.min(viewportH - (margin * 2), 800);

                    const targetLeft = (viewportW - targetW) / 2;
                    const targetTop = (viewportH - targetH) / 2;

                    setAnimStyles({
                        position: 'fixed',
                        top: `${targetTop}px`,
                        left: `${targetLeft}px`,
                        width: `${targetW}px`,
                        height: `${targetH}px`,
                        borderRadius: '1.5rem',
                        zIndex: 50,
                        opacity: 1,
                        transition: 'all 500ms cubic-bezier(0.32, 0.72, 0, 1)',
                        overflow: 'hidden'
                    });

                    setTimeout(() => setShowContent(true), 200);
                });
            });
        } else if (!isOpen && isRendered && triggerRect) {
            setShowContent(false);
            requestAnimationFrame(() => {
                setAnimStyles({
                    position: 'fixed',
                    top: `${triggerRect.top}px`,
                    left: `${triggerRect.left}px`,
                    width: `${triggerRect.width}px`,
                    height: `${triggerRect.height}px`,
                    borderRadius: '1rem',
                    opacity: 0,
                    zIndex: 50,
                    overflow: 'hidden',
                    transition: 'all 400ms cubic-bezier(0.32, 0.72, 0, 1)'
                });
            });

            const timer = setTimeout(() => setIsRendered(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen, triggerRect]);

    if (!isRendered || !memberData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Animated Container */}
            <div
                style={animStyles}
                className="bg-white dark:bg-zinc-950 border-2 border-gray-200 dark:border-zinc-900 flex flex-col shadow-2xl pointer-events-auto"
            >

                {/* Header */}
                <div className={`flex items-center justify-between p-6 shrink-0 bg-white dark:bg-zinc-950 z-20 border-b border-gray-100 dark:border-zinc-900 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold">
                            {memberData.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{memberData.username}</h2>
                            <p className="text-gray-500 dark:text-zinc-500 text-sm">Member Details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Container */}
                <div className={`flex flex-col overflow-y-auto no-scrollbar flex-1 min-h-0 bg-gray-50 dark:bg-black transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>

                    <div className="p-6 space-y-6">

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-sm">
                                <Activity className="mb-2 text-indigo-500" size={20} />
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{memberData.stats.total}</span>
                                <span className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-bold mt-1">Total Logs</span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-sm">
                                <Flame className="mb-2 text-teal-500" size={20} />
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{memberData.stats.current}</span>
                                <span className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-bold mt-1">Streak</span>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-sm">
                                <Trophy className="mb-2 text-orange-500" size={20} />
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{memberData.stats.max}</span>
                                <span className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-bold mt-1">Max Streak</span>
                            </div>
                        </div>

                        {/* Heatmap Section */}
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar size={16} />
                                Consistency Map
                            </h3>
                            <Heatmap logs={memberData.logs} />
                        </div>

                        {/* Logs List */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 px-1">
                                Recent Public Activity
                            </h3>
                            <div className="flex flex-col space-y-3">
                                {memberData.logs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 dark:text-zinc-600 text-sm">
                                        No public logs available.
                                    </div>
                                ) : (
                                    memberData.logs.map((item) => (
                                        <ActivityCard
                                            key={item.id}
                                            username={item.username}
                                            type={item.type}
                                            workoutType={item.workoutType}
                                            note={item.isPublicNote ? item.note : undefined}
                                            imageUrl={item.isPublicPhoto ? item.imageUrl : undefined}
                                            onClick={(e) => onActivityClick(item, e.currentTarget.getBoundingClientRect())}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};