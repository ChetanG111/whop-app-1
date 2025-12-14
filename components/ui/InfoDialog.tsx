import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface InfoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonLabel?: string;
    icon?: React.ReactNode;
    iconBgClass?: string;
    iconColorClass?: string;
}

/**
 * Reusable info/error dialog component with animations
 * Used for displaying messages without action (e.g., "Too late to delete")
 */
export const InfoDialog: React.FC<InfoDialogProps> = ({
    isOpen,
    onClose,
    title,
    message,
    buttonLabel = 'Understood',
    icon,
    iconBgClass = 'bg-gray-100 dark:bg-zinc-800',
    iconColorClass = 'text-gray-500 dark:text-zinc-400',
}) => {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsVisible(true));
            });
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <div
            className={`absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/60 dark:bg-black/60 backdrop-blur-md transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            <div
                className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center transition-all duration-300 ${isVisible
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-8 scale-95'
                    }`}
            >
                {/* Icon */}
                <div
                    className={`w-16 h-16 ${iconBgClass} rounded-full flex items-center justify-center mb-4 ${iconColorClass}`}
                >
                    {icon || <Clock size={32} />}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                    {message}
                </p>

                {/* Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity active:scale-95"
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
};
