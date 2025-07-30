// --- ClassForm Component (Significantly Modified) ---
interface DayTime {
    startTime: string;
    endTime: string;
}

const ClassForm: React.FC<{ day: string; onAdd: (entry: ClassEntry) => void; onUpdate: (day: string, entry: ClassEntry) => void; classToEdit: ClassEntry | null; onCancelEdit: () => void; showToast: (message: string, type: 'success' | 'error' | 'info') => void; }> = ({ day, onAdd, onUpdate, classToEdit, onCancelEdit, showToast }) => {
  const { timeFormat } = useApp();

  const [subject, setSubject] = useState('');
  const [block, setBlock] = useState(ACADEMIC_BLOCKS[0]);
  const [room, setRoom] = useState('');
  const [slot, setSlot] = useState('');
  // NEW: State to manage selected days and their times
  const [selectedDaysTimes, setSelectedDaysTimes] = useState<Record<string, DayTime>>({});
  const [error, setError] = useState('');

  const resetForm = () => {
    setSubject('');
    setBlock(ACADEMIC_BLOCKS[0]);
    setRoom('');
    setSlot('');
    setSelectedDaysTimes({}); // Clear all selected days and times
    setError('');
  };

  useEffect(() => {
    if (classToEdit) {
      // When editing, pre-fill the form with the single class's data
      const [editBlock, editRoom] = classToEdit.venue.split(', ');
      setSubject(classToEdit.subject);
      setBlock(editBlock || ACADEMIC_BLOCKS[0]);
      setRoom(editRoom || '');
      setSlot(classToEdit.slot);
      // For editing, only pre-fill the specific day's time
      setSelectedDaysTimes({
          [classToEdit.day]: {
              startTime: classToEdit.startTime,
              endTime: classToEdit.endTime
          }
      });
      setError('');
    } else {
      resetForm();
    }
  }, [classToEdit]);

  const handleDayToggle = (dayName: string) => {
      setSelectedDaysTimes(prev => {
          const newDays = { ...prev };
          if (newDays[dayName]) {
              delete newDays[dayName]; // Deselect day
          } else {
              // Select day with default times
              newDays[dayName] = { startTime: '09:00', endTime: '09:50' };
          }
          return newDays;
      });
  };

  const handleTimeChange = (dayName: string, type: 'start' | 'end', time: string) => {
      setSelectedDaysTimes(prev => ({
          ...prev,
          [dayName]: {
              ...prev[dayName],
              [type === 'start' ? 'startTime' : 'endTime']: time
          }
      }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate common fields first
    if (!subject || !room || !slot) {
        setError('Subject, Room, and Slot are required.'); return;
    }

    const selectedDays = Object.keys(selectedDaysTimes);

    if (!classToEdit) { // Logic for adding multiple new classes
        if (selectedDays.length === 0) {
            setError('Please select at least one day.'); return;
        }

        let hasTimeError = false;
        selectedDays.forEach(dayName => {
            const times = selectedDaysTimes[dayName];
            if (!times.startTime || !times.endTime) {
                setError(`Start and End times are required for ${dayName}.`);
                hasTimeError = true;
                return; // Exit loop early if error
            }
            if (times.startTime >= times.endTime) {
                setError(`End time must be after start time for ${dayName}.`);
                hasTimeError = true;
                return; // Exit loop early if error
            }
        });
        if (hasTimeError) return; // Stop submission if time validation failed

        selectedDays.forEach(dayName => {
            const times = selectedDaysTimes[dayName];
            const venue = `${block}, ${room}`;
            const newClass: ClassEntry = {
                id: Date.now().toString() + '-' + dayName + '-' + Math.random().toString(36).substring(2, 9), // More unique ID
                day: dayName,
                subject,
                venue,
                slot,
                startTime: times.startTime,
                endTime: times.endTime
            };
            onAdd(newClass); // Call onAdd for each day
        });
        showToast('Classes added successfully!', 'success'); // Show a single toast for all additions
        resetForm(); // Reset form after adding
    } else { // Logic for updating a single existing class
        // When editing, we only update the single class that was passed to classToEdit
        const venue = `${block}, ${room}`;
        const existingDay = classToEdit.day;
        // Get times for the specific day being edited from selectedDaysTimes state
        // Use classToEdit's times as fallback if not yet in selectedDaysTimes (e.g., initial load)
        const currentTimes = selectedDaysTimes[existingDay] || { startTime: classToEdit.startTime, endTime: classToEdit.endTime };

        if (!currentTimes.startTime || !currentTimes.endTime) {
            setError('Start and End times are required.'); return;
        }
        if (currentTimes.startTime >= currentTimes.endTime) {
            setError('End time must be after start time.'); return;
        }

        const updatedPayload = {
            subject,
            venue,
            slot,
            startTime: currentTimes.startTime,
            endTime: currentTimes.endTime
        };

        onUpdate(existingDay, { ...classToEdit, ...updatedPayload });
        showToast('Class updated successfully!', 'success');
        onCancelEdit(); // This will trigger the useEffect and reset the form
    }
  };

  const isEditing = !!classToEdit;

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-surface rounded-lg shadow-md space-y-4 animate-fade-in-up border border-border-color">
      <h3 className="text-xl font-semibold text-text-base">{isEditing ? 'Edit Class' : `Add New Class`} <span className="text-primary">{isEditing ? `on ${classToEdit?.day}` : ''}</span></h3>
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

        {/* NEW: Day Selection and Dynamic Time Inputs */}
        <div className="space-y-2">
            <label className="block text-sm font-medium text-text-muted">{isEditing ? 'Class Day & Time' : 'Select Day(s) & Time(s)'}</label>
            {isEditing ? (
                // When editing, only show the specific day
                <div className="space-y-3 p-3 bg-surface rounded-md border border-border-color">
                    <p className="font-semibold text-text-base">{classToEdit?.day}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TimeSelect 
                            label="Start Time" 
                            time24h={selectedDaysTimes[classToEdit.day]?.startTime || '09:00'} 
                            setTime24h={(time) => handleTimeChange(classToEdit.day, 'start', time)} 
                            timeFormat={timeFormat} 
                        />
                        <TimeSelect 
                            label="End Time" 
                            time24h={selectedDaysTimes[classToEdit.day]?.endTime || '09:50'} 
                            setTime24h={(time) => handleTimeChange(classToEdit.day, 'end', time)} 
                            timeFormat={timeFormat} 
                        />
                    </div>
                </div>
            ) : (
                // When adding, allow multiple day selections
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(dayName => (
                            <button 
                                type="button" 
                                key={dayName} 
                                onClick={() => handleDayToggle(dayName)} 
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${selectedDaysTimes[dayName] ? 'bg-primary text-primary-fg shadow' : 'bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border-color'}`}
                            >
                                {dayName}
                            </button>
                        ))}
                    </div>
                    {Object.keys(selectedDaysTimes).length > 0 && (
                        <div className="space-y-4 p-3 bg-surface rounded-md border border-border-color">
                            <p className="text-text-muted text-sm font-medium">Set times for selected days:</p>
                            {Object.keys(selectedDaysTimes).sort((a,b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)).map(dayName => (
                                <div key={`time-input-${dayName}`} className="space-y-2">
                                    <p className="font-semibold text-text-base">{dayName}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TimeSelect 
                                            label="Start Time" 
                                            time24h={selectedDaysTimes[dayName].startTime} 
                                            setTime24h={(time) => handleTimeChange(dayName, 'start', time)} 
                                            timeFormat={timeFormat} 
                                        />
                                        <TimeSelect 
                                            label="End Time" 
                                            time24h={selectedDaysTimes[dayName].endTime} 
                                            setTime24h={(time) => handleTimeChange(dayName, 'end', time)} 
                                            timeFormat={timeFormat} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )} {/* End NEW: Day Selection and Dynamic Time Inputs */}


        <div className="flex gap-2 pt-2">
            <button type="submit" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-fg bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <PlusIcon className="w-5 h-5 mr-2"/>
                {isEditing ? 'Update Class' : 'Add Class(es)'}
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
  const { timetable, addClass, updateClass, deleteClass, isLoading, timeFormat, setTimeFormat, showToast } = useApp(); // Get showToast from context
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
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}> {/* Set explicit delay for first element */}
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
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}> {/* Set explicit delay */}
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

        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}> {/* Set explicit delay */}
          {/* Pass showToast prop to ClassForm */}
          <ClassForm day={selectedDay} onAdd={addClass} onUpdate={updateClass} classToEdit={editingClass} onCancelEdit={handleCancelEdit} showToast={showToast} />
        </div>
      </div>
    </div>
  );
};

export default EditTimetableView;