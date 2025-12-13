import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Clock, Globe, Lock, AlertTriangle, ImageOff } from 'lucide-react';

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

export const ActivityModal: React.FC<ActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  triggerRect, 
  activity, 
  onUpdate, 
  onDelete,
  currentUsername,
  isCoachMode = false
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [animStyles, setAnimStyles] = useState<React.CSSProperties>({});
  const [showContent, setShowContent] = useState(false);
  
  // Delete Logic States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete Animation States
  const [deleteConfirmRendered, setDeleteConfirmRendered] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteErrorRendered, setDeleteErrorRendered] = useState(false);
  const [deleteErrorVisible, setDeleteErrorVisible] = useState(false);

  // Handle Delete Confirmation Animations
  useEffect(() => {
    if (showDeleteConfirm) {
        setDeleteConfirmRendered(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setDeleteConfirmVisible(true));
        });
    } else {
        setDeleteConfirmVisible(false);
        const timer = setTimeout(() => setDeleteConfirmRendered(false), 300);
        return () => clearTimeout(timer);
    }
  }, [showDeleteConfirm]);

  // Handle Delete Error Animations
  useEffect(() => {
    if (showDeleteError) {
        setDeleteErrorRendered(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setDeleteErrorVisible(true));
        });
    } else {
        setDeleteErrorVisible(false);
        const timer = setTimeout(() => setDeleteErrorRendered(false), 300);
        return () => clearTimeout(timer);
    }
  }, [showDeleteError]);

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
        borderRadius: '1rem', // Match ActivityCard border radius
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

          // Target dimensions (Centered Modal)
          const margin = 24;
          const targetW = Math.min(viewportW - (margin * 2), 600); // Slightly wider for reading
          const targetH = Math.min(viewportH - (margin * 2), 800);
          
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

  const handleTryDelete = () => {
    // Coach can always delete, bypasses time check
    if (isCoachMode) {
        setShowDeleteConfirm(true);
        return;
    }

    const logTime = new Date(activity.timestamp).getTime();
    const now = Date.now();
    const diffMins = (now - logTime) / (1000 * 60);

    // Condition: Within 30 minutes
    if (diffMins > 30) {
        setShowDeleteError(true);
    } else {
        setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
      setIsDeleting(true);
      setTimeout(() => {
          onDelete(activity.id);
      }, 1500);
  };

  const togglePublicNote = () => {
      onUpdate({ ...activity, isPublicNote: !activity.isPublicNote });
  };

  const togglePublicPhoto = () => {
      onUpdate({ ...activity, isPublicPhoto: !activity.isPublicPhoto });
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        style={animStyles}
        className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl pointer-events-auto flex flex-col"
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-900 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {activity.type?.toUpperCase() || 'ACTIVITY'}
                    {activity.workoutType && <span className="text-gray-400 dark:text-zinc-600 font-normal">• {activity.workoutType}</span>}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {dateStr}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {timeStr}</span>
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
        <div className={`flex-1 overflow-y-auto p-0 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Image Section */}
            <div className="w-full p-6 pb-0">
                {activity.imageUrl ? (
                    <div className="w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800">
                        <img 
                            src={activity.imageUrl} 
                            alt="Activity" 
                            className="w-full h-auto max-h-[500px] object-contain mx-auto" 
                        />
                    </div>
                ) : (
                    <div className="w-full h-48 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 gap-3 bg-gray-50 dark:bg-zinc-900/50">
                        <ImageOff size={32} className="opacity-50" />
                        <span className="text-sm font-medium">No image uploaded</span>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* Note */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-wider">Note</label>
                    <p className="text-lg text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                        {activity.note || "No note added."}
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
            <div className={`p-5 border-t border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4 transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Left Side: Toggles Group - Only visible for Owner when NOT in Coach Mode */}
                <div className="flex flex-col gap-2 flex-1">
                    {isOwner && !isCoachMode ? (
                        <>
                        <div 
                            className="flex items-center gap-3 cursor-pointer group w-fit"
                            onClick={togglePublicNote}
                        >
                            <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                                {activity.isPublicNote ? <Globe size={16} className="text-blue-500" /> : <Lock size={16} className="text-gray-400" />}
                                <span className="text-sm font-medium">Public Note</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${activity.isPublicNote ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white dark:bg-black shadow-sm transform transition-transform duration-200 ${activity.isPublicNote ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        {activity.imageUrl && (
                            <div 
                                className="flex items-center gap-3 cursor-pointer group w-fit"
                                onClick={togglePublicPhoto}
                            >
                                <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                                    {activity.isPublicPhoto ? <Globe size={16} className="text-blue-500" /> : <Lock size={16} className="text-gray-400" />}
                                    <span className="text-sm font-medium">Public Photo</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${activity.isPublicPhoto ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white dark:bg-black shadow-sm transform transition-transform duration-200 ${activity.isPublicPhoto ? 'translate-x-4' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        )}
                        </>
                    ) : (
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Coach Action</span>
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

        {/* Delete Confirmation Overlay - With Animation */}
        {deleteConfirmRendered && (
            <div 
                className={`absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/60 dark:bg-black/60 backdrop-blur-md transition-all duration-300 ${deleteConfirmVisible ? 'opacity-100' : 'opacity-0'}`}
            >
                <div 
                    className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center transition-all duration-300 ${deleteConfirmVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                >
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-500">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete this log?</h3>
                    <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                        This action cannot be undone. This activity will be permanently removed from your history.
                    </p>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmDelete}
                            className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 flex items-center justify-center active:scale-95"
                        >
                             {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Time Restriction Error Overlay - With Animation */}
        {deleteErrorRendered && (
             <div 
                className={`absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/60 dark:bg-black/60 backdrop-blur-md transition-all duration-300 ${deleteErrorVisible ? 'opacity-100' : 'opacity-0'}`}
            >
                <div 
                    className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center transition-all duration-300 ${deleteErrorVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}
                >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-gray-500 dark:text-zinc-400">
                        <Clock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Too late to delete</h3>
                    <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                        You can only delete logs within 30 minutes of creating them. Your time has passed.
                    </p>
                    
                    <button 
                        onClick={() => setShowDeleteError(false)}
                        className="w-full py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity active:scale-95"
                    >
                        Understood
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};