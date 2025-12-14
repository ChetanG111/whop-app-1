import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    icon?: React.ReactNode;
    iconBgClass?: string;
    iconColorClass?: string;
    confirmButtonClass?: string;
    isLoading?: boolean;
}

/**
 * Reusable confirmation dialog component with animations
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    icon,
    iconBgClass = 'bg-rose-100 dark:bg-rose-900/20',
    iconColorClass = 'text-rose-600 dark:text-rose-500',
    confirmButtonClass = 'bg-rose-600 hover:bg-rose-700',
    isLoading = false,
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
                    {icon || <AlertTriangle size={32} />}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors active:scale-95 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 py-3 px-4 rounded-xl ${confirmButtonClass} text-white font-medium transition-colors flex items-center justify-center active:scale-95 disabled:opacity-50`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
