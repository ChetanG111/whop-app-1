import React from 'react';
import { LogType } from '../types';
import { ChevronRight } from 'lucide-react';

interface ActivityCardProps {
  username: string;
  type: LogType;
  workoutType?: string;
  note?: string;
  imageUrl?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  username,
  type,
  workoutType,
  note,
  imageUrl,
  onClick
}) => {
  // Safe type handling to prevent crashes
  const safeType = type || 'Unknown';
  
  let displayType = 'ACTIVITY';
  
  try {
    // Defensive check ensuring values exist before calling methods
    if (safeType === LogType.WORKOUT && workoutType) {
        displayType = String(workoutType).toUpperCase();
    } else {
        displayType = safeType && safeType !== 'Unknown' ? String(safeType).toUpperCase() : 'ACTIVITY';
    }
  } catch (err) {
    displayType = 'ACTIVITY';
  }

  // Configuration for the visual indicator on the right
  let boxContent = null;
  let boxClasses = "w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden";

  if (imageUrl) {
    boxContent = <img src={imageUrl} alt="activity" className="w-full h-full object-cover" />;
    boxClasses += " bg-gray-200 dark:bg-zinc-800";
  } else {
    let bgColor = "bg-gray-200 dark:bg-zinc-800";
    let letter = "";

    switch (safeType) {
      case LogType.WORKOUT:
        bgColor = "bg-[#2dd4bf] text-black"; // Teal/Cyan
        break;
      case LogType.REST:
        bgColor = "bg-[#f87171] text-black"; // Salmon/Red
        break;
      case LogType.REFLECT:
        bgColor = "bg-[#facc15] text-black"; // Yellow
        break;
      default:
        bgColor = "bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white";
    }

    switch (safeType) {
        case LogType.WORKOUT: letter = "W"; break;
        case LogType.REST: letter = "R"; break;
        case LogType.REFLECT: letter = "?"; break;
        default: letter = "-";
    }
    
    boxClasses += ` ${bgColor}`;
    boxContent = <span className="text-4xl font-light font-sans">{letter}</span>;
  }

  return (
    <div 
      onClick={onClick}
      className={`w-full bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all duration-300 shadow-sm group
        hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:-translate-y-1 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 
        ${onClick ? 'cursor-pointer active:scale-[0.98] active:translate-y-0' : ''}
      `}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <h3 className="text-gray-900 dark:text-white font-bold text-lg truncate mb-1">
          {username}: {displayType}
        </h3>
        <p className="text-gray-500 dark:text-zinc-500 text-sm line-clamp-2 leading-relaxed">
          {note || "No note added"}
        </p>

        {/* Expand Text Indicator on Hover */}
        {onClick && (
            <div className="mt-2 flex items-center text-indigo-500 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
               Expand <ChevronRight size={14} className="ml-1" />
            </div>
        )}
      </div>
      
      {/* Visual Indicator */}
      <div className={boxClasses}>
        {boxContent}
      </div>
    </div>
  );
};