"use client";

import App from "@/App";

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
    return (
        <App
            userId={userId}
            username={username}
            isCoachMode={isAdmin}
            experienceId={experienceId}
        />
    );
}
