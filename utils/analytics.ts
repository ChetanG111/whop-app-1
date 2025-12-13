import { LogType, LogEntry } from '../types';

export const calculateStreaks = (logs: LogEntry[]) => {
    if (!logs || logs.length === 0) return { current: 0, max: 0 };

    // Filter out reflections as they don't count towards streaks
    const validLogs = logs.filter(log => log.type !== LogType.REFLECT);

    if (validLogs.length === 0) return { current: 0, max: 0 };

    // 1. Get unique dates formatted as YYYY-MM-DD timestamps to ignore time and multiple logs per day
    const uniqueDates = Array.from(new Set(validLogs.map(log => {
        const d = new Date(log.timestamp);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }))).sort((a, b) => b - a); // Descending order (newest first)

    if (uniqueDates.length === 0) return { current: 0, max: 0 };

    // Current Streak Calculation
    const today = new Date();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const yesterdayTime = todayTime - 86400000; // 24 hours in ms

    let current = 0;
    let streakActive = false;

    // Check if the most recent log is today or yesterday to start the streak
    if (uniqueDates[0] === todayTime || uniqueDates[0] === yesterdayTime) {
        streakActive = true;
        current = 1;
    }

    if (streakActive) {
        let previousDate = uniqueDates[0];
        for (let i = 1; i < uniqueDates.length; i++) {
            const diff = previousDate - uniqueDates[i];
            if (diff === 86400000) { // Exactly 1 day difference
                current++;
                previousDate = uniqueDates[i];
            } else {
                break; // Streak broken
            }
        }
    }

    // Max Streak Calculation
    let max = 1;
    let temp = 1;
    // Iterate from newest to oldest
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const diff = uniqueDates[i] - uniqueDates[i + 1];
        if (diff === 86400000) {
            temp++;
        } else {
            max = Math.max(max, temp);
            temp = 1;
        }
    }
    max = Math.max(max, temp);

    return { current, max };
};
