import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: () => void;
    label?: string;
    icon?: React.ReactNode;
    activeIcon?: React.ReactNode;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

/**
 * Reusable toggle switch component with consistent styling
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    label,
    icon,
    activeIcon,
    disabled = false,
    size = 'md',
}) => {
    const switchWidth = size === 'sm' ? 'w-8' : 'w-10';
    const switchHeight = size === 'sm' ? 'h-4' : 'h-5';
    const knobSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    const knobTranslate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

    return (
        <div
            className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`}
            onClick={disabled ? undefined : onChange}
        >
            {/* Label with Icon */}
            {(label || icon) && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                    {checked ? (activeIcon || icon) : icon}
                    {label && <span className="text-sm font-medium">{label}</span>}
                </div>
            )}

            {/* Toggle Track */}
            <div
                className={`${switchWidth} ${switchHeight} rounded-full p-0.5 transition-colors duration-200 ${checked
                        ? 'bg-black dark:bg-white'
                        : 'bg-gray-300 dark:bg-zinc-700'
                    }`}
            >
                {/* Toggle Knob */}
                <div
                    className={`${knobSize} rounded-full shadow-sm transform transition-transform duration-200 ${checked
                            ? `${knobTranslate} bg-white dark:bg-black`
                            : 'translate-x-0 bg-white dark:bg-zinc-400'
                        }`}
                />
            </div>
        </div>
    );
};
