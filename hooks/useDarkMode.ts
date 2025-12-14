import { useState, useEffect } from 'react';

/**
 * Hook to manage dark mode state with localStorage persistence
 * and automatic DOM updates
 */
export function useDarkMode(defaultValue: boolean = true): [boolean, () => void] {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(defaultValue);

    // Apply dark mode class to html element
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
    };

    return [isDarkMode, toggleTheme];
}
