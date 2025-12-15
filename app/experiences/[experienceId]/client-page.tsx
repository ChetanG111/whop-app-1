"use client";

import App from "@/App";
import { useAppData } from "@/hooks";

interface ClientAppProps {
    experienceId: string;
    userId: string;
    username: string;
    isAdmin: boolean;
}

export default function ClientApp({
    experienceId,
    userId,
    username,
    isAdmin
}: ClientAppProps) {
    // Fetch all data using the hook
    const appData = useAppData({
        userId,
        username,
        experienceId,
        isCoachMode: isAdmin,
    });

    return (
        <App
            userId={userId}
            username={username}
            isCoachMode={isAdmin}
            experienceId={experienceId}
            // Pass data from hook
            feedItems={appData.feedItems}
            myActivities={appData.myActivities}
            members={appData.members}
            userProfile={appData.profile}
            streak={appData.streak}
            // Pass handlers
            onCreateCheckin={appData.createCheckin}
            onUpdateCheckin={appData.updateCheckin}
            onDeleteCheckin={appData.deleteCheckin}
            onUpdateProfile={appData.updateProfile}
            // Loading states
            isLoading={appData.isLoading}
            isSubmitting={appData.isSubmitting}
            error={appData.error}
        />
    );
}
