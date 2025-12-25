"use client";

import { useState } from 'react';
import { useDashboardData } from "@/hooks";
import { CoachDashboard } from "@/components/CoachDashboard";
import { ActivityModal } from "@/components/ActivityModal";
import { ErrorToast } from "@/components/ui";

interface DashboardClientProps {
    companyId: string;
    userId: string;
    username: string;
}

export default function DashboardClient({ companyId, userId, username }: DashboardClientProps) {
    // Fetch dashboard data using the hook
    const dashboardData = useDashboardData({
        companyId,
        userId,
        username,
    });

    // Activity Modal State
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [activityTriggerRect, setActivityTriggerRect] = useState<DOMRect | null>(null);

    // Error display state
    const [displayError, setDisplayError] = useState<string | null>(null);

    // Sync error from hook
    if (dashboardData.error && displayError !== dashboardData.error) {
        setDisplayError(dashboardData.error);
    }

    const openActivityModal = (activity: any, rect: DOMRect) => {
        setSelectedActivity(activity);
        setActivityTriggerRect(rect);
        setIsActivityModalOpen(true);
    };

    // Dashboard view is admin-only, so no update/delete from here
    // These are view-only in dashboard context
    const handleUpdateActivity = async () => { };
    const handleDeleteActivity = async () => {
        setIsActivityModalOpen(false);
    };

    return (
        <div className="h-screen w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative flex flex-col overflow-hidden font-sans transition-colors duration-500">
            {/* Error Toast */}
            <ErrorToast
                message={displayError}
                onDismiss={() => setDisplayError(null)}
                duration={6000}
            />

            {/* Coach Dashboard - Company Wide View */}
            <CoachDashboard
                items={dashboardData.feedItems}
                members={dashboardData.members}
                onActivityClick={openActivityModal}
                isLoading={dashboardData.isLoading}
            />

            {/* Activity Details Modal (Read-Only) */}
            <ActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                triggerRect={activityTriggerRect}
                activity={selectedActivity}
                onUpdate={handleUpdateActivity}
                onDelete={handleDeleteActivity}
                currentUsername={username}
                isCoachMode={true}
            />
        </div>
    );
}
