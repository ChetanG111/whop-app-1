import { redirect } from "next/navigation";

export default function HomePage() {
    // Redirect to a default experience page or show a landing page
    // For embedded apps, users typically access via /experiences/[experienceId]
    return (
        <div className="h-screen w-full flex items-center justify-center bg-black text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">FitComm Tracker</h1>
                <p className="text-gray-400">This app is designed to be embedded within Whop.</p>
                <p className="text-gray-500 text-sm mt-4">Access this app through your Whop community.</p>
            </div>
        </div>
    );
}
