import React, { useMemo } from 'react';
import { LogType } from '../types';

interface HeatmapProps {
  logs?: any[]; // Accepts array of log entries with timestamps
  onDayClick?: (date: Date, level: number) => void;
  selectedDate?: Date | null;
}

export const Heatmap: React.FC<HeatmapProps> = ({ logs = [], onDayClick, selectedDate }) => {
  // Generate date range: 6 months ago to 12 months in the future
  const { weeks, monthLabels, logMap } = useMemo(() => {
    const today = new Date();
    
    // Create lookup map from logs
    const map = new Map<string, number>();
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        const key = date.toDateString();
        
        // Determine level based on LogType
        let level = 0;
        if (log.type === LogType.REFLECT) level = 1;
        else if (log.type === LogType.REST) level = 2;
        else if (log.type === LogType.WORKOUT) level = 3;

        // Prioritize higher levels if multiple logs exist for the same day
        const current = map.get(key) || 0;
        if (level > current) {
            map.set(key, level);
        }
    });

    // Start 6 months ago
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 6);
    // Align to the previous Sunday (Start of week)
    const dayOfWeek = startDate.getDay(); // 0 = Sunday
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // End 1 year from now
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 12);
    // Add a buffer to ensure we cover the full month of the end date
    endDate.setDate(endDate.getDate() + 14); 

    const weeks = [];
    const tempMonthLabels = [];
    
    // Calculate total weeks needed
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalWeeks = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));

    for (let w = 0; w < totalWeeks; w++) {
        const currentWeek = [];
        let hasFirstOfMonth = false;
        let monthName = '';

        for (let d = 0; d < 7; d++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (w * 7) + d);
            
            // Check map for level
            const key = currentDate.toDateString();
            const level = map.get(key) || 0;
            
            currentWeek.push({
                date: currentDate,
                level: level,
                isToday: currentDate.toDateString() === today.toDateString()
            });

            // Check for month label (if it's the 1st of the month)
            if (currentDate.getDate() === 1) {
                hasFirstOfMonth = true;
                monthName = currentDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            }
        }
        weeks.push(currentWeek);

        if (hasFirstOfMonth) {
            tempMonthLabels.push({
                label: monthName,
                weekIndex: w
            });
        }
    }
    
    return { weeks, monthLabels: tempMonthLabels, logMap: map };
  }, [logs]);

  const getCellColor = (level: number, isSelected: boolean) => {
    // Colors specific to user request:
    // Dark Mode (Requested):
    // 1. Reflection #2F2F2F (Noticeably lighter than black background)
    // 2. Rest Day #5A5A5A (Mid-gray)
    // 3. Workout #9A9A9A (Light gray)
    
    // Light Mode (Adapted for contrast on white background):
    // 1. Reflection: Light Gray (bg-gray-300)
    // 2. Rest: Medium Gray (bg-gray-500)
    // 3. Workout: Dark Gray/Black (bg-gray-800)

    let colorClass = '';
    
    switch (level) {
      case 3: // Workout
        colorClass = 'bg-gray-800 border-gray-800 dark:bg-[#9A9A9A] dark:border-[#9A9A9A]'; 
        break;
      case 2: // Rest
        colorClass = 'bg-gray-500 border-gray-500 dark:bg-[#5A5A5A] dark:border-[#5A5A5A]'; 
        break;
      case 1: // Reflection
        colorClass = 'bg-gray-300 border-gray-300 dark:bg-[#2F2F2F] dark:border-[#2F2F2F]';
        break;
      default: // Default / Empty
        colorClass = 'bg-gray-100 border-gray-100 dark:bg-zinc-900 dark:border-zinc-900';
    }

    if (isSelected) {
        // Use ring for selection
        return `${colorClass} ring-2 ring-black dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-black z-10`;
    }
    
    // Hover states
    if (level > 0) return `${colorClass} hover:opacity-80`;
    return `${colorClass} hover:bg-gray-200 dark:hover:bg-zinc-800 dark:hover:border-zinc-800`;
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const COL_WIDTH_REM = 1.125; // w-3 (0.75) + gap-1.5 (0.375)

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-2">
       <div className="min-w-max flex flex-col gap-1.5">
         
         {/* Month Labels */}
         <div className="flex gap-1.5 items-end mb-1 h-5">
            <div className="w-8 shrink-0" /> {/* Spacer */}
            <div className="relative flex-1 h-full">
                {monthLabels.map((m, i) => (
                    <span 
                        key={i} 
                        className="absolute text-[10px] font-bold text-gray-400 dark:text-zinc-500 font-mono tracking-wider"
                        style={{ left: `${m.weekIndex * COL_WIDTH_REM}rem` }}
                    >
                        {m.label}
                    </span>
                ))}
            </div>
         </div>
         
         {/* Grid */}
         <div className="flex flex-col gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                <div key={dayIndex} className="flex gap-1.5 items-center">
                    <div className="w-8 text-[10px] text-gray-400 dark:text-zinc-600 font-medium text-right pr-2 h-3 leading-3 flex items-center justify-end shrink-0">
                        {dayLabels[dayIndex]}
                    </div>

                    {weeks.map((week, weekIndex) => {
                        const dayData = week[dayIndex];
                        const isSelected = selectedDate && dayData.date.toDateString() === selectedDate.toDateString();
                        
                        return (
                            <div 
                                key={weekIndex}
                                onClick={() => onDayClick && onDayClick(dayData.date, dayData.level)}
                                className={`w-3 h-3 rounded-sm cursor-pointer border transition-all duration-200 ${getCellColor(dayData.level, !!isSelected)}`}
                                title={dayData.date.toDateString()}
                            />
                        );
                    })}
                </div>
            ))}
         </div>
       </div>
    </div>
  );
};