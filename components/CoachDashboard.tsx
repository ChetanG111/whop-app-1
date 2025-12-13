import React, { useState, useMemo } from 'react';
import { ActivityCard } from './ActivityCard';
import { LayoutDashboard, Users, ChevronRight, LayoutList } from 'lucide-react';
import { LogEntry } from '../types';
import { CoachMemberModal } from './CoachMemberModal';
import { calculateStreaks } from '../utils/analytics';

interface CoachDashboardProps {
    items: LogEntry[];
    onActivityClick: (activity: any, rect: DOMRect) => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ items, onActivityClick }) => {
    const [activeView, setActiveView] = useState<'FEED' | 'MEMBERS'>('FEED');

    // Member Modal State
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [memberTriggerRect, setMemberTriggerRect] = useState<DOMRect | null>(null);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    // Group items by username to build member list
    const members = useMemo(() => {
        const memberMap = new Map();

        items.forEach(item => {
            if (!memberMap.has(item.username)) {
                memberMap.set(item.username, {
                    username: item.username,
                    logs: [],
                    lastActive: new Date(0)
                });
            }
            const member = memberMap.get(item.username);
            member.logs.push(item);
            const itemDate = new Date(item.timestamp);
            if (itemDate > member.lastActive) {
                member.lastActive = itemDate;
            }
        });

        return Array.from(memberMap.values()).map(m => {
            const streaks = calculateStreaks(m.logs);
            return {
                ...m,
                stats: {
                    total: m.logs.length,
                    current: streaks.current,
                    max: streaks.max
                }
            };
        }).sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime()); // Sort by most recent activity
    }, [items]);

    const handleMemberClick = (member: any, e: React.MouseEvent) => {
        setMemberTriggerRect(e.currentTarget.getBoundingClientRect());
        setSelectedMember(member);
        setIsMemberModalOpen(true);
    };

    return (
        <div className="w-full h-full bg-gray-50 dark:bg-black transition-colors duration-500 relative flex flex-col overflow-hidden">

            {/* Fixed Header */}
            <div className="shrink-0 w-full max-w-3xl mx-auto p-4 pt-8 z-10">
                <div className="flex items-start justify-between px-1">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <LayoutDashboard className="text-indigo-600 dark:text-indigo-400" size={32} />
                            Coach Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-zinc-400 mt-2 text-lg">
                            Monitor community activity.
                        </p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 transition-all duration-300">
                        {activeView === 'FEED' ? (
                            <LayoutList size={16} className="text-indigo-600 dark:text-indigo-400" />
                        ) : (
                            <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                        )}
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 min-w-[90px] text-right">
                            {activeView === 'FEED' ? `${items.length} Updates` : `${members.length} Members`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sliding Content Area */}
            <div className="flex-1 relative overflow-hidden w-full">
                <div
                    className={`flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${activeView === 'FEED' ? 'translate-x-0' : '-translate-x-1/2'
                        }`}
                >
                    {/* View 1: Feed */}
                    <div className="w-1/2 h-full overflow-y-auto no-scrollbar pb-32">
                        <div className="w-full max-w-3xl mx-auto p-4">
                            <div className="flex flex-col space-y-4">
                                {items.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400 dark:text-zinc-600">
                                        <p>No activity logs found in the community yet.</p>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <div key={item.id} className="relative">
                                            <ActivityCard
                                                username={item.username as string}
                                                type={item.type}
                                                workoutType={item.workoutType}
                                                note={item.isPublicNote ? item.note : undefined}
                                                imageUrl={item.isPublicPhoto ? item.photoUrl : undefined}
                                                onClick={(e) => onActivityClick(item, e.currentTarget.getBoundingClientRect())}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* View 2: Members */}
                    <div className="w-1/2 h-full overflow-y-auto no-scrollbar pb-32">
                        <div className="w-full max-w-3xl mx-auto p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {members.map((member) => (
                                    <div
                                        key={member.username}
                                        onClick={(e) => handleMemberClick(member, e)}
                                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-500 dark:hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98] group"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 font-bold text-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {member.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{member.username}</h3>
                                                <p className="text-xs text-gray-500 dark:text-zinc-500">
                                                    Last active: {member.lastActive.toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-zinc-800 pt-4">
                                            <div className="text-center">
                                                <span className="block text-lg font-bold text-gray-900 dark:text-white">{member.stats.total}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Logs</span>
                                            </div>
                                            <div className="text-center border-l border-gray-100 dark:border-zinc-800">
                                                <span className="block text-lg font-bold text-teal-600 dark:text-teal-400">{member.stats.current}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Streak</span>
                                            </div>
                                            <div className="text-center border-l border-gray-100 dark:border-zinc-800">
                                                <span className="block text-lg font-bold text-orange-500 dark:text-orange-400">{member.stats.max}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Max</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end text-indigo-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            View Profile <ChevronRight size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coach Bottom Nav (Centered Pill Only) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center w-full max-w-sm px-4 pointer-events-none">
                <div className="pointer-events-auto shadow-2xl rounded-[2rem]">
                    <div className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[2rem] p-1.5 flex items-center backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 active:scale-95 transition-transform duration-200">
                        {/* Sliding Background */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/30 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]`}
                            style={{
                                width: 'calc(50% - 6px)',
                                left: activeView === 'FEED' ? '6px' : 'calc(50% + 0px)'
                            }}
                        />

                        <button
                            onClick={() => setActiveView('FEED')}
                            className={`relative z-10 w-24 sm:w-28 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === 'FEED' ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <LayoutList size={18} />
                            Feed
                        </button>
                        <button
                            onClick={() => setActiveView('MEMBERS')}
                            className={`relative z-10 w-24 sm:w-28 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === 'MEMBERS' ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <Users size={18} />
                            Members
                        </button>
                    </div>
                </div>
            </div>

            <CoachMemberModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                triggerRect={memberTriggerRect}
                memberData={selectedMember}
                onActivityClick={onActivityClick}
            />
        </div>
    );
};