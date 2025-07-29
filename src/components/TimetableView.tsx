import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import type { ClassEntry, TimeFormat } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { timeToMinutes, formatTime, getSlotColorStyle } from '../utils';
import { ClockIcon, LocationIcon, BookOpenIcon, CheckCircleIcon, TagIcon } from './icons';

// --- Live Time Hook ---
const useLiveTime = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};


// --- Sub-components ---
const ClassCard: React.FC<{ 
    entry: ClassEntry; 
    timeFormat: TimeFormat; 
    isCompleted: boolean; 
    style?: React.CSSProperties;
    completionStyle?: 'default' | 'separated';
}> = ({ entry, timeFormat, isCompleted, style, completionStyle = 'default' }) => {
    
    const colors = getSlotColorStyle(entry.slot);

    const borderClass = isCompleted 
        ? (completionStyle === 'separated' ? 'border-red-500' : 'border-green-500') 
        : colors.border;
    
    const iconColorClass = isCompleted 
        ? (completionStyle === 'separated' ? 'text-red-500' : 'text-green-500')
        : 'text-primary';

    const icon = isCompleted 
        ? <CheckCircleIcon className={`w-6 h-6 mr-2 ${iconColorClass}`} />
        : <BookOpenIcon className={`w-6 h-6 mr-2 ${iconColorClass}`} />;
    
    const slotColorClass = `${colors.bg} ${colors.text} ${colors.darkText}`;

    return (
        <div
            className={`bg-surface rounded-lg shadow-md overflow-hidden transition-all duration-300 animate-fade-in-up border border-border-color ${isCompleted && completionStyle === 'default' ? 'opacity-70' : ''} ${!isCompleted ? 'transform hover:scale-105' : ''}`}
            style={style}
        >
            <div className={`p-5 border-l-4 ${borderClass}`}>
                <div className="flex justify-between items-start">
                    <h3 className={`text-xl font-bold text-text-base flex items-center ${isCompleted ? 'line-through' : ''}`}>
                        {icon}
                        {entry.subject}
                    </h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isCompleted ? 'bg-gray-500/10 text-gray-500' : slotColorClass}`}>
                      {entry.slot}
                    </span>
                </div>
                <div className="mt-4 space-y-2 text-text-muted">
                    <p className="flex items-center"><ClockIcon className="w-5 h-5 mr-2 text-text-muted/70" /> {formatTime(entry.startTime, timeFormat)} - {formatTime(entry.endTime, timeFormat)}</p>
                    <p className="flex items-center"><LocationIcon className="w-5 h-5 mr-2 text-text-muted/70" /> {entry.venue}</p>
                </div>
            </div>
        </div>
    );
};

const FreeDayDisplay: React.FC = () => {
    return (
        <div className="text-center p-8 bg-surface rounded-lg shadow-lg animate-fade-in-up border border-border-color">
            <h2 className="text-2xl font-bold text-text-base mb-4">No classes today! 🎉</h2>
            <p className="text-lg text-text-muted">Enjoy your day off or use the time to catch up on your studies.</p>
        </div>
    );
};

const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    labelOn: string;
    labelOff: string;
}> = ({ checked, onChange, labelOn, labelOff }) => (
    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onChange(!checked)}>
        <span className={`text-sm font-medium ${!checked ? 'text-primary' : 'text-text-muted'}`}>{labelOff}</span>
        <div className={`relative inline-block w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${checked ? 'transform translate-x-5' : ''}`}></span>
        </div>
        <span className={`text-sm font-medium ${checked ? 'text-primary' : 'text-text-muted'}`}>{labelOn}</span>
    </div>
);

const calculateFreeSlots = (classes: ClassEntry[]) => {
    const dayStart = timeToMinutes("08:00");
    const dayEnd = timeToMinutes("20:00");
    const lunchStart = timeToMinutes("13:00");
    const lunchEnd = timeToMinutes("14:00");

    let busySlots = classes.map(c => ({
        start: timeToMinutes(c.startTime),
        end: timeToMinutes(c.endTime),
    }));
    busySlots.push({ start: lunchStart, end: lunchEnd });
    busySlots.sort((a, b) => a.start - b.start);
    
    const mergedSlots: {start: number, end: number}[] = [];
    if(busySlots.length > 0) {
        mergedSlots.push({...busySlots[0]});
        for(let i = 1; i < busySlots.length; i++) {
            const last = mergedSlots[mergedSlots.length - 1];
            const current = busySlots[i];
            if(current.start < last.end) {
                last.end = Math.max(last.end, current.end);
            } else {
                mergedSlots.push({...current});
            }
        }
    }

    const freeSlots: {start: string, end: string}[] = [];
    let currentTime = dayStart;

    const minutesToTime = (minutes: number): string => {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    mergedSlots.forEach(slot => {
        if(slot.start > currentTime) {
            freeSlots.push({ start: minutesToTime(currentTime), end: minutesToTime(slot.start) });
        }
        currentTime = Math.max(currentTime, slot.end);
    });

    if(currentTime < dayEnd) {
        freeSlots.push({ start: minutesToTime(currentTime), end: minutesToTime(dayEnd) });
    }
    
    return freeSlots;
}

// --- Main View Component ---
const TimetableView: React.FC = () => {
  const { timetable, isLoading, timeFormat, setTimeFormat } = useApp();
  const now = useLiveTime();
  const todayIndex = now.getDay();
  const todayName = DAYS_OF_WEEK[todayIndex];

  const todaysClasses = useMemo(() => {
    return (timetable[todayName] || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, todayName]);
  
  const nowInMinutes = now.getHours() * 60 + now.getMinutes();
  
  const completedClasses = useMemo(() => {
    return todaysClasses.filter(c => timeToMinutes(c.endTime) <= nowInMinutes);
  }, [todaysClasses, nowInMinutes]);
  
  const allTodayClassesCompleted = useMemo(() => {
    return todaysClasses.length > 0 && todaysClasses.every(c => timeToMinutes(c.endTime) <= nowInMinutes);
  }, [todaysClasses, nowInMinutes]);


  const freeSlots = useMemo(() => calculateFreeSlots(todaysClasses), [todaysClasses]);

  if (isLoading) {
    return <div className="text-center p-8">Loading your timetable...</div>;
  }

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-text-base sm:text-4xl">
                Today's Schedule <span className="text-primary">({todayName})</span>
              </h2>
              <p className="mt-2 text-lg text-text-muted">Here's what your day looks like. Stay organized!</p>
            </div>
            <ToggleSwitch
                checked={timeFormat === '12h'}
                onChange={(isChecked) => setTimeFormat(isChecked ? '12h' : '24h')}
                labelOn="12 Hr"
                labelOff="24 Hr"
            />
        </div>
      </div>

      {todaysClasses.length === 0 ? (
        <FreeDayDisplay />
      ) : (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {todaysClasses.map((entry, index) => {
                    const isCompleted = timeToMinutes(entry.endTime) <= nowInMinutes;
                    return (
                        <ClassCard 
                            key={entry.id} 
                            entry={entry} 
                            timeFormat={timeFormat}
                            isCompleted={isCompleted} 
                            style={{ animationDelay: `${index * 100}ms` }}
                            completionStyle="default"
                        />
                    );
                })}
            </div>

            {allTodayClassesCompleted && (
                 <div className="text-center p-8 bg-surface rounded-lg shadow-lg animate-fade-in-up border border-border-color mt-8">
                    <h2 className="text-2xl font-bold text-text-base mb-4">You're all done for today! 🥳</h2>
                    <p className="text-lg text-text-muted">All your scheduled classes are completed. Enjoy your free time!</p>
                </div>
            )}
            
            {completedClasses.length > 0 && !allTodayClassesCompleted && (
              <div className="animate-fade-in-up" style={{ animationDelay: `${todaysClasses.length * 100}ms` }}>
                <h3 className="text-2xl font-bold text-text-base mt-12 mb-4">Completed Classes</h3>
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {completedClasses.map((entry, index) => (
                        <ClassCard 
                            key={`${entry.id}-completed`}
                            entry={entry}
                            timeFormat={timeFormat}
                            isCompleted={true}
                            style={{ animationDelay: `${index * 100}ms` }}
                            completionStyle="separated"
                        />
                    ))}
                </div>
              </div>
            )}

          {!allTodayClassesCompleted && (
            <div className="animate-fade-in-up" style={{ animationDelay: `${(todaysClasses.length + completedClasses.length) * 100}ms` }}>
              <h3 className="text-2xl font-bold text-text-base mt-12 mb-4">Your Free Time</h3>
              {freeSlots.length > 0 ? (
                   <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {freeSlots.map((slot, index) => (
                          <div key={index} className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-lg shadow flex items-center space-x-3">
                              <ClockIcon className="w-6 h-6"/>
                              <span className="font-semibold">{formatTime(slot.start, timeFormat)} - {formatTime(slot.end, timeFormat)}</span>
                          </div>
                      ))}
                      <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 p-4 rounded-lg shadow flex items-center space-x-3">
                         <TagIcon className="w-6 h-6"/>
                         <span className="font-semibold">{formatTime('13:00', timeFormat)} - {formatTime('14:00', timeFormat)} (Lunch)</span>
                      </div>
                   </div>
              ) : (
                  <p className="text-text-muted">Looks like a packed day! No free slots available.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimetableView;
