import React, { useState, FormEvent, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import type { ClassEntry, TimeFormat } from '../types';
import { DAYS_OF_WEEK, ACADEMIC_BLOCKS } from '../constants';
import { getSlotColorStyle, formatTime } from '../utils';
import { PlusIcon, TrashIcon, ClockIcon, EditIcon } from './icons';

// --- Time Utilities ---
const convertTo24h = (time: string, period: 'AM' | 'PM'): string => {
    let [hours, minutes] = time.split(':').map(Number);
    if(isNaN(hours) || isNaN(minutes)) return '';
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0; // Midnight case
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const parse12hTime = (time12h: string): { time: string, period: 'AM' | 'PM' } => {
    const parts = time12h.split(' ');
    const time = parts[0] || '12:00';
    const period = (parts[1] || 'AM').toUpperCase() as 'AM' | 'PM';
    return { time, period };
}

// --- Time Select Component ---
const TimeSelect: React.FC<{
    label: string;
    time24h: string;
    setTime24h: (time: string) => void;
    timeFormat: TimeFormat;
}> = ({ label, time24h, setTime24h, timeFormat }) => {
    
    const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')), []);
    const hour12Options = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), []);
    const minuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')), []);

    const handleChange = (part: 'hour' | 'minute' | 'period', value: string) => {
        if (timeFormat === '12h') {
            const { time, period } = parse12hTime(formatTime(time24h, '12h'));
            let [h, m] = time.split(':');
            let p = period;

            if (part === 'hour') h = value;
            if (part === 'minute') m = value;
            if (part === 'period') p = value as 'AM' | 'PM';

            const newTime24 = convertTo24h(`${h}:${m}`, p);
            setTime24h(newTime24);
        } else {
            const [h, m] = time24h.split(':');
            const newHour = part === 'hour' ? value : h;
            const newMinute = part === 'minute' ? value : m;
            setTime24h(`${newHour}:${newMinute}`);
        }
    };

    const render24h = () => {
        const [h, m] = time24h.split(':');
        return (
            <div className="flex gap-2">
                <select value={h} onChange={e => handleChange('hour', e.target.value)} className="block w-full rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                    {hourOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={m} onChange={e => handleChange('minute', e.target.value)} className="block w-full rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                    {minuteOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        );
    };

    const render12h = () => {
        const { time, period } = parse12hTime(formatTime(time24h, '12h'));
        const [h, m] = time.split(':');
        return (
            <div className="flex gap-2">
                <select value={h} onChange={e => handleChange('hour', e.target.value)} className="block w-full rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                     {hour12Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={m} onChange={e => handleChange('minute', e.target.value)} className="block w-full rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                    {minuteOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={period} onChange={e => handleChange('period', e.target.value)} className="block rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                    <option>AM</option><option>PM</option>
                </select>
            </div>
        );
    };
    
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-text-muted">{label}</label>
            {timeFormat === '12h' ? render12h() : render24h()}
        </div>
    );
};

// --- Sub-components ---
const ClassForm: React.FC<{ day: string; onAdd: (entry: ClassEntry) => void; onUpdate: (day: string, entry: ClassEntry) => void; classToEdit: ClassEntry | null; onCancelEdit: () => void }> = ({ day, onAdd, onUpdate, classToEdit, onCancelEdit }) => {
  const { timeFormat } = useApp();
  
  const [subject, setSubject] = useState('');
  const [block, setBlock] = useState(ACADEMIC_BLOCKS[0]);
  const [room, setRoom] = useState('');
  const [slot, setSlot] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:50');
  const [error, setError] = useState('');

  const resetForm = () => {
    setSubject('');
    setBlock(ACADEMIC_BLOCKS[0]);
    setRoom('');
    setSlot('');
    setStartTime('09:00');
    setEndTime('09:50');
    setError('');
  };

  useEffect(() => {
    if (classToEdit) {
      const [editBlock, editRoom] = classToEdit.venue.split(', ');
      setSubject(classToEdit.subject);
      setBlock(editBlock || ACADEMIC_BLOCKS[0]);
      setRoom(editRoom || '');
      setSlot(classToEdit.slot);
      setError('');
      setStartTime(classToEdit.startTime);
      setEndTime(classToEdit.endTime);

    } else {
      resetForm();
    }
  }, [classToEdit]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const venue = `${block}, ${room}`;

    if (!subject || !room || !slot || !startTime || !endTime) {
        setError('All fields are required.'); return;
    }
    if(startTime >= endTime) {
        setError('End time must be after start time.'); return;
    }
    setError('');

    const payload = { subject, venue, slot, startTime, endTime };
    
    if (classToEdit) {
        onUpdate(day, { ...classToEdit, ...payload });
        onCancelEdit(); // This will trigger the useEffect and reset the form
    } else {
        onAdd({ id: Date.now().toString(), day, ...payload });
        resetForm(); // Manually reset form after adding
    }
  };

  const isEditing = !!classToEdit;

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-surface rounded-lg shadow-md space-y-4 animate-fade-in-up border border-border-color">
      <h3 className="text-xl font-semibold text-text-base">{isEditing ? 'Edit Class' : `Add New Class to`} <span className="text-primary">{isEditing ? `on ${day}` : day}</span></h3>
       {error && <p className="text-red-500 text-sm">{error}</p>}
       
       <div className="space-y-1">
          <label htmlFor="subject" className="block text-sm font-medium text-text-muted">Subject Name</label>
          <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 block w-full rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="e.g., Data Structures" />
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-text-muted">Academic Block</label>
            <div className="flex flex-wrap gap-2">
                {ACADEMIC_BLOCKS.map(b => (
                    <button type="button" key={b} onClick={() => setBlock(b)} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${block === b ? 'bg-primary text-primary-fg shadow' : 'bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border-color'}`}>
                        {b.split(' ')[0]}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
            <label htmlFor="room" className="block text-sm font-medium text-text-muted">Room Number</label>
            <input type="text" id="room" value={room} onChange={e => setRoom(e.target.value)} className="mt-1 block w-full rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="e.g., L10 or 301" />
            </div>
            
            <div className="space-y-1">
            <label htmlFor="slot" className="block text-sm font-medium text-text-muted">Slot Name</label>
            <input type="text" id="slot" value={slot} onChange={e => setSlot(e.target.value)} className="mt-1 block w-full rounded-md border-border-color bg-input-bg shadow-sm focus:border-primary focus:ring-primary sm:text-sm" placeholder="e.g., F1+TF1" />
            </div>
        </div>
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimeSelect label="Start Time" time24h={startTime} setTime24h={setStartTime} timeFormat={timeFormat} />
          <TimeSelect label="End Time" time24h={endTime} setTime24h={setEndTime} timeFormat={timeFormat} />
      </div>
        <div className="flex gap-2 pt-2">
            <button type="submit" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-fg bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <PlusIcon className="w-5 h-5 mr-2"/>
                {isEditing ? 'Update Class' : 'Add Class'}
            </button>
            {isEditing && (
                 <button type="button" onClick={onCancelEdit} className="w-full inline-flex justify-center items-center px-4 py-2 border border-border-color text-sm font-medium rounded-md shadow-sm text-text-base bg-surface hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                    Cancel
                </button>
            )}
        </div>
    </form>
  );
};

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; labelOn: string; labelOff: string; }> = ({ checked, onChange, labelOn, labelOff }) => (
    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onChange(!checked)}>
        <span className={`text-sm font-medium ${!checked ? 'text-primary' : 'text-text-muted'}`}>{labelOff}</span>
        <div className={`relative inline-block w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${checked ? 'transform translate-x-5' : ''}`}></span>
        </div>
        <span className={`text-sm font-medium ${checked ? 'text-primary' : 'text-text-muted'}`}>{labelOn}</span>
    </div>
);

// --- Main Edit View Component ---
const EditTimetableView: React.FC = () => {
  const { timetable, addClass, updateClass, deleteClass, isLoading, timeFormat, setTimeFormat } = useApp();
  const todayIndex = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[todayIndex]);
  const [editingClass, setEditingClass] = useState<ClassEntry | null>(null);

  const dayClasses = (timetable[selectedDay] || []).sort((a,b) => a.startTime.localeCompare(b.startTime));
  
  const handleEditClick = (entry: ClassEntry) => {
    setEditingClass(entry);
    // scroll to form for better UX on mobile
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const handleCancelEdit = () => setEditingClass(null);

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div className="animate-fade-in-up">
        <h2 className="text-3xl font-bold tracking-tight text-text-base sm:text-4xl">Manage Your Timetable</h2>
        <p className="mt-2 text-lg text-text-muted">Add, view, and manage your classes for each day of the week.</p>
      </div>

       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button key={day} onClick={() => { setSelectedDay(day); handleCancelEdit(); }} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedDay === day ? 'bg-primary text-primary-fg shadow' : 'bg-surface text-text-muted hover:bg-black/5 dark:hover:bg-white/5 border border-border-color'}`}>
                {day}
              </button>
            ))}
        </div>
         <ToggleSwitch checked={timeFormat === '12h'} onChange={(isChecked) => setTimeFormat(isChecked ? '12h' : '24h')} labelOn="12 Hr" labelOff="24 Hr" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="animate-fade-in-up space-y-4" style={{ animationDelay: '200ms' }}>
          <h3 className="text-2xl font-semibold text-text-base">{selectedDay}'s Schedule</h3>
          {isLoading ? <p>Loading...</p> : dayClasses.length > 0 ? (
            <div className="space-y-3">
              {dayClasses.map(entry => {
                const colors = getSlotColorStyle(entry.slot);
                const slotColorClass = `${colors.bg} ${colors.text} ${colors.darkText}`;
                return (
                  <div key={entry.id} className="bg-surface p-4 rounded-lg shadow-sm flex justify-between items-center transition-shadow hover:shadow-md border border-border-color">
                    <div>
                      <p className="font-bold text-text-base">{entry.subject}</p>
                      <p className="text-sm text-text-muted flex items-center flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-1" />
                        {formatTime(entry.startTime, timeFormat)} - {formatTime(entry.endTime, timeFormat)}</span>
                        <span className="font-semibold">{entry.venue}</span> 
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${slotColorClass}`}>{entry.slot}</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button onClick={() => handleEditClick(entry)} className="p-2 rounded-full text-text-muted hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                          <EditIcon className="w-5 h-5"/>
                      </button>
                      <button onClick={() => deleteClass(selectedDay, entry.id)} className="p-2 rounded-full text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors">
                          <TrashIcon className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-text-muted p-4 bg-surface rounded-lg shadow-sm border border-border-color">No classes scheduled for {selectedDay}.</div>
          )}
        </div>
        
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <ClassForm day={selectedDay} onAdd={addClass} onUpdate={updateClass} classToEdit={editingClass} onCancelEdit={handleCancelEdit} />
        </div>
      </div>
    </div>
  );
};

export default EditTimetableView;
