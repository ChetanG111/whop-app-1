import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import ClientApp from "./client-page.tsx";

// Development fallback configuration
const DEV_USER = {
    userId: process.env.DEV_USER_ID || "dev_user_123",
    username: process.env.DEV_USERNAME || "DevUser",
    isAdmin: process.env.DEV_IS_ADMIN === "true",
};

export default async function ExperiencePage({
    params,
}: {
    params: Promise<{ experienceId: string }>;
}) {
    const { experienceId } = await params;
    const isDevelopment = process.env.NODE_ENV === "development";

    let userId: string;
    let username: string;
    let isAdmin: boolean;
    let isDevMode = false;

    try {
        // Verify the user token from request headers
        const tokenResult = await whopsdk.verifyUserToken(await headers());
        userId = tokenResult.userId;

        // Check if user has access to this experience
        const access = await whopsdk.users.checkAccess(experienceId, { id: userId });

        if (!access.has_access) {
            return (
                <div className="h-screen w-full flex items-center justify-center bg-black text-white">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                        <p className="text-gray-400">You don&apos;t have access to this experience.</p>
                    </div>
                </div>
            );
        }

        // Get user profile information
        const user = await whopsdk.users.retrieve(userId);
        username = user.username || user.name || "User";
        isAdmin = access.access_level === "admin";
    } catch (error) {
        // In development, use fallback mock data
        if (isDevelopment) {
            console.warn(
                "⚠️ Whop user token not found. Using development fallback.",
                "\n   To use real authentication, run your app inside the Whop iframe.",
                "\n   You can customize dev user via DEV_USER_ID, DEV_USERNAME, DEV_IS_ADMIN env vars."
            );
            userId = DEV_USER.userId;
            username = DEV_USER.username;
            isAdmin = DEV_USER.isAdmin;
            isDevMode = true;
        } else {
            // In production, re-throw the error
            throw error;
        }
    }

    return (
        <>
            {isDevMode && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-1 text-sm font-medium">
                    🚧 Development Mode - Using mock user: {username} {isAdmin ? "(Admin)" : "(Member)"}
                </div>
            )}
            <ClientApp
                experienceId={experienceId}
                userId={userId}
                username={username}
                isAdmin={isAdmin}
            />
        </>
    );
}
