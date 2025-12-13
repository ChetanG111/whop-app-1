import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
    title: "FitComm Tracker",
    description: "Fitness Community Tracker - Built for Whop",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <WhopApp>{children}</WhopApp>
            </body>
        </html>
    );
}
