import React, { useState, useRef, useEffect } from 'react';
import { Plus, User, Repeat, LayoutList } from 'lucide-react';
import { ViewState, LogType, UserProfile } from './types';
import { LogModal } from './components/LogModal';
import { ProfileModal } from './components/ProfileModal';
import { HeatmapModal } from './components/HeatmapModal';
import { ActivityModal } from './components/ActivityModal';
import { CoachDashboard } from './components/CoachDashboard';
import { FeedView } from './components/FeedView';
import { YouView } from './components/YouView';
import { getDaysAgo } from './utils/date';



const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.FEED);
  const [isCoachMode, setIsCoachMode] = useState(false);

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

  // Lifted state for User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Sarah Doe',
    bio: 'Consistency is key 🔑',
    avatar: 'https://picsum.photos/200/200'
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // State for Feed Items
  const [feedItems, setFeedItems] = useState([
    // Changed first item to today (0 days ago) so the new indicator shows 1
    { id: 1, username: 'chetan07', type: LogType.WORKOUT, workoutType: 'LEGS', note: 'bitcoin', photoUrl: null, timestamp: getDaysAgo(0), isPublicNote: true, isPublicPhoto: false },
    { id: 2, username: 'chetan07', type: LogType.WORKOUT, workoutType: 'PUSH', note: 'restarted after a long time', photoUrl: null, timestamp: getDaysAgo(2), isPublicNote: true, isPublicPhoto: false },
    { id: 3, username: 'chetan07', type: LogType.REST, note: 'coool coool', photoUrl: null, timestamp: getDaysAgo(3), isPublicNote: true, isPublicPhoto: false },
    { id: 4, username: 'sarah_d', type: LogType.WORKOUT, workoutType: 'PULL', note: 'Back and biceps on fire!', photoUrl: 'https://picsum.photos/200/200?random=1', timestamp: getDaysAgo(4), isPublicNote: true, isPublicPhoto: true },
    { id: 5, username: 'mike_fit', type: LogType.REFLECT, note: 'Thinking about my goals for next month.', photoUrl: null, timestamp: getDaysAgo(5), isPublicNote: true, isPublicPhoto: false },
  ]);

  // State for User Activities (Mock Data with Timestamps)
  const [myActivities, setMyActivities] = useState([
    { id: 101, username: 'Sarah Doe', type: LogType.WORKOUT, workoutType: 'UPPER', note: 'Great pump today! Bench press PB.', photoUrl: 'https://picsum.photos/200/200?random=10', timestamp: getDaysAgo(1), isPublicNote: true, isPublicPhoto: true },
    { id: 102, username: 'Sarah Doe', type: LogType.REST, note: 'Active recovery day. Went for a hike.', photoUrl: null, timestamp: getDaysAgo(2), isPublicNote: false, isPublicPhoto: false },
    { id: 103, username: 'Sarah Doe', type: LogType.WORKOUT, workoutType: 'LEGS', note: 'Leg day... walking is going to be hard tomorrow.', photoUrl: null, timestamp: getDaysAgo(3), isPublicNote: true, isPublicPhoto: false },
    { id: 104, username: 'Sarah Doe', type: LogType.REFLECT, note: 'Feeling stronger this week compared to last.', photoUrl: null, timestamp: getDaysAgo(6), isPublicNote: false, isPublicPhoto: false },
    { id: 105, username: 'Sarah Doe', type: LogType.WORKOUT, workoutType: 'CARDIO', note: 'Morning Run.', photoUrl: null, timestamp: getDaysAgo(9), isPublicNote: false, isPublicPhoto: false },
    { id: 106, username: 'Sarah Doe', type: LogType.WORKOUT, workoutType: 'PULL', note: 'Back day.', photoUrl: null, timestamp: getDaysAgo(10), isPublicNote: false, isPublicPhoto: false },
    { id: 107, username: 'Sarah Doe', type: LogType.REST, note: 'Rest.', photoUrl: null, timestamp: getDaysAgo(13), isPublicNote: false, isPublicPhoto: false },
    { id: 108, username: 'Sarah Doe', type: LogType.REFLECT, note: 'Weekly check-in.', photoUrl: null, timestamp: getDaysAgo(16), isPublicNote: false, isPublicPhoto: false },
  ]);

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

  const handleLog = (data: any) => {
    const newActivity = {
      id: Date.now(),
      username: userProfile.name,
      type: data.type,
      workoutType: data.workoutType,
      reason: data.reason,
      note: data.note,
      photoUrl: data.photo,
      timestamp: new Date(), // Current timestamp
      isPublicNote: data.isPublicNote,
      isPublicPhoto: data.isPublicPhoto
    };

    // Always add to 'You' page
    setMyActivities(prev => [newActivity, ...prev]);

    // Add to 'Feed' page only if public note or public photo is toggled
    if (data.isPublicNote || data.isPublicPhoto) {
      setFeedItems(prev => [newActivity, ...prev]);
    }
  };

  const handleUpdateActivity = (updatedActivity: any) => {
    // 1. Update Personal List
    setMyActivities(prev => prev.map(item => item.id === updatedActivity.id ? updatedActivity : item));

    // 2. Handle Feed Logic
    const isPublic = updatedActivity.isPublicNote || updatedActivity.isPublicPhoto;

    setFeedItems(prev => {
      const exists = prev.some(item => item.id === updatedActivity.id);

      if (isPublic) {
        if (exists) {
          // Update existing
          return prev.map(item => item.id === updatedActivity.id ? updatedActivity : item);
        } else {
          // Add new (and sort by timestamp descending)
          const newFeed = [updatedActivity, ...prev];
          return newFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } else {
        // Remove if it exists but is no longer public
        return prev.filter(item => item.id !== updatedActivity.id);
      }
    });

    // Also update the selected activity to reflect changes in the modal immediately
    setSelectedActivity(updatedActivity);
  };

  const handleDeleteActivity = (id: number) => {
    // Remove from My Activities
    setMyActivities(prev => prev.filter(item => item.id !== id));

    // Remove from Feed
    setFeedItems(prev => prev.filter(item => item.id !== id));

    setIsActivityModalOpen(false);
  };

  const openLogModal = () => {
    if (logButtonRef.current) {
      setLogTriggerRect(logButtonRef.current.getBoundingClientRect());
    }
    setIsLogModalOpen(true);
  };

  const openProfileModal = (fromHeader = false) => {
    const ref = profileButtonRef; // Always use bottom bar ref as fallback
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

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative flex flex-col overflow-hidden font-sans transition-colors duration-500">

      {/* Coach/Member Toggle Switch (Fixed - Remains visible) */}
      <button
        onClick={() => setIsCoachMode(!isCoachMode)}
        className="fixed bottom-6 right-6 z-[60] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white px-4 py-2.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 font-medium text-sm flex items-center gap-2"
      >
        <Repeat size={16} className="text-indigo-500" />
        {isCoachMode ? 'Switch to Member' : 'Switch to Coach'}
      </button>

      {/* Conditional Rendering without 3D Animation */}
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
            onUpdateProfile={setUserProfile}
            triggerRect={profileTriggerRect}
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
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