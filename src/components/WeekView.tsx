import React from 'react';
import { useApp } from '../App';
import { DAYS_OF_WEEK } from '../constants';
import type { ClassEntry, TimeFormat } from '../types';
import { timeToMinutes, formatTime, getSlotColorStyle } from '../utils';
import { LocationIcon, TagIcon } from './icons';

const START_HOUR = 8;
const END_HOUR = 21; // Use 21 (9 PM) to ensure the 8 PM hour block is fully visible
const NUM_HOURS = END_HOUR - START_HOUR;

const WeekView: React.FC = () => {
    const { timetable, isLoading, timeFormat } = useApp();
    const days = DAYS_OF_WEEK.filter(d => d !== "Sunday"); // Monday to Saturday

    // Time labels for the columns (X-axis)
    const timeLabels = Array.from({ length: NUM_HOURS }, (_, i) => {
        const hour = START_HOUR + i;
        return formatTime(`${hour}:00`, '12h-condensed' as TimeFormat);
    });

    const calculateGridPosition = (entry: ClassEntry) => {
        // Row is determined by the day
        const dayIndex = days.indexOf(entry.day);
        if (dayIndex === -1) return null;

        const startMinutes = timeToMinutes(entry.startTime);
        const endMinutes = timeToMinutes(entry.endTime);

        // Check if the class is within the visible time range
        if (startMinutes < START_HOUR * 60 || endMinutes > END_HOUR * 60) return null;

        // Column is determined by the time
        const startOffset = startMinutes - START_HOUR * 60;
        const duration = endMinutes - startMinutes;
        
        // +2 because grid columns are 1-indexed and we have a day label column
        const colStart = Math.floor(startOffset / 30) + 2;
        const colSpan = Math.max(1, Math.round(duration / 30));

        return {
            gridRow: dayIndex + 2, // +2 for 1-based index and header row
            gridColumn: `${colStart} / span ${colSpan}`
        };
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading your timetable...</div>;
    }

    return (
        <div className="space-y-8 px-4 sm:px-0">
            <div className="animate-fade-in-up">
                <h2 className="text-3xl font-bold tracking-tight text-text-base sm:text-4xl">Weekly Schedule</h2>
                <p className="mt-2 text-lg text-text-muted">Here's your entire week at a glance.</p>
            </div>
            
            <div className="bg-surface rounded-lg shadow-lg border border-border-color overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[1300px] relative" style={{
                        display: 'grid',
                        gridTemplateColumns: `100px repeat(${NUM_HOURS * 2}, minmax(45px, 1fr))`,
                        gridTemplateRows: `60px repeat(${days.length}, minmax(110px, auto))`
                    }}>
                        {/* Top-left corner box */}
                        <div className="sticky top-0 left-0 z-30 bg-surface border-b border-r border-border-color"></div>

                        {/* Time Headers (X-axis) */}
                        {Array.from({ length: NUM_HOURS }).map((_, i) => (
                             <div key={`time-header-${i}`} className="sticky top-0 z-20 bg-surface text-center font-bold p-3 border-b border-r border-border-color text-text-base" style={{ gridColumn: `${i * 2 + 2} / span 2`}}>
                                {timeLabels[i]}
                            </div>
                        ))}
                        
                        {/* Day Labels (Y-axis) */}
                        {days.map((day, index) => (
                            <div key={day} className="sticky left-0 z-20 bg-surface text-center font-bold p-3 border-b border-r border-border-color text-text-base flex items-center justify-center" style={{ gridRow: index + 2 }}>
                                {day}
                            </div>
                        ))}

                        {/* Background Grid Lines */}
                        <div className="col-start-2 col-span-full row-start-2 row-span-full grid" style={{gridTemplateColumns: `repeat(${NUM_HOURS * 2}, 1fr)`}}>
                            {Array.from({ length: NUM_HOURS * 2 }).map((_, i) => (
                                <div key={`vline-${i}`} className="border-r border-border-color"></div>
                            ))}
                        </div>
                         <div className="row-start-2 row-span-full col-start-2 col-span-full grid" style={{gridTemplateRows: `repeat(${days.length}, 1fr)`}}>
                             {Array.from({ length: days.length }).map((_, i) => (
                                <div key={`hline-${i}`} className="border-b border-border-color"></div>
                            ))}
                        </div>
                        
                        {/* Class Entries */}
                        {Object.values(timetable).flat().map((entry: ClassEntry) => {
                            const pos = calculateGridPosition(entry);
                            if (!pos) return null;
                            const colors = getSlotColorStyle(entry.slot);
                            const finalFormat = timeFormat === '12h' ? '12h-condensed' as TimeFormat : timeFormat;

                            return (
                                <div key={entry.id} style={pos} className={`relative z-10 flex flex-col p-2 rounded-md text-xs overflow-hidden ${colors.bg} ${colors.text} ${colors.darkText} m-0.5 border-l-4 ${colors.border} shadow-sm hover:shadow-lg hover:z-20`}>
                                    <p className="font-bold text-sm mb-1 truncate">{entry.subject}</p>
                                    <div className="space-y-0.5 text-[11px] leading-tight flex-grow min-w-0">
                                        <p className="flex items-start">
                                            <LocationIcon className="w-3 h-3 mr-1.5 flex-shrink-0 mt-0.5"/>
                                            <span className="truncate">{entry.venue}</span>
                                        </p>
                                        <p className="flex items-start">
                                            <TagIcon className="w-3 h-3 mr-1.5 flex-shrink-0 mt-0.5"/>
                                            <span className="truncate">{entry.slot}</span>
                                        </p>
                                    </div>
                                    <p className="font-medium opacity-90 pt-1 text-[11px]">
                                        {formatTime(entry.startTime, finalFormat)} - {formatTime(entry.endTime, finalFormat)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeekView;