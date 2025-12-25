import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LogType, UserProfile, WorkoutType } from './types';
import { LogModal } from './components/LogModal';
import { ProfileModal } from './components/ProfileModal';
import { HeatmapModal } from './components/HeatmapModal';
import { ActivityModal } from './components/ActivityModal';
// FeedView removed - community pages hidden
import { YouView } from './components/YouView';
import { ErrorToast } from './components/ui';

// Animated icons from animate-ui
import { Plus as AnimatedPlus } from './components/animate-ui/icons/plus';
import { User as AnimatedUser } from './components/animate-ui/icons/user';

import { LogEntry } from './types';

// Props interface for Whop integration
interface AppProps {
  userId?: string;
  username?: string;
  isCoachMode?: boolean;
  experienceId?: string;
  // Data from useAppData hook
  feedItems?: LogEntry[];
  myActivities?: LogEntry[];
  userProfile?: { name: string; bio: string; avatar: string };
  streak?: { current: number; longest: number } | null;
  // Handlers
  onCreateCheckin?: (data: any) => Promise<boolean>;
  onUpdateCheckin?: (id: string, updates: any) => Promise<boolean>;
  onDeleteCheckin?: (id: string) => Promise<boolean>;
  onUpdateProfile?: (updates: any) => Promise<void>;
  // Loading states
  isLoading?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
}

