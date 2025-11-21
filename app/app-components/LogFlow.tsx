"use client";
import React, { useState, useRef } from 'react';
import styles from './LogFlow.module.css';
import { motion, AnimatePresence } from 'framer-motion';

interface LogFlowProps {
  onClose: () => void;
  initialError?: string | null;
  onSubmit: (payload: any) => Promise<void>;
  isSubmitting?: boolean;
}

const LogFlow = ({ onClose, initialError, onSubmit, isSubmitting }: LogFlowProps) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selection, setSelection] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isPublicNote, setIsPublicNote] = useState(false);
  const [isPublicPhoto, setIsPublicPhoto] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelection = (type: string) => {
    setSelection(type);
    setTimeout(() => {
      setDirection(1);
      setStep(1);
    }, 200);
  };

  const renderSelectionScreen = () => (
    <div className={styles.selectionScreen}>
      {errorMessage && (
        <div style={{ padding: '12px', backgroundColor: '#E57373', color: '#fff', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}
      <div className={styles.stack}>
        <motion.button
          className={styles.button}
          onClick={() => handleSelection('Workout')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Workout
        </motion.button>
        <motion.button
          className={styles.button}
          onClick={() => handleSelection('Rest')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Rest
        </motion.button>
        <motion.button
          className={styles.button}
          onClick={() => handleSelection('Reflect')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reflect
        </motion.button>
      </div>
    </div>
  );

  const workoutTypes = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full'];

  const renderDetailNoteScreen = () => (
    <div className={styles.screen}>
      <div className={styles.stack}>
        {selection === 'Workout' ? (
          <>
            <motion.button 
              className={styles.select}
              onClick={() => setIsPickerOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {workoutType || 'Select workout type'}
            </motion.button>
            <AnimatePresence>
              {isPickerOpen && (
                <>
                  <motion.div
                    className={styles.pickerBackdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsPickerOpen(false)}
                  />
                  <motion.div
                    className={styles.pickerContainer}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  >
                    <div className={styles.pickerHeader}>
                      <motion.button
                        className={styles.pickerCancel}
                        onClick={() => setIsPickerOpen(false)}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel
                      </motion.button>
                      <span className={styles.pickerTitle}>Workout Type</span>
                      <motion.button
                        className={styles.pickerDone}
                        onClick={() => setIsPickerOpen(false)}
                        whileTap={{ scale: 0.95 }}
                      >
                        Done
                      </motion.button>
                    </div>
                    <div className={styles.pickerOptions}>
                      {workoutTypes.map((type) => (
                        <motion.button
                          key={type}
                          className={`${styles.pickerOption} ${workoutType === type ? styles.pickerOptionActive : ''}`}
                          onClick={() => {
                            setWorkoutType(type);
                            setIsPickerOpen(false);
                          }}
                          whileHover={{ backgroundColor: 'var(--border-subtle)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {type}
                          {workoutType === type && (
                            <motion.div
                              className={styles.pickerCheck}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            >
                              ✓
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        ) : (
          <button className={styles.secondaryButton}>{selection}</button>
        )}
        <textarea className={styles.input} placeholder="Insert note" value={note} onChange={(e) => setNote(e.target.value)}></textarea>
        <div className={styles.row}>
          <span>Public Note</span>
          <div className={`${styles.toggle} ${isPublicNote ? styles.toggleOn : ''}`} onClick={() => setIsPublicNote(!isPublicNote)}></div>
        </div>
      </div>
      <div className={styles.footer}>
        <motion.button
          className={styles.navArrow}
          onClick={() => {
            setDirection(-1);
            setStep(0);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <div style={{ width: '56px' }} />
        <motion.button
          className={styles.fab}
          onClick={() => {
            setDirection(1);
            setStep(2);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPhotoScreen = () => (
    <div className={styles.screen}>
      <div className={styles.stack}>
        <div
          className={uploadedImage ? styles.dashedBoxWithImage : styles.dashedBox}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadedImage ? (
            <img src={uploadedImage} alt="Uploaded" className={styles.uploadedImage} />
          ) : (
            <p>Tap here to upload photo</p>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <div className={styles.row}>
          <span>Public Photo</span>
          <div className={`${styles.toggle} ${isPublicPhoto ? styles.toggleOn : ''}`} onClick={() => setIsPublicPhoto(!isPublicPhoto)}></div>
        </div>
      </div>
      <div className={styles.footer}>
        <motion.button
          className={styles.navArrow}
          onClick={() => {
            setDirection(-1);
            setStep(1);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <div style={{ width: '56px' }} />
        <motion.button
          className={styles.primaryMini}
          onClick={async () => {
            const payload: any = {
              type: selection,
              note: note,
              sharedNote: isPublicNote,
              timestamp: new Date().toISOString(),
            };
            if (selection === 'Workout') {
              payload.muscleGroup = workoutType;
              payload.sharedPhoto = isPublicPhoto;
            } else {
              payload.sharedPhoto = false;
            }
            await onSubmit(payload);
            onClose();
          }}
          disabled={isSubmitting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSubmitting ? 'Logging...' : 'Log'}
        </motion.button>
      </div>
    </div>
  );

  const screens = [renderSelectionScreen(), renderDetailNoteScreen(), renderPhotoScreen()];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <motion.div
      className={styles.modalBackdrop}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1] }}
    >
      <div className={styles.modalContent}>
        <motion.button
          className={styles.closeButton}
          onClick={onClose}
          whileHover={{ scale: 1.05, opacity: 0.8 }}
          whileTap={{ scale: 0.9, opacity: 0.7 }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            >
              {screens[step]}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className={styles.persistentDots}>
          <motion.span 
            className={styles.dot}
            animate={{ 
              backgroundColor: step === 0 ? 'var(--text-primary)' : 'transparent',
              scale: step === 0 ? 1.3 : 1
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.span 
            className={styles.dot}
            animate={{ 
              backgroundColor: step === 1 ? 'var(--text-primary)' : 'transparent',
              scale: step === 1 ? 1.3 : 1
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.span 
            className={styles.dot}
            animate={{ 
              backgroundColor: step === 2 ? 'var(--text-primary)' : 'transparent',
              scale: step === 2 ? 1.3 : 1
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LogFlow;