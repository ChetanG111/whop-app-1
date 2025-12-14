import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ErrorToastProps {
    message: string | null;
    onDismiss: () => void;
    /** Duration in ms before auto-dismiss. Set to 0 to disable auto-dismiss. Default: 5000 */
    duration?: number;
}

/**
 * Error toast component that appears at the top of the screen.
 * Shows user-facing error messages (e.g., "You already checked in today").
 * Features a clean, muted design with smooth animations.
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({
    message,
    onDismiss,
    duration = 5000,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (message) {
            setIsRendered(true);
            // Trigger enter animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsVisible(true));
            });

            // Auto-dismiss timer
            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleDismiss();
                }, duration);
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [message, duration]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsRendered(false);
            onDismiss();
        }, 300);
    };

    if (!isRendered) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <div
                className="pointer-events-auto max-w-md w-full bg-white dark:bg-zinc-900 
                           border border-red-200 dark:border-red-900/50 
                           rounded-xl shadow-lg 
                           flex items-center gap-3 px-4 py-3"
            >
                {/* Error Icon */}
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                </div>

                {/* Message */}
                <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {message}
                </p>

                {/* Dismiss Button */}
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 w-7 h-7 rounded-full 
                               bg-gray-100 dark:bg-zinc-800 
                               hover:bg-gray-200 dark:hover:bg-zinc-700 
                               flex items-center justify-center 
                               text-gray-500 dark:text-gray-400 
                               hover:text-gray-700 dark:hover:text-gray-200
                               transition-colors duration-200 
                               active:scale-90"
                    aria-label="Dismiss error"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
