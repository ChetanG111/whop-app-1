'use client';
import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import Heatmap from '../../app-components/Heatmap';
import LogFlow from '../../app-components/LogFlow';
import ProfileView from '../../app-components/ProfileView';
import ActivityCard from '../../app-components/ActivityCard';
import { useSwipeable } from 'react-swipeable';

const MemoActivityCard = memo(ActivityCard);

const YourActivityPage = ({ user }: { user: any }) => {
  const params = useParams();
  const experienceId = params?.experienceId as string;
  const [activeView, setActiveView] = useState('You');
  const [pillStyle, setPillStyle] = useState({});
  const feedRef = useRef<HTMLButtonElement>(null);
  const youRef = useRef<HTMLButtonElement>(null);
  const [isLogFlowOpen, setIsLogFlowOpen] = useState(false);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  // Mock data for UI demonstration
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '5%' : '-5%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '5%' : '-5%',
      opacity: 0,
    }),
  };
  const transition = {
    type: "spring" as const,
    bounce: 0.3,
    duration: 0.2,
  };
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setDirection(1);
      setActiveView('You');
    },
    onSwipedRight: () => {
      setDirection(-1);
      setActiveView('Feed');
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });
  useEffect(() => {
    const activeRef = activeView === 'Feed' ? feedRef : youRef;
    if (activeRef.current) {
      setPillStyle({
        width: activeRef.current.offsetWidth,
        left: activeRef.current.offsetLeft,
      });
    }
  }, [activeView]);
  const handleLogSubmit = async (payload: any) => {
    const createLog = (thumbnail: string) => {
      const newLog = {
        id: Date.now(),
        thumbnail,
        title: `${user?.username || 'User'}: ${payload.muscleGroup || payload.type}`,
        description: payload.note || 'No notes',
        sharedNote: payload.sharedNote,
        sharedPhoto: payload.sharedPhoto,
      };
      setUserLogs(prev => [newLog, ...prev]);
      setFeedLogs(prev => [newLog, ...prev]);
    };

    if (payload.uploadedImage instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        createLog(reader.result as string);
      };
      reader.readAsDataURL(payload.uploadedImage);
    } else {
      const placeholder = payload.type === 'Workout'
        ? 'https://dummyimage.com/120x120/3DD9D9/0F1419.png&text=W'
        : payload.type === 'Rest'
        ? 'https://dummyimage.com/120x120/E57373/0F1419.png&text=R'
        : 'https://dummyimage.com/120x120/D4C5B0/0F1419.png&text=Ref';
      createLog(placeholder);
    }
  };
  const handleProfileSave = (data: { name: string; goals: string }) => {
    console.log('Profile saved:', data);
    console.log('User ID:', user?.id);
  };
  const renderYouView = () => {
    return (
      <motion.div
        key="you"
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className={styles.view}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 className={styles.pageTitle}>Your Activity</h1>
          {user && (
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {user.username || user.email}
            </div>
          )}
        </div>
        <Heatmap />
        <AnimatePresence mode='popLayout'>
          <div className={styles.cardList}>
            {userLogs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '32px' }}>
                No activity yet. Tap + to log your first workout!
              </p>
            ) : (
              userLogs.map((activity: any, i: number) => (
                <div key={activity.id} className={styles.cardListItem}>
                  <MemoActivityCard activity={activity} index={i} isPublicView={false} />
                </div>
              ))
            )}
          </div>
        </AnimatePresence>
      </motion.div>
    );
  };
  const renderFeedView = () => {
    return (
      <motion.div
        key="feed"
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className={styles.view}
      >
        <h1 className={styles.pageTitle}>Public Feed</h1>
        <div className={styles.cardList}>
          {feedLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '32px' }}>
              No public posts yet. Share your workouts to appear here!
            </p>
          ) : (
            feedLogs.map((activity: any, i: number) => (
              <div key={activity.id} className={styles.cardListItem}>
                <MemoActivityCard activity={activity} index={i} isPublicView={true} />
              </div>
            ))
          )}
        </div>
      </motion.div>
    );
  };
  return (
    <div className={styles.container}>
      {checkinError && (
        <div style={{ 
          position: 'fixed', 
          top: '16px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000, 
          padding: '12px 24px', 
          backgroundColor: '#E57373', 
          color: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          {checkinError}
        </div>
      )}
      <div {...handlers} className={styles.swipeContainer}>
        <AnimatePresence mode="wait" custom={direction}>
          {activeView === 'You' ? renderYouView() : renderFeedView()}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isLogFlowOpen && (
          <LogFlow 
            onClose={() => setIsLogFlowOpen(false)} 
            onSubmit={handleLogSubmit}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProfileViewOpen && (
          <ProfileView 
            onClose={() => setIsProfileViewOpen(false)}
            onSave={handleProfileSave}
            initialName={user?.username || ''}
          />
        )}
      </AnimatePresence>
      <div className={styles.bottomNav}>
        <motion.button 
          className={styles.navIcon} 
          whileTap={{ scale: 0.9, opacity: 0.8 }} 
          onClick={() => setIsProfileViewOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <div className={styles.centerPillContainer}>
          <motion.div className={styles.activePill} animate={pillStyle} transition={{ duration: 0.2, ease: 'easeOut' }} />
          <button 
            ref={feedRef} 
            className={styles.navItem} 
            onClick={() => { setDirection(-1); setActiveView('Feed'); }} 
            style={{ color: activeView === 'Feed' ? '#0F1419' : '#9CA3AF' }}
          >
            Feed
          </button>
          <button 
            ref={youRef} 
            className={styles.navItem} 
            onClick={() => { setDirection(1); setActiveView('You'); }} 
            style={{ color: activeView === 'You' ? '#0F1419' : '#9CA3AF' }}
          >
            You
          </button>
        </div>
        <motion.button
          className={styles.navIcon}
          whileTap={{ scale: 0.9, opacity: 0.8 }}
          onClick={() => setIsLogFlowOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
};
export default YourActivityPage;