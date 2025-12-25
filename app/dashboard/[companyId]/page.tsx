import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import DashboardClient from "./client-page";

// Development fallback configuration
const DEV_USER = {
    userId: process.env.DEV_USER_ID || "dev_admin_123",
    username: process.env.DEV_USERNAME || "DevAdmin",
};

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ companyId: string }>;
}) {
    const { companyId } = await params;
    const isDevelopment = process.env.NODE_ENV === "development";

    let userId: string;
    let username: string;
    let isDevMode = false;

    // Helper to add timeout to promises
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Auth timeout')), ms)
            )
        ]);
    };

    try {
        // Verify the user token from request headers (with 5s timeout)
        const tokenResult = await withTimeout(
            whopsdk.verifyUserToken(await headers()),
            5000
        );
        userId = tokenResult.userId;

        // Check if user has access to this company - must be admin (with 5s timeout)
        const access = await withTimeout(
            whopsdk.users.checkAccess(companyId, { id: userId }),
            5000
        );

        if (access.access_level !== "admin") {
            return (
                <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
                    <div className="text-center p-6 max-w-md">
                        <h1 className="text-2xl font-bold mb-2 text-destructive">Access Denied</h1>
                        <p className="text-muted-foreground">
                            You need administrator privileges to access the dashboard view.
                        </p>
                    </div>
                </div>
            );
        }

        // Get user profile information (with 5s timeout)
        const user = await withTimeout(
            whopsdk.users.retrieve(userId),
            5000
        );
        username = user.username || user.name || "Admin";

    } catch (error) {
        // In development, use fallback mock data
        if (isDevelopment) {
            console.warn(
                "⚠️ Whop auth failed or timed out. Using development fallback for Dashboard.",
                "\n   Error:", error instanceof Error ? error.message : error
            );
            userId = DEV_USER.userId;
            username = DEV_USER.username;
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
                    🚧 Development Mode - Using mock admin: {username}
                </div>
            )}
            <DashboardClient
                companyId={companyId}
                userId={userId}
                username={username}
            />
        </>
    );
}
