import React, { useState, useRef, useEffect } from 'react';
import { Plus, User, LayoutList } from 'lucide-react';
import { ViewState, LogType, UserProfile, WorkoutType } from './types';
import { LogModal } from './components/LogModal';
import { ProfileModal } from './components/ProfileModal';
import { HeatmapModal } from './components/HeatmapModal';
import { ActivityModal } from './components/ActivityModal';
import { CoachDashboard } from './components/CoachDashboard';
import { FeedView } from './components/FeedView';
import { YouView } from './components/YouView';

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
  const [activeView, setActiveView] = useState<ViewState>(ViewState.FEED);
  // isCoachMode is controlled by the prop from server (Whop access level or DEV_IS_ADMIN)
  const isCoachMode = initialCoachMode;

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHeatmapModalOpen, setIsHeatmapModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

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
      // Use API handler
      const success = await onCreateCheckin({
        type: data.type,
        workoutType: data.workoutType,
        reflectReason: data.reason,
        note: data.note,
        isPublicNote: data.isPublicNote,
        photo: data.photo,
        isPublicPhoto: data.isPublicPhoto,
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
    if (onUpdateCheckin) {
      await onUpdateCheckin(updatedActivity.id.toString(), {
        isPublicNote: updatedActivity.isPublicNote,
        isPublicPhoto: updatedActivity.isPublicPhoto,
      });
    }
    // Update selected activity to reflect changes in modal immediately
    setSelectedActivity(updatedActivity);
  };

  const handleDeleteActivity = async (id: number) => {
    if (onDeleteCheckin) {
      await onDeleteCheckin(id.toString());
    }
    setIsActivityModalOpen(false);
  };

  const openLogModal = () => {
    if (logButtonRef.current) {
      setLogTriggerRect(logButtonRef.current.getBoundingClientRect());
    }
    setIsLogModalOpen(true);
  };

  const openProfileModal = (fromHeader = false) => {
    const ref = profileButtonRef;
    if (ref.current) {
      setProfileTriggerRect(ref.current.getBoundingClientRect());
    }
    setIsProfileModalOpen(true);
  };

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

      {/* Conditional Rendering based on Coach/Member mode */}
      {isCoachMode ? (
        <CoachDashboard
          items={feedItems}
          onActivityClick={openActivityModal}
        />
      ) : (
        <>
          {/* Main Member Content */}
          <main className="flex-1 w-full relative pt-6 overflow-hidden">
            <div
              className={`flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${activeView === ViewState.FEED ? 'translate-x-0' : '-translate-x-1/2'
                }`}
            >
              {/* Feed Section */}
              <div className="w-1/2 h-full overflow-y-auto no-scrollbar">
                <FeedView items={feedItems} onActivityClick={openActivityModal} />
              </div>

              {/* You Section */}
              <div className="w-1/2 h-full overflow-y-auto no-scrollbar">
                <YouView
                  onOpenHeatmap={openHeatmapModal}
                  onActivityClick={openActivityModal}
                  userProfile={userProfile}
                  activities={myActivities}
                />
              </div>
            </div>
          </main>

          {/* Bottom Navigation Bar - Member Only - Updated Colors */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 w-full max-w-sm px-4 pointer-events-none">

            {/* Profile Button (Left) - Indigo Icon */}
            <button
              ref={profileButtonRef}
              onClick={() => openProfileModal(false)}
              className={`w-12 h-12 rounded-[2rem] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 pointer-events-auto shadow-xl hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-90 transition-all duration-300 overflow-hidden ${isProfileModalOpen ? 'opacity-0' : 'opacity-100'}`}
            >
              <User size={24} />
            </button>

            {/* Center Pill Switch with Sliding Animation - Coach Colors */}
            <div className="flex-1 flex justify-center pointer-events-auto">
              <div className="relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[2rem] p-1.5 flex items-center shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 active:scale-95 transition-transform duration-200">
                {/* Sliding Background - Indigo Tint */}
                <div
                  className={`absolute top-1.5 bottom-1.5 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/30 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]`}
                  style={{
                    width: 'calc(50% - 6px)',
                    left: activeView === ViewState.FEED ? '6px' : 'calc(50% + 0px)'
                  }}
                />

                <button
                  onClick={() => setActiveView(ViewState.FEED)}
                  className={`relative z-10 w-20 sm:w-24 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === ViewState.FEED ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <LayoutList size={18} />
                  Feed
                </button>
                <button
                  onClick={() => setActiveView(ViewState.YOU)}
                  className={`relative z-10 w-20 sm:w-24 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${activeView === ViewState.YOU ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <User size={18} />
                  You
                </button>
              </div>
            </div>

            {/* Plus Button (Right) - Black BG/White Icon */}
            <button
              ref={logButtonRef}
              onClick={openLogModal}
              className={`w-12 h-12 rounded-[2rem] bg-black dark:bg-zinc-900 border border-transparent dark:border-zinc-800 flex items-center justify-center text-white dark:text-indigo-400 pointer-events-auto shadow-xl hover:bg-zinc-800 active:scale-90 transition-all duration-300 ${isLogModalOpen ? 'opacity-0' : 'opacity-100'}`}
            >
              <Plus size={26} />
            </button>
          </div>

          {/* Member Specific Modals */}
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
        </>
      )}

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