const App: React.FC<AppProps> = ({
  userId,
  username = 'User',
  isCoachMode: initialCoachMode = false,
  experienceId,
  // Data from parent
  feedItems: propFeedItems = [],
  myActivities: propMyActivities = [],
  userProfile: propUserProfile,
  streak,
  // Handlers from parent
  onCreateCheckin,
  onUpdateCheckin,
  onDeleteCheckin,
  onUpdateProfile,
  // Loading states
  isLoading = false,
  isSubmitting = false,
  error,
}) => {
  // Community feed view removed - always show "You" view
  // const [activeView, setActiveView] = useState<ViewState>(ViewState.YOU);
  // isCoachMode is controlled by the prop from server (Whop access level or DEV_IS_ADMIN)
  const isCoachMode = initialCoachMode;

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHeatmapModalOpen, setIsHeatmapModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Error display state - syncs with error prop and can be dismissed
  const [displayError, setDisplayError] = useState<string | null>(null);

  // Sync displayError with error prop from parent
  useEffect(() => {
    if (error) {
      setDisplayError(error);
    }
  }, [error]);

  // Track trigger element positions for morph animations
  const [logTriggerRect, setLogTriggerRect] = useState<DOMRect | null>(null);
  const [profileTriggerRect, setProfileTriggerRect] = useState<DOMRect | null>(null);
  const [heatmapTriggerRect, setHeatmapTriggerRect] = useState<DOMRect | null>(null);
  const [activityTriggerRect, setActivityTriggerRect] = useState<DOMRect | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const logButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Use profile from props or fallback to default
  const [userProfile, setUserProfile] = useState<{ name: string; bio: string; avatar: string }>({
    name: username,
    bio: '',
    avatar: ''
  });

  // Sync profile from props
  useEffect(() => {
    if (propUserProfile) {
      setUserProfile(propUserProfile);
    }
  }, [propUserProfile]);

  // Use data from props
  const feedItems = propFeedItems;
  const myActivities = propMyActivities;

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isLogModalOpen || isProfileModalOpen || isHeatmapModalOpen || isActivityModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLogModalOpen, isProfileModalOpen, isHeatmapModalOpen, isActivityModalOpen]);

  const handleLog = async (data: any) => {
    if (onCreateCheckin) {
      // Use API handler - all logs are private (no community feed)
      const success = await onCreateCheckin({
        type: data.type,
        workoutType: data.workoutType,
        reflectReason: data.reason,
        note: data.note,
        photoFile: data.photoFile, // Pass the File object for upload
      });
      if (success) {
        setIsLogModalOpen(false);
      }
    } else {
      // Fallback for when no handler provided (shouldn't happen)
      setIsLogModalOpen(false);
    }
  };

  const handleUpdateActivity = async (updatedActivity: any) => {
    // Optimistic Update: Update UI immediately
    setSelectedActivity(updatedActivity);
    // Note: Public toggles removed - no community feed
  };

  const handleDeleteActivity = async (id: string | number) => {
    if (onDeleteCheckin) {
      await onDeleteCheckin(id.toString());
    }
    setIsActivityModalOpen(false);
  };

  // Open log modal immediately
  const openLogModal = useCallback(() => {
    if (logButtonRef.current) {
      setLogTriggerRect(logButtonRef.current.getBoundingClientRect());
    }
    setIsLogModalOpen(true);
  }, []);

  // Open profile modal immediately
  const openProfileModal = useCallback(() => {
    if (profileButtonRef.current) {
      setProfileTriggerRect(profileButtonRef.current.getBoundingClientRect());
    }
    setIsProfileModalOpen(true);
  }, []);

  const openHeatmapModal = (rect: DOMRect) => {
    setHeatmapTriggerRect(rect);
    setIsHeatmapModalOpen(true);
  };

  const openActivityModal = (activity: any, rect: DOMRect) => {
    setSelectedActivity(activity);
    setActivityTriggerRect(rect);
    setIsActivityModalOpen(true);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleProfileUpdate = async (profile: { name: string; bio: string; avatar: string }) => {
    setUserProfile(profile);
    if (onUpdateProfile) {
      await onUpdateProfile(profile);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative flex flex-col overflow-hidden font-sans transition-colors duration-500">

      {/* Error Toast - displays user-facing errors at the top */}
      <ErrorToast
        message={displayError}
        onDismiss={() => setDisplayError(null)}
        duration={6000}
      />

      {/* Main Member Content - Experience View always shows member UI */}
      {/* Community feed removed - only showing personal "You" view */}
      <main className="flex-1 w-full relative pt-6 overflow-hidden">
        <div className="h-full overflow-y-auto no-scrollbar">
          <YouView
            onOpenHeatmap={openHeatmapModal}
            onActivityClick={openActivityModal}
            userProfile={userProfile}
            activities={myActivities}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 w-full max-w-sm px-4 pointer-events-none">

        {/* Profile Button (Left) - Animated User Icon (hover animation) */}
        <button
          ref={profileButtonRef}
          onClick={openProfileModal}
          className={`w-12 h-12 rounded-[2rem] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-brand-600 dark:text-brand-400 pointer-events-auto shadow-xl hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-300 overflow-hidden ${isProfileModalOpen ? 'opacity-0' : 'opacity-100'}`}
        >
          <AnimatedUser
            size={24}
            animateOnHover
          />
        </button>

        {/* Center space - Feed/You navigation pill removed */}
        <div className="flex-1" />

        {/* Plus Button (Right) - Animated Plus Icon (hover animation) */}
        <button
          ref={logButtonRef}
          onClick={openLogModal}
          className={`w-12 h-12 rounded-[2rem] bg-black dark:bg-zinc-900 border border-transparent dark:border-zinc-800 flex items-center justify-center text-white dark:text-brand-400 pointer-events-auto shadow-xl hover:bg-zinc-800 active:scale-95 transition-all duration-300 ${isLogModalOpen ? 'opacity-0' : 'opacity-100'}`}
        >
          <AnimatedPlus
            size={26}
            animateOnHover
            animation="x"
          />
        </button>
      </div>

      {/* Modals */}
      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLog={handleLog}
        triggerRect={logTriggerRect}
        userProfile={userProfile}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onUpdateProfile={handleProfileUpdate}
        triggerRect={profileTriggerRect}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <HeatmapModal
        isOpen={isHeatmapModalOpen}
        onClose={() => setIsHeatmapModalOpen(false)}
        triggerRect={heatmapTriggerRect}
        logs={myActivities}
        onActivityClick={openActivityModal}
      />

      {/* Shared Activity Details Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        triggerRect={activityTriggerRect}
        activity={selectedActivity}
        onUpdate={handleUpdateActivity}
        onDelete={handleDeleteActivity}
        currentUsername={userProfile.name}
        isCoachMode={isCoachMode}
      />

    </div>
  );
};

export default App;