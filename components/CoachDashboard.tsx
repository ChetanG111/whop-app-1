import React, { useState } from 'react';
import { ActivityCard } from './ActivityCard';
import { LayoutDashboard, Users, ChevronRight } from 'lucide-react';
import { LogEntry } from '../types';
import { CoachMemberModal } from './CoachMemberModal';
import type { MemberData } from '../lib/api';
import { SkeletonMembersGrid } from './ui';

interface CoachDashboardProps {
    items: LogEntry[];
    members: MemberData[];
    onActivityClick: (activity: any, rect: DOMRect) => void;
    isLoading?: boolean;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ items, members, onActivityClick, isLoading = false }) => {
    // Community feed view removed - always show Members view
    // const [activeView, setActiveView] = useState<'FEED' | 'MEMBERS'>('MEMBERS');

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
                    <div className="animate-spring-up delay-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <LayoutDashboard className="text-brand-600 dark:text-brand-400" size={32} />
                            Coach Dashboard
                        </h1>
                        <p className="text-gray-500 dark:text-zinc-400 mt-2 text-lg">
                            Manage your members.
                        </p>
                    </div>
                    <div className="bg-brand-50 dark:bg-brand-900/20 px-3 py-2 rounded-full border border-brand-100 dark:border-brand-900/50 flex items-center gap-1.5 animate-spring-up delay-2">
                        <Users size={16} className="text-brand-600 dark:text-brand-400" />
                        <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                            {members.length} Members
                        </span>
                    </div>
                </div>
            </div>

            {/* Members Content - Feed view removed */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                <div className="w-full max-w-3xl mx-auto p-4">
                    {isLoading ? (
                        <SkeletonMembersGrid count={4} />
                    ) : members.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 dark:text-zinc-600">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No members found yet.</p>
                            <p className="text-sm mt-2">Members will appear here once they join.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-spring-up delay-3">
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

                                        <div className="mt-4 flex items-center justify-end text-brand-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300">
                                            View Profile <ChevronRight size={16} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom navigation removed - Feed/Members toggle no longer needed */}

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