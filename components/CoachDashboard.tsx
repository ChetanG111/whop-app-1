import React, { useState } from 'react';
import { ActivityCard } from './ActivityCard';
import { LayoutDashboard, Users, ChevronRight, LayoutList } from 'lucide-react';
import { LogEntry } from '../types';
import { CoachMemberModal } from './CoachMemberModal';
import type { MemberData } from '../lib/api';

interface CoachDashboardProps {
    items: LogEntry[];
    members: MemberData[];
    onActivityClick: (activity: any, rect: DOMRect) => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ items, members, onActivityClick }) => {
    const [activeView, setActiveView] = useState<'FEED' | 'MEMBERS'>('FEED');

    // Member Modal State
    const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
    const [memberTriggerRect, setMemberTriggerRect] = useState<DOMRect | null>(null);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    // Get logs for a specific member (for the modal)
    const getMemberLogs = (memberId: string): LogEntry[] => {
        // Match by userIdor by username/displayName
        return items.filter(item => {
            const member = members.find(m => m.userId === memberId);
            if (!member) return false;
            // Check if username matches displayName or username
            return item.username === member.displayName ||
                item.username === member.username;
        });
    };

    const handleMemberClick = (member: MemberData, e: React.MouseEvent) => {
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
                            <LayoutDashboard className="text-brand-600 dark:text-brand-400" size={32} />
                            Coach Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-zinc-400 mt-2 text-lg">
                            Monitor community activity.
                        </p>
                    </div>
                    <div className="bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-full border border-brand-100 dark:border-brand-900/50 flex items-center gap-2 transition-all duration-300">
                        {activeView === 'FEED' ? (
                            <LayoutList size={16} className="text-brand-600 dark:text-brand-400" />
                        ) : (
                            <Users size={16} className="text-brand-600 dark:text-brand-400" />
                        )}
                        <span className="text-sm font-bold text-brand-700 dark:text-brand-300 min-w-[90px] text-right">
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
                            {members.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 dark:text-zinc-600">
                                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No members found yet.</p>
                                    <p className="text-sm mt-2">Members will appear here once they join.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {members.map((member) => {
                                        const displayName = member.displayName || member.username;
                                        const lastActiveText = member.lastCheckinDate
                                            ? `Last active: ${new Date(member.lastCheckinDate).toLocaleDateString()}`
                                            : 'No activity yet';

                                        return (
                                            <div
                                                key={member.userId}
                                                onClick={(e) => handleMemberClick(member, e)}
                                                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:border-brand-500 dark:hover:border-brand-500 hover:-translate-y-1 transition-all duration-300 cursor-pointer active:scale-[0.98] group"
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 font-bold text-lg group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors overflow-hidden">
                                                        {member.avatarUrl ? (
                                                            <img src={member.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            displayName.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{displayName}</h3>
                                                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                                                            {lastActiveText}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-zinc-800 pt-4">
                                                    <div className="text-center">
                                                        <span className="block text-lg font-bold text-gray-900 dark:text-white">{member.totalCheckins}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Logs</span>
                                                    </div>
                                                    <div className="text-center border-l border-gray-100 dark:border-zinc-800">
                                                        <span className="block text-lg font-bold text-teal-600 dark:text-teal-400">{member.currentStreak}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Streak</span>
                                                    </div>
                                                    <div className="text-center border-l border-gray-100 dark:border-zinc-800">
                                                        <span className="block text-lg font-bold text-orange-500 dark:text-orange-400">{member.longestStreak}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Max</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center justify-end text-brand-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                                    View Profile <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
                            className={`absolute top-1.5 bottom-1.5 rounded-[1.5rem] bg-brand-50 dark:bg-brand-900/30 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]`}
                            style={{
                                width: 'calc(50% - 6px)',
                                left: activeView === 'FEED' ? '6px' : 'calc(50% + 0px)'
                            }}
                        />

                        <button
                            onClick={() => setActiveView('FEED')}
                            className={`relative z-10 w-24 sm:w-28 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === 'FEED' ? 'text-brand-600 dark:text-brand-300' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <LayoutList size={18} />
                            Feed
                        </button>
                        <button
                            onClick={() => setActiveView('MEMBERS')}
                            className={`relative z-10 w-24 sm:w-28 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === 'MEMBERS' ? 'text-brand-600 dark:text-brand-300' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
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
                logs={selectedMember ? getMemberLogs(selectedMember.userId) : []}
                onActivityClick={onActivityClick}
            />
        </div>
    );
};