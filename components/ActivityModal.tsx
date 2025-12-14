import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Clock, Globe, Lock, ImageOff, Loader2 } from 'lucide-react';
import { ToggleSwitch, ConfirmDialog, InfoDialog } from './ui';
import { useSignedUrl } from '../hooks';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRect: DOMRect | null;
    activity: any;
    onUpdate: (updatedActivity: any) => void;
    onDelete: (id: number) => void;
    currentUsername: string;
    isCoachMode?: boolean;
}

// Sub-component to handle signed URL fetching for images
const ImageSection: React.FC<{ imageUrl?: string }> = ({ imageUrl }) => {
    const signedUrl = useSignedUrl(imageUrl);
    const [isImgLoaded, setIsImgLoaded] = useState(false);

    // Reset loading state when URL changes
    useEffect(() => {
        setIsImgLoaded(false);
    }, [signedUrl]);

    if (!imageUrl) {
        return (
            <div className="w-full p-6 pb-0">
                <div className="w-full h-48 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 gap-3 bg-gray-50 dark:bg-zinc-900/50">
                    <ImageOff size={32} className="opacity-50" />
                    <span className="text-sm font-medium">No image uploaded</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-6 pb-0">
            <div className="w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 relative min-h-[200px]">
                {/* Skeleton loader - shows while fetching signed URL or loading image */}
                {!isImgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 animate-pulse" />
                    </div>
                )}
                {/* Actual image - hidden until loaded */}
                {signedUrl && (
                    <img
                        src={signedUrl}
                        alt="Activity"
                        className={`w-full h-auto max-h-[500px] object-contain mx-auto transition-opacity duration-300 ${isImgLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setIsImgLoaded(true)}
                    />
                )}
            </div>
        </div>
    );
};

export const ActivityModal: React.FC<ActivityModalProps> = ({
    isOpen,
    onClose,
    triggerRect,
    activity,
    onUpdate,
    onDelete,
    currentUsername,
    isCoachMode = false,
}) => {
    const [isRendered, setIsRendered] = useState(false);
    const [animStyles, setAnimStyles] = useState<React.CSSProperties>({});
    const [showContent, setShowContent] = useState(false);

    // Delete Logic States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteError, setShowDeleteError] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toggle Loading States
    const [isUpdatingNote, setIsUpdatingNote] = useState(false);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

    // Modal Animation Effect
    useEffect(() => {
        if (isOpen && triggerRect) {
            setIsRendered(true);
            setShowContent(false);
            setShowDeleteConfirm(false);
            setShowDeleteError(false);
            setIsDeleting(false);

            // Start State: Match the trigger card
            setAnimStyles({
                position: 'fixed',
                top: `${triggerRect.top}px`,
                left: `${triggerRect.left}px`,
                width: `${triggerRect.width}px`,
                height: `${triggerRect.height}px`,
                borderRadius: '1rem',
                opacity: 1,
                zIndex: 50,
                overflow: 'hidden',
                transform: 'none',
                transition: 'none',
            });

            // Animate to Target State
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const viewportW = window.innerWidth;
                    const viewportH = window.innerHeight;
                    const margin = 24;
                    const targetW = Math.min(viewportW - margin * 2, 600);
                    const targetH = Math.min(viewportH - margin * 2, 800);
                    const targetLeft = (viewportW - targetW) / 2;
                    const targetTop = (viewportH - targetH) / 2;

                    setAnimStyles({
                        position: 'fixed',
                        top: `${targetTop}px`,
                        left: `${targetLeft}px`,
                        width: `${targetW}px`,
                        height: `${targetH}px`,
                        borderRadius: '1.5rem',
                        zIndex: 50,
                        opacity: 1,
                        transition: 'all 500ms cubic-bezier(0.32, 0.72, 0, 1)',
                    });

                    setTimeout(() => setShowContent(true), 200);
                });
            });
        } else if (!isOpen && isRendered && triggerRect) {
            // Closing Animation
            setShowContent(false);
            requestAnimationFrame(() => {
                setAnimStyles({
                    position: 'fixed',
                    top: `${triggerRect.top}px`,
                    left: `${triggerRect.left}px`,
                    width: `${triggerRect.width}px`,
                    height: `${triggerRect.height}px`,
                    borderRadius: '1rem',
                    opacity: 0,
                    zIndex: 50,
                    overflow: 'hidden',
                    transition: 'all 400ms cubic-bezier(0.32, 0.72, 0, 1)',
                });
            });

            const timer = setTimeout(() => setIsRendered(false), 400);
            return () => clearTimeout(timer);
        }
    }, [isOpen, triggerRect]);

    if (!isRendered || !activity) return null;

    const isOwner = activity.username === currentUsername;

    // Format date and time
    const dateObj = new Date(activity.timestamp);
    const dateStr = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Handlers
    const handleTryDelete = () => {
        if (isCoachMode) {
            setShowDeleteConfirm(true);
            return;
        }

        const logTime = new Date(activity.timestamp).getTime();
        const diffMins = (Date.now() - logTime) / (1000 * 60);

        if (diffMins > 30) {
            setShowDeleteError(true);
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleConfirmDelete = () => {
        setIsDeleting(true);
        setTimeout(() => onDelete(activity.id), 1500);
    };

    const togglePublicNote = async () => {
        setIsUpdatingNote(true);
        await onUpdate({ ...activity, isPublicNote: !activity.isPublicNote });
        setIsUpdatingNote(false);
    };

    const togglePublicPhoto = async () => {
        setIsUpdatingPhoto(true);
        await onUpdate({ ...activity, isPublicPhoto: !activity.isPublicPhoto });
        setIsUpdatingPhoto(false);
    };

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                style={animStyles}
                className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl pointer-events-auto flex flex-col"
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-900 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {activity.type?.toUpperCase() || 'ACTIVITY'}
                            {activity.workoutType && (
                                <span className="text-gray-400 dark:text-zinc-600 font-normal">
                                    • {activity.workoutType}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-zinc-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> {dateStr}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} /> {timeStr}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div
                    className={`flex-1 overflow-y-auto no-scrollbar p-0 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    {/* Image Section */}
                    <ImageSection imageUrl={activity.imageUrl} />

                    <div className="p-6 space-y-6">
                        {/* Note */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-wider">
                                Note
                            </label>
                            <p className="text-lg text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                                {activity.note || 'No note added.'}
                            </p>
                        </div>

                        {/* Reflection Reason */}
                        {activity.reason && (
                            <div className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-900 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                Reason: {activity.reason}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls - Visible if Owner OR Coach */}
                {(isOwner || isCoachMode) && (
                    <div
                        className={`p-5 border-t border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        {/* Left Side: Toggles Group */}
                        <div className="flex flex-col gap-3 flex-1">
                            {isOwner && !isCoachMode ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <ToggleSwitch
                                            checked={activity.isPublicNote}
                                            onChange={togglePublicNote}
                                            label="Public Note"
                                            icon={<Lock size={16} className="text-gray-400" />}
                                            activeIcon={<Globe size={16} className="text-blue-500" />}
                                            size="sm"
                                            disabled={isUpdatingNote}
                                        />
                                        {isUpdatingNote && (
                                            <Loader2 size={16} className="animate-spin text-indigo-500" />
                                        )}
                                    </div>

                                    {activity.imageUrl && (
                                        <div className="flex items-center gap-2">
                                            <ToggleSwitch
                                                checked={activity.isPublicPhoto}
                                                onChange={togglePublicPhoto}
                                                label="Public Photo"
                                                icon={<Lock size={16} className="text-gray-400" />}
                                                activeIcon={<Globe size={16} className="text-blue-500" />}
                                                size="sm"
                                                disabled={isUpdatingPhoto}
                                            />
                                            {isUpdatingPhoto && (
                                                <Loader2 size={16} className="animate-spin text-indigo-500" />
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                                    Coach Action
                                </span>
                            )}
                        </div>


                        {/* Right Side: Delete Button */}
                        <button
                            onClick={handleTryDelete}
                            className="flex items-center gap-2 px-5 py-3 text-rose-600 dark:text-rose-500 font-medium rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors active:scale-95 text-sm shrink-0"
                        >
                            <Trash2 size={18} />
                            <span>Delete Log</span>
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete this log?"
                    message="This action cannot be undone. This activity will be permanently removed from your history."
                    confirmLabel="Delete"
                    isLoading={isDeleting}
                />

                {/* Time Restriction Error Dialog */}
                <InfoDialog
                    isOpen={showDeleteError}
                    onClose={() => setShowDeleteError(false)}
                    title="Too late to delete"
                    message="You can only delete logs within 30 minutes of creating them. Your time has passed."
                />
            </div>
        </div>
    );
};