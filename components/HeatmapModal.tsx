import React, { useState, useEffect, useMemo } from 'react';
import { X, Activity } from 'lucide-react';
import { Heatmap } from './Heatmap';
import { LogType } from '../types';

interface HeatmapModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRect: DOMRect | null;
    logs?: any[]; // Array of log entries
    onActivityClick?: (activity: any, rect: DOMRect) => void;
}

export const HeatmapModal: React.FC<HeatmapModalProps> = ({ isOpen, onClose, triggerRect, logs = [], onActivityClick }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
                    // Narrower width for stacked layout, auto height
                    const targetW = Math.min(viewportW - margin * 2, 700);
                    const targetH = Math.min(viewportH - margin * 2, 600);
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
                    opacity: 0.8,
                    zIndex: 50,
                    overflow: 'hidden',
                    transition: 'all 400ms cubic-bezier(0.32, 0.72, 0, 1)'
                });
            });

            const timer = setTimeout(() => setIsRendered(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen, triggerRect]);

    // Derive details for the selected date from the logs array
    const details = useMemo(() => {
        if (!selectedDate) return null;

        // Filter logs for the selected date
        const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === selectedDate.toDateString());

        if (dayLogs.length === 0) {
            return { type: 'No Activity', note: 'Not logged' };
        }

        // Prioritize logs: Workout (3) > Rest (2) > Reflect (1)
        dayLogs.sort((a, b) => {
            const getLevel = (t: string) => {
                if (t === LogType.WORKOUT) return 3;
                if (t === LogType.REST) return 2;
                return 1;
            };
            return getLevel(b.type) - getLevel(a.type);
        });

        return dayLogs[0];
    }, [selectedDate, logs]);

    const handleCardClick = (e: React.MouseEvent) => {
        if (details && details.type !== 'No Activity' && onActivityClick) {
            onActivityClick(details, e.currentTarget.getBoundingClientRect());
        }
    };

    if (!isRendered) return null;

    // Semantic text colors for the modal display
    const getTextColor = (type: string | undefined) => {
        switch (type) {
            case LogType.WORKOUT: return 'text-teal-600 dark:text-[#2dd4bf]';
            case LogType.REST: return 'text-rose-500 dark:text-[#f87171]';
            case LogType.REFLECT: return 'text-yellow-500 dark:text-[#facc15]';
            default: return 'text-gray-900 dark:text-white';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/95 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Animated Container */}
            <div
                style={animStyles}
                className="bg-white dark:bg-zinc-950 border-2 border-gray-200 dark:border-zinc-900 flex flex-col shadow-2xl pointer-events-auto"
            >

                {/* Header */}
                <div className={`flex items-center justify-between px-5 py-4 shrink-0 bg-white dark:bg-zinc-950 z-20 border-b border-gray-100 dark:border-zinc-900 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yearly Overview</h2>
                        <p className="text-gray-500 dark:text-zinc-500 text-sm">Consistency Map</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Container - Always stacked layout */}
                <div className={`flex flex-col gap-0 overflow-hidden flex-1 min-h-0 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>

                    {/* Heatmap Section */}
                    <div className="p-5 overflow-hidden flex flex-col justify-center bg-gray-50 dark:bg-zinc-950/50 relative flex-1">
                        <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar py-6 px-4 border border-gray-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950 shadow-sm dark:shadow-inner">
                            <Heatmap
                                logs={logs}
                                onDayClick={(date, level) => {
                                    setSelectedDate(date);
                                }}
                                selectedDate={selectedDate}
                            />
                        </div>
                    </div>

                    {/* Info Panel - Below heatmap */}
                    <div className="w-full shrink-0 border-t border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/20 p-5 overflow-hidden">
                        {selectedDate ? (
                            <div key={selectedDate.toString()} className="flex flex-col animate-slide-up">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                        <p className="text-gray-500 dark:text-zinc-500 text-sm">
                                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                        </p>
                                    </div>
                                    {details?.type !== 'No Activity' && (
                                        <span className="text-xs font-medium text-gray-400 dark:text-zinc-600">Click for details</span>
                                    )}
                                </div>

                                {/* Interactive Card */}
                                <div
                                    onClick={handleCardClick}
                                    className={`p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all duration-200 ${details?.type !== 'No Activity'
                                        ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99] hover:shadow-md border-transparent dark:hover:border-zinc-700'
                                        : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            {details?.type !== 'No Activity' && (
                                                <p className={`text-lg font-bold uppercase mb-1 tracking-tight ${getTextColor(details?.type)}`}>
                                                    {details?.type}
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-medium">
                                                {details?.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center text-gray-400 dark:text-zinc-600 text-center py-6">
                                <Activity size={20} className="mr-3 opacity-40" />
                                <p className="text-sm font-medium">Select a day to view details</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};