import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { X, Settings, ChevronRight, User, ChevronLeft, Moon, Edit2, Camera, Sun, Trash2, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    triggerRect: DOMRect | null;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

type ViewState = 'MAIN' | 'EDIT_PROFILE' | 'SETTINGS';

interface MenuOptionProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

const MenuOption: React.FC<MenuOptionProps> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-700 group"
    >
        <div className="flex items-center gap-4 relative z-10">
            <div className="text-gray-500 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                {icon}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        </div>
        <ChevronRight size={20} className="text-gray-400 dark:text-zinc-600 group-hover:text-gray-600 dark:group-hover:text-zinc-400 transition-colors duration-200" />
    </button>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, onUpdateProfile, triggerRect, isDarkMode, toggleTheme }) => {
    const [view, setView] = useState<ViewState>('MAIN');
    const [tempName, setTempName] = useState(profile.name);
    const [tempBio, setTempBio] = useState(profile.bio);
    const [tempAvatar, setTempAvatar] = useState(profile.avatar);

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Animation State
    const [isRendered, setIsRendered] = useState(false);
    const [animStyles, setAnimStyles] = useState<React.CSSProperties>({});

    const nameInputRef = useRef<HTMLInputElement>(null);
    const bioInputRef = useRef<HTMLTextAreaElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        if (isOpen && triggerRect) {
            setIsRendered(true);
            setView('MAIN'); // Reset view
            setShowDeleteConfirm(false);
            setIsDeleting(false);

            // Start State
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
                transition: 'none',
                overflow: 'hidden'
            });

            // Target State
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const viewportW = window.innerWidth;
                    const viewportH = window.innerHeight;

                    // Target Dimensions (Floating Card Style)
                    const margin = 24;
                    const targetW = Math.min(viewportW - (margin * 2), 450);
                    const targetH = Math.min(viewportH * 0.8, 800);

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
                        // Slow start, fast snap end
                        transition: 'all 450ms cubic-bezier(0.5, 0, 0.1, 1)',
                        overflow: 'hidden'
                    });
                });
            });
        } else if (!isOpen && isRendered && triggerRect) {
            // Reverse Animation
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

            const timer = setTimeout(() => setIsRendered(false), 350);
            return () => clearTimeout(timer);
        }
    }, [isOpen, triggerRect]);


    // Sync temp state
    useEffect(() => {
        if (view === 'EDIT_PROFILE') {
            setTempName(profile.name);
            setTempBio(profile.bio);
            setTempAvatar(profile.avatar);
        }
    }, [view, profile]);

    const handleSaveProfile = () => {
        onUpdateProfile({
            ...profile,
            name: tempName,
            bio: tempBio,
            avatar: tempAvatar
        });
        setView('MAIN');
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmDelete = () => {
        setIsDeleting(true);
        // Simulate delete operation with animation
        setTimeout(() => {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            // In a real app, this would delete data and probably logout/redirect
        }, 2000);
    };

    const isSubView = view !== 'MAIN';

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
                <div className="flex-1 overflow-hidden relative">
                    {/* Sliding Container */}
                    <div
                        className="flex w-[200%] h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        style={{ transform: `translateX(-${isSubView ? 50 : 0}%)` }}
                    >
                        {/* === LEFT PANEL: MAIN VIEW === */}
                        <div className="w-1/2 h-full flex flex-col">
                            <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h2>
                                <button onClick={onClose} className="text-gray-400 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors active:scale-90">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 pt-4 flex flex-col items-center flex-1 overflow-y-auto no-scrollbar">
                                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 overflow-hidden mb-4 shadow-xl">
                                    <img src={profile.avatar} alt="Me" className="w-full h-full object-cover" />
                                </div>
                                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">{profile.name}</h1>
                                <p className="text-gray-500 dark:text-zinc-400 text-center mb-8">{profile.bio}</p>

                                <div className="w-full space-y-3">
                                    <MenuOption
                                        icon={<User size={20} />}
                                        label="Edit Profile"
                                        onClick={() => setView('EDIT_PROFILE')}
                                    />
                                    <MenuOption
                                        icon={<Settings size={20} />}
                                        label="App Settings"
                                        onClick={() => setView('SETTINGS')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* === RIGHT PANEL: SUB VIEWS (Edit / Settings) === */}
                        <div className="w-1/2 h-full flex flex-col bg-white dark:bg-zinc-950">

                            {/* Header for Sub View */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                                <div className="flex items-center">
                                    <button onClick={() => setView('MAIN')} className="mr-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors active:scale-90">
                                        <ChevronLeft size={24} />
                                    </button>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {view === 'EDIT_PROFILE' ? 'Edit Profile' : 'App Settings'}
                                    </h2>
                                </div>
                                {view === 'EDIT_PROFILE' && (
                                    <button
                                        onClick={handleSaveProfile}
                                        className="px-6 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 hover:scale-105 active:scale-95 shadow-md transition-all duration-200"
                                    >
                                        Save
                                    </button>
                                )}
                            </div>

                            {/* Content for Sub View */}
                            <div className="p-6 flex flex-col items-center overflow-y-auto no-scrollbar flex-1">

                                {view === 'EDIT_PROFILE' && (
                                    <div className="w-full flex flex-col items-center">
                                        <div
                                            className="relative mb-8 group cursor-pointer"
                                            onClick={() => avatarInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={avatarInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                            />
                                            <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 overflow-hidden shadow-xl">
                                                <img src={tempAvatar} alt="Me" className="w-full h-full object-cover opacity-100 group-hover:opacity-60 transition-opacity" />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md transform group-hover:scale-110 duration-200" />
                                            </div>
                                        </div>

                                        <div className="w-full space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider ml-1">Display Name</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        ref={nameInputRef}
                                                        type="text"
                                                        value={tempName}
                                                        onChange={(e) => setTempName(e.target.value)}
                                                        className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-0 focus:border-2 focus:border-dotted focus:border-black dark:focus:border-white transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider ml-1">Bio</label>
                                                <div className="flex items-start gap-3">
                                                    <textarea
                                                        ref={bioInputRef}
                                                        value={tempBio}
                                                        onChange={(e) => setTempBio(e.target.value)}
                                                        className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-0 focus:border-2 focus:border-dotted focus:border-black dark:focus:border-white transition-all resize-none h-24"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {view === 'SETTINGS' && (
                                    <div className="w-full">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-4">Appearance</h3>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-300">
                                                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
                                            </div>

                                            {/* Toggle Switch */}
                                            <button
                                                onClick={toggleTheme}
                                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-white' : 'bg-gray-300'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white'}`} />
                                            </button>
                                        </div>

                                        <div className="mt-8">
                                            <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-4">Data</h3>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-xl group transition-all duration-200 hover:bg-rose-100 dark:hover:bg-rose-900/20 active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-500">
                                                        <Trash2 size={20} />
                                                    </div>
                                                    <span className="font-medium text-rose-700 dark:text-rose-400">Delete All Data</span>
                                                </div>
                                                <ChevronRight size={20} className="text-rose-300 dark:text-rose-700 group-hover:text-rose-500 dark:group-hover:text-rose-500 transition-colors duration-200" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/60 dark:bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in">
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-500">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete all data?</h3>
                            <p className="text-gray-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                                This action cannot be undone. All your workout logs, streaks, and profile settings will be permanently removed.
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
                                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors flex items-center justify-center active:scale-95"
                                >
                                    {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};