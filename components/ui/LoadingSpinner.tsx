import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

/**
 * A premium animated loading spinner with rotating dots
 * Features smooth animations and optional loading message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    message = 'Loading...'
}) => {
    // Size configurations
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const dotSizes = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fadeIn w-full">
            {/* Spinner Container */}
            <div className={`relative ${sizeClasses[size]}`}>
                {/* Rotating dots */}
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 flex items-start justify-center"
                        style={{
                            transform: `rotate(${i * 45}deg)`,
                        }}
                    >
                        <div
                            className={`${dotSizes[size]} rounded-full bg-brand-500 dark:bg-brand-400`}
                            style={{
                                animation: `spinnerFade 1s ease-in-out infinite`,
                                animationDelay: `${i * 0.125}s`,
                                opacity: 0.2,
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Loading message */}
            {message && (
                <p className="mt-6 text-sm font-medium text-gray-500 dark:text-zinc-400 animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
};

/**
 * A content area loading indicator - displays where content will appear
 * More subtle than the spinner, meant for inline loading states
 */
export const LoadingContent: React.FC<{ message?: string }> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            {/* Three bouncing dots */}
            <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full bg-brand-500 dark:bg-brand-400"
                        style={{
                            animation: 'bounce 1.4s ease-in-out infinite',
                            animationDelay: `${i * 0.16}s`,
                        }}
                    />
                ))}
            </div>

            {message && (
                <p className="mt-4 text-sm font-medium text-gray-400 dark:text-zinc-500">
                    {message}
                </p>
            )}
        </div>
    );
};

// Add keyframes to global styles (these should be in your CSS, but defining inline for reference)
// You may need to add these to your tailwind config or global CSS:
/*
@keyframes spinnerFade {
    0%, 100% { opacity: 0.2; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
*/
