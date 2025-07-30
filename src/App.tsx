import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import type { TimetableData, ClassEntry, TimeFormat, Theme, Accent } from './types';
import TimetableView from './components/TimetableView';
import EditTimetableView from './components/EditTimetableView';
import WeekView from './components/WeekView';
import Toast from './components/Toast';
// Make sure all icons are exported from icons.tsx properly, or adjust imports as needed.
// If you're using `export const Icons = { ... }` from icons.tsx, you would import like:
// import { Icons } from './components/icons';
// and then use <Icons.Calendar /> etc.
// For now, keeping individual imports as in your previous App.tsx.
import { CalendarIcon, SunIcon, MoonIcon, MaleIcon, FemaleIcon } from './components/icons';

// NEW IMPORTS FOR AUTHENTICATION
import LoginPage from './components/LoginPage'; // <--- NEW
import { auth } from './firebase'; // <--- NEW: Import auth from your firebase.ts
import { onAuthStateChanged, signOut, User } from 'firebase/auth'; // <--- NEW: Import auth state listener and sign out

type ToastMessage = {
  message: string;
  type: 'success' | 'error' | 'info';
};

// --- Context for Timetable & Settings ---
interface AppContextType {
  timetable: TimetableData;
  addClass: (entry: ClassEntry) => void;
  updateClass: (day: string, updatedEntry: ClassEntry) => void;
  deleteClass: (day: string, id: string) => void;
  isLoading: boolean;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  toast: ToastMessage | null;
  showToast: (message: string, type: ToastMessage['type']) => void;
  hideToast: () => void;
  // NEW: Add currentUser and signOutUser to context
  currentUser: User | null; // <--- NEW
  signOutUser: () => void; // <--- NEW
  authLoading: boolean; // <--- NEW: Add authLoading to context type
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timetable, setTimetable] = useState<TimetableData>({});
  const [isLoading, setIsLoading] = useState(true); // For localStorage loading
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24h');
  const [theme, setThemeState] = useState<Theme>('light');
  const [accent, setAccentState] = useState<Accent>('blue');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // NEW: State for current user and authentication loading
  const [currentUser, setCurrentUser] = useState<User | null>(null); // <--- NEW
  const [authLoading, setAuthLoading] = useState(true); // <--- NEW: State to track if auth is initialized

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // --- PRIMARY AUTHENTICATION LISTENER ---
  // This useEffect listens for Firebase auth state changes and sets currentUser/authLoading.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false); // Auth state is now loaded (user is null or User object)
      // Optionally load user-specific timetable from Firestore/DB here if you implement it
      // For now, timetable loads from localStorage regardless of user.
    });
    return unsubscribe; // Clean up the listener on unmount
  }, []); // Empty dependency array means this runs once on mount

  // --- Existing localStorage effect for timetable and settings ---
  // This runs independently of auth, loading generic settings/timetable
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('timetable');
      if (savedData) setTimetable(JSON.parse(savedData));

      const savedFormat = localStorage.getItem('timeFormat') as TimeFormat;
      if (savedFormat && (savedFormat === '12h' || savedFormat === '24h')) setTimeFormatState(savedFormat);

      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) setThemeState(savedTheme);

      const savedAccent = localStorage.getItem('accent') as Accent;
      if (savedAccent) setAccentState(savedAccent);

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    } finally {
      setIsLoading(false); // Set isLoading to false after localStorage attempt
    }
  }, []); // Runs once on mount

  // --- Theme/Accent class application (remains the same) ---
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'accent-blue', 'accent-pink');
    root.classList.add(theme, `accent-${accent}`);
  }, [theme, accent]);


  // --- Timetable Save/Update/Delete functions (remains the same) ---
  const saveTimetable = (data: TimetableData) => {
    try {
      localStorage.setItem('timetable', JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save timetable to localStorage", error);
    }
  };

  const setTimeFormat = (format: TimeFormat) => {
    if (format === '12h' || format === '24h') {
        setTimeFormatState(format);
        localStorage.setItem('timeFormat', format);
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setAccent = (newAccent: Accent) => {
    setAccentState(newAccent);
    localStorage.setItem('accent', newAccent);
  };

  const addClass = (entry: ClassEntry) => {
    setTimetable(prev => {
      const dayEntries = prev[entry.day] ? [...prev[entry.day], entry] : [entry];
      const newTimetable = { ...prev, [entry.day]: dayEntries };
      saveTimetable(newTimetable);
      showToast('Class added successfully!', 'success');
      return newTimetable;
    });
  };

  const updateClass = (day: string, updatedEntry: ClassEntry) => {
    setTimetable(prev => {
        const dayEntries = (prev[day] || []).map(entry =>
            entry.id === updatedEntry.id ? updatedEntry : entry
        );
        const newTimetable = { ...prev, [day]: dayEntries };
        saveTimetable(newTimetable);
        showToast('Class updated successfully!', 'success');
        return newTimetable;
    });
  };

  const deleteClass = (day: string, id: string) => {
    setTimetable(prev => {
      const dayEntries = (prev[day] || []).filter(entry => entry.id !== id);
      const newTimetable = { ...prev, [day]: dayEntries };
      saveTimetable(newTimetable);
      showToast('Class deleted successfully.', 'success');
      return newTimetable;
    });
  };

  // --- NEW: Sign out function ---
  const signOutUser = async () => {
    try {
      await signOut(auth);
      showToast('Logged out successfully.', 'info');
      // Optionally clear timetable data if it's user-specific
      localStorage.removeItem('timetable'); // Clear existing local timetable data
      setTimetable({}); // Clear local timetable state
    } catch (error: any) {
      console.error("Logout Error:", error);
      showToast(error.message || 'Failed to log out.', 'error');
    }
  };

  const value = {
    timetable, addClass, updateClass, deleteClass, isLoading,
    timeFormat, setTimeFormat, theme, setTheme, accent, setAccent,
    toast, showToast, hideToast,
    // NEW values for context
    currentUser, signOutUser, authLoading // <--- NEW: Add currentUser, signOutUser, and authLoading to context value
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- Live Time Hook (remains the same) ---
const useLiveTime = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

// --- Header Component (Updated to show user email and logout button) ---
const Header: React.FC = () => {
  const now = useLiveTime();
  const { timeFormat, theme, setTheme, accent, setAccent, signOutUser, currentUser } = useApp(); // <--- Get signOutUser and currentUser from context

  const dateString = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeString = now.toLocaleTimeString('en-US', { hour12: timeFormat === '12h', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleAccent = () => setAccent(accent === 'blue' ? 'pink' : 'blue');

  return (
    <header className="bg-surface/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
             <div className="flex-shrink-0 p-2 bg-primary rounded-lg text-primary-fg">
                <CalendarIcon className="h-7 w-7"/>
             </div>
             <div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-base">VIT-AP Timetable</h1>
                <div className="flex items-baseline space-x-2">
                    <p className="text-sm font-medium text-primary">{timeString}</p>
                    <p className="text-sm text-text-muted hidden sm:block">{dateString}</p>
                </div>
             </div>
          </div>
          <div className="flex items-center space-x-2">
            <nav className="flex items-center justify-center space-x-1 sm:space-x-2">
                <NavLink to="/" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-primary/5'}`}>Today</NavLink>
                <NavLink to="/week" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-primary/5'}`}>Week</NavLink>
                <NavLink to="/edit" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-primary/5'}`}>Manage</NavLink>
            </nav>
            <div className="h-6 w-px bg-border-color"></div>
             <button onClick={toggleAccent} className="p-2 rounded-full text-text-muted hover:bg-primary/10 hover:text-primary transition-colors" aria-label="Toggle Accent Color">
                {accent === 'blue' ? <MaleIcon className="w-6 h-6" /> : <FemaleIcon className="w-6 h-6" />}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full text-text-muted hover:bg-primary/10 hover:text-primary transition-colors" aria-label="Toggle Theme">
                {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
            </button>
            {/* NEW: Display user email and logout button conditionally */}
            {currentUser && (
                <div className="hidden sm:flex items-center space-x-2 ml-2">
                    <span className="text-sm font-medium text-text-muted hidden md:block">
                        {currentUser.email}
                    </span>
                    <button 
                        onClick={signOutUser} 
                        className="px-3 py-1 text-sm rounded-md text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors border border-border-color"
                    >
                        Sign Out
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// --- Footer Component (Accordion Guide - remains the same) ---
const AccordionItem: React.FC<{ title: string; content: string; isOpen: boolean; onClick: () => void }> = ({ title, content, isOpen, onClick }) => (
    <div className="border-b border-border-color">
        <h2>
            <button
                type="button"
                className="flex items-center justify-between w-full p-5 font-medium text-left text-text-muted hover:bg-black/5 dark:hover:bg-white/5"
                onClick={onClick}
                aria-expanded={isOpen}
            >
                <span className={isOpen ? 'text-primary' : ''}>{title}</span>
                <svg className={`w-3 h-3 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
                </svg>
            </button>
        </h2>
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
                <div className="p-5 border-t-0 border-border-color">
                    <p className="text-text-muted">{content}</p>
                </div>
            </div>
        </div>
    </div>
);


const Footer: React.FC = () => {
    const [openItem, setOpenItem] = useState<string | null>(null);

    const toggleItem = (title: string) => {
        setOpenItem(openItem === title ? null : title);
    };

    const guideItems = [
        {
            title: 'How to Add a Class',
            content: 'Navigate to the "Manage" tab, select a day, fill in the details in the "Add New Class" form, and click "Add Class". A success message will confirm it has been added.'
        },
        {
            title: 'How to Edit a Class',
            content: 'In the "Manage" tab, find the class you want to change and click the pencil icon. The form will populate with its data. Make your edits and click "Update Class".'
        },
        {
            title: 'How to Delete a Class',
            content: 'Simply go to the "Manage" tab, find the class entry you want to remove, and click the trash can icon next to it. A confirmation will appear.'
        }
    ];

    return (
        <footer className="bg-surface/50 mt-12">
            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                 <div className="bg-surface rounded-lg shadow-sm border border-border-color overflow-hidden">
                    {guideItems.map(item => (
                        <AccordionItem
                            key={item.title}
                            title={item.title}
                            content={item.content}
                            isOpen={openItem === item.title}
                            onClick={() => toggleItem(item.title)}
                        />
                    ))}
                </div>
            </div>
        </footer>
    );
}

// --- App Component (Conditional Rendering) ---
const AppContent: React.FC = () => {
    // Get currentUser and authLoading directly from AppProvider via useApp()
    const { toast, hideToast, currentUser, authLoading } = useApp(); 

    // Show loading state while Firebase authentication is being initialized
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-text-base bg-background">
                <p>Loading user session...</p>
            </div>
        );
    }

    // If no user is logged in after auth has loaded, show the login page
    if (!currentUser) {
        return <LoginPage />;
    }

    // If a user is logged in, show the main application content
    return (
        <div className="min-h-screen bg-background">
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
            <Header />
            <main>
                <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                    <Routes>
                    <Route path="/" element={<TimetableView />} />
                    <Route path="/week" element={<WeekView />} />
                    <Route path="/edit" element={<EditTimetableView />} />
                    </Routes>
                </div>
            </main>
            <Footer />
            {/* <VisitorCounter /> If you're keeping the visitor counter, place it here */}
        </div>
    );
}

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent/>
        </AppProvider>
    )
}

export default App;