import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Check } from 'lucide-react';
import { LogType, WorkoutType, UserProfile } from '../types';
import { ActivityCard } from './ActivityCard';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (data: any) => void;
  triggerRect: DOMRect | null;
  userProfile: UserProfile;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onLog, triggerRect, userProfile }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<LogType | null>(null);
  const [workoutType, setWorkoutType] = useState<WorkoutType>(WorkoutType.PUSH);
  const [reflectReason, setReflectReason] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [isPublicNote, setIsPublicNote] = useState<boolean>(false);
  const [isPublicPhoto, setIsPublicPhoto] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Animation state
  const [isRendered, setIsRendered] = useState(false);
  const [animStyles, setAnimStyles] = useState<React.CSSProperties>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (isOpen && triggerRect) {
      setIsRendered(true);
      
      // Reset Content State
      setStep(1);
      setSelectedType(null);
      setWorkoutType(WorkoutType.PUSH);
      setReflectReason(null);
      setNote('');
      setIsPublicNote(false);
      setIsPublicPhoto(false);
      setPhotoPreview(null);
      setIsDropdownOpen(false);

      // Start State: Match the trigger button EXACTLY
      setAnimStyles({
        position: 'fixed',
        top: `${triggerRect.top}px`,
        left: `${triggerRect.left}px`,
        width: `${triggerRect.width}px`,
        height: `${triggerRect.height}px`,
        borderRadius: '9999px',
        opacity: 0,
        zIndex: 50,
        transform: 'scale(1)',
        transition: 'none', // Snap to start
        overflow: 'hidden'
      });

      // Force reflow and animate to Target State
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            
            // Target Dimensions (Floating Card Style)
            // Use 450px max width, or viewport width minus margins
            const margin = 24;
            const targetW = Math.min(viewportW - (margin * 2), 450);
            const targetH = Math.min(viewportH - (margin * 2), 800);
            
            // Center horizontally and vertically
            const targetLeft = (viewportW - targetW) / 2;
            const targetTop = (viewportH - targetH) / 2;

            setAnimStyles({
                position: 'fixed',
                top: `${targetTop}px`,
                left: `${targetLeft}px`,
                width: `${targetW}px`,
                height: `${targetH}px`,
                borderRadius: '1.5rem',
                opacity: 1,
                zIndex: 50,
                transform: 'scale(1)',
                // Slow start, fast snap end (Slow-Fast)
                transition: 'all 450ms cubic-bezier(0.5, 0, 0.1, 1)',
                overflow: 'hidden'
            });
        });
      });
    } else if (!isOpen && isRendered && triggerRect) {
        // Animate Out: Back to Trigger Rect
        requestAnimationFrame(() => {
             setAnimStyles({
                position: 'fixed',
                top: `${triggerRect.top}px`,
                left: `${triggerRect.left}px`,
                width: `${triggerRect.width}px`,
                height: `${triggerRect.height}px`,
                borderRadius: '9999px',
                opacity: 0,
                zIndex: 50,
                transform: 'scale(1)',
                transition: 'all 350ms cubic-bezier(0.5, 0, 0.1, 1)',
                overflow: 'hidden'
            });
        });

        const timer = setTimeout(() => {
            setIsRendered(false);
        }, 350);
        return () => clearTimeout(timer);
    }
  }, [isOpen, triggerRect]);

  // Handle outside click for dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsDropdownOpen(false);
          }
      };
      if (isDropdownOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [isDropdownOpen]);

  const handleTypeSelect = (type: LogType) => {
    setSelectedType(type);
    setReflectReason(null); // Reset reason when switching type
    setStep(2);
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFinalLog = () => {
    onLog({
      type: selectedType,
      workoutType: selectedType === LogType.WORKOUT ? workoutType : undefined,
      reason: selectedType === LogType.REFLECT ? reflectReason : undefined,
      note,
      isPublicNote,
      photo: photoPreview,
      isPublicPhoto
    });
    onClose();
  };
  
  // Validation checks for proceeding
  const canProceed = () => {
      if (step === 1 && !selectedType) return false;
      // If Reflect, must have a reason selected
      if (step === 2 && selectedType === LogType.REFLECT && !reflectReason) {
          return false;
      }
      return true;
  };

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Content - Animated Wrapper */}
      <div 
        style={animStyles}
        className="bg-white dark:bg-zinc-950 flex flex-col border-2 border-gray-200 dark:border-zinc-800 shadow-2xl pointer-events-auto transition-colors duration-300"
      >
        
        {/* Header - Close Button on Right */}
        <div className="flex items-center justify-end p-6 bg-white dark:bg-zinc-950 z-10 shrink-0 transition-colors duration-300 relative">
          <button onClick={onClose} className="text-gray-400 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors active:scale-90">
            <X size={24} />
          </button>
        </div>

        {/* Sliding Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            className="flex w-[400%] h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: `translateX(-${(step - 1) * 25}%)` }}
          >
            {/* STEP 1: Select Type */}
            <div className="w-1/4 h-full px-6 pb-6 overflow-y-auto no-scrollbar flex flex-col space-y-4 justify-center">
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">What are we tracking?</h2>
                {[LogType.WORKOUT, LogType.REST, LogType.REFLECT].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="w-full py-6 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm text-lg font-medium text-gray-900 dark:text-white
                    hover:scale-[1.02] hover:shadow-lg hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 active:scale-[0.98]"
                  >
                    {type}
                  </button>
                ))}
            </div>

            {/* STEP 2: Notes & Details */}
            <div className="w-1/4 h-full px-6 pb-6 overflow-y-auto no-scrollbar">
                <div className="flex flex-col space-y-6 py-4 h-full">
                  {/* Custom Dropdown for Workout Type */}
                  {selectedType === LogType.WORKOUT && (
                    <div className="flex flex-col space-y-2 relative z-20">
                      <label className="text-gray-500 dark:text-zinc-400 text-sm ml-1">Select workout type</label>
                      
                      <div ref={dropdownRef} className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full bg-gray-50 dark:bg-zinc-900 border ${isDropdownOpen ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10' : 'border-gray-200 dark:border-zinc-800'} rounded-xl px-4 py-4 text-left text-gray-900 dark:text-white font-medium flex items-center justify-between transition-all duration-200`}
                        >
                            <span>{workoutType}</span>
                            <ChevronRight className={`transition-transform duration-300 ${isDropdownOpen ? '-rotate-90' : 'rotate-90'}`} size={20} />
                        </button>
                        
                        {/* Dropdown Options */}
                        <div 
                            className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden transition-all duration-200 origin-top ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                        >
                            <div className="max-h-[240px] overflow-y-auto no-scrollbar p-1">
                                {Object.values(WorkoutType).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setWorkoutType(t);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                            workoutType === t 
                                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                                                : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        {t}
                                        {workoutType === t && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason Selector for Reflection */}
                  {selectedType === LogType.REFLECT && (
                      <div className="flex flex-col space-y-2">
                        <label className="text-gray-500 dark:text-zinc-400 text-sm ml-1">Reason</label>
                        <div className="flex flex-wrap gap-2">
                          {['Busy', 'Sick', 'Low Energy', 'Other'].map((r) => (
                            <button
                              key={r}
                              onClick={() => {
                                setReflectReason(r);
                                // If "Other" is selected, auto-focus the note input
                                if (r === 'Other') {
                                    setTimeout(() => noteInputRef.current?.focus(), 50);
                                }
                              }}
                              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all active:scale-95 ${
                                reflectReason === r 
                                  ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                                  : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                  )}

                  <div className="flex flex-col space-y-2 flex-1 relative z-10">
                    <label className="text-gray-500 dark:text-zinc-400 text-sm ml-1">Insert note</label>
                    <textarea
                      ref={noteInputRef}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="How did it go?"
                      className="w-full h-full min-h-[160px] bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-0 focus:border-2 focus:border-dotted focus:border-black dark:focus:border-white transition-all shadow-sm"
                    />
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setIsPublicNote(!isPublicNote)}>
                    <span className="text-gray-900 dark:text-white">Public Note</span>
                    <button
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isPublicNote ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${isPublicNote ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-0 bg-white dark:bg-black'}`} />
                    </button>
                  </div>
                </div>
            </div>

            {/* STEP 3: Photo */}
            <div className="w-1/4 h-full px-6 pb-6 overflow-y-auto no-scrollbar">
                <div className="flex flex-col space-y-6 h-full py-4">
                    <div 
                      onClick={triggerFileInput}
                      className="w-full flex-1 min-h-[300px] bg-gray-50 dark:bg-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-900/80 transition-all relative overflow-hidden group active:scale-[0.99]"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                      />
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 dark:text-zinc-500 group-hover:text-gray-500 dark:group-hover:text-zinc-400">
                          <Camera size={48} className="mb-4" />
                          <span className="font-medium">Tap to upload photo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setIsPublicPhoto(!isPublicPhoto)}>
                      <span className="text-gray-900 dark:text-white">Public Photo</span>
                      <button
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isPublicPhoto ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-zinc-700'}`}
                      >
                        <div className={`w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${isPublicPhoto ? 'translate-x-6 bg-white dark:bg-black' : 'translate-x-0 bg-white dark:bg-black'}`} />
                      </button>
                    </div>
                </div>
            </div>

            {/* STEP 4: Preview */}
            <div className="w-1/4 h-full px-6 pb-6 overflow-y-auto no-scrollbar flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Preview</h2>
                <div className="w-full max-w-sm pointer-events-none">
                    <ActivityCard
                        username={userProfile.name}
                        type={selectedType!}
                        workoutType={selectedType === LogType.WORKOUT ? workoutType : undefined}
                        note={note}
                        imageUrl={photoPreview || undefined}
                    />
                </div>
                <div className="mt-8 text-center animate-in fade-in duration-500">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {isPublicNote || isPublicPhoto ? 'Publicly visible' : 'Private log only'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                        {isPublicNote || isPublicPhoto ? 'Your community will see this update.' : 'Only you can see this in your history.'}
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 pt-0 flex justify-between items-center bg-white dark:bg-zinc-950 shrink-0 transition-colors duration-300 relative">
           
           {/* Back Button */}
           <div className="w-12 h-12 flex items-center justify-center">
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors active:scale-90"
              >
                <ChevronLeft size={24} />
              </button>
            )}
           </div>

           {/* Flow Dots (Centered in Footer) */}
           <div className="absolute left-1/2 -translate-x-1/2 flex gap-3">
              <div className="relative flex gap-3">
                  {[1, 2, 3, 4].map((s) => (
                    <div 
                      key={s}
                      className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-zinc-700 bg-transparent"
                    />
                  ))}
                  {/* Animated Active Dot - The "thingy" */}
                  <div 
                    className="absolute top-0 left-0 w-2.5 h-2.5 rounded-full bg-black dark:bg-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{
                        transform: `translateX(${(step - 1) * 1.375}rem)` // 1.375rem = gap-3 (0.75rem) + w-2.5 (0.625rem)
                    }}
                  />
              </div>
           </div>

           {/* Next / Log Button */}
           <div className="w-auto h-12 flex items-center justify-end">
            {step === 4 ? (
              <button 
                onClick={handleFinalLog}
                className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-lg hover:opacity-80 transition-colors shadow-lg active:scale-95 whitespace-nowrap"
              >
                Log
              </button>
            ) : (
               <button 
                onClick={handleNext}
                disabled={!canProceed()}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors active:scale-90 ${
                    canProceed() 
                    ? 'bg-gray-100 dark:bg-zinc-900 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800'
                    : 'bg-gray-50 dark:bg-zinc-900/50 text-gray-300 dark:text-zinc-700 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={24} />
              </button>
            )}
           </div>
        </div>

      </div>
    </div>
  );
};