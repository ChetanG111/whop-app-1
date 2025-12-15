import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Import fonts
import "../styles/globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

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
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
            <body className="font-sans antialiased">
                <WhopApp>{children}</WhopApp>
            </body>
        </html>
    );
}

