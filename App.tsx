import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentRecords from './components/StudentRecords';
import LeaveManagement from './components/LeaveManagement';
import AIAssistant from './components/AIAssistant';
import StaffDirectory from './components/StaffDirectory';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import HelpDesk from './components/HelpDesk';
import MemoSystem from './components/MemoSystem';
import AcademicManager from './components/AcademicManager';
import TimetableManager from './components/TimetableManager';
import TodoList from './components/TodoList';
import AppraisalSystem from './components/AppraisalSystem';
import StudentPortal from './components/StudentPortal';
import { SystemUser, Employee, Student } from './types';
import { MOCK_EMPLOYEES, MOCK_USERS, MOCK_STUDENTS } from './constants';
import { Menu, Bell, Check, Moon, Sun, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [currentEmployees, setCurrentEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  
  // Shared State: Students (Lifted for Course Assignment & Records)
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);

  // Global Academic Context
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2023/2024');
  const [currentSemester, setCurrentSemester] = useState<number>(1);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  // Language State
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  // Notification System State
  const [notifications, setNotifications] = useState<{id: string, text: string, time: string, read: boolean}[]>([
      { id: '1', text: 'Welcome to OLA College MIS', time: 'Just now', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- Keyboard Shortcuts & Effects ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Alt + T = Toggle Theme
        if (e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            toggleTheme();
        }
        // Alt + L = Toggle Language
        if (e.altKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            toggleLanguage();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [darkMode, language]); // Dep on state not strictly needed for toggle logic but good for freshness

  // Apply Dark Mode Class
  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [darkMode]);

  // Polling for HR Notifications (Simulating Backend Push)
  useEffect(() => {
      if (!currentUser) return;

      const checkPendingNotifications = () => {
          const pendingStr = localStorage.getItem('ola_pending_notifications');
          if (!pendingStr) return;

          try {
              const pending = JSON.parse(pendingStr);
              if (!Array.isArray(pending) || pending.length === 0) return;

              const isHR = currentUser.roleIds.includes('ROLE-HR') || currentUser.roleIds.includes('ROLE-ADMIN');
              
              // Filter notifications relevant to current user
              const relevant = pending.filter((n: any) => {
                  if (n.targetRole === 'ROLE-HR' && isHR) return true;
                  // Add other role checks if needed
                  return false;
              });

              if (relevant.length > 0) {
                  // Add to local state
                  relevant.forEach((n: any) => {
                      addNotification(n.text);
                  });

                  // Remove delivered notifications from storage to prevent duplicates
                  const remaining = pending.filter((n: any) => !relevant.includes(n));
                  localStorage.setItem('ola_pending_notifications', JSON.stringify(remaining));
              }
          } catch (e) {
              console.error("Error processing notifications", e);
          }
      };

      // Check immediately and then every 3 seconds
      checkPendingNotifications();
      const interval = setInterval(checkPendingNotifications, 3000);
      return () => clearInterval(interval);
  }, [currentUser]);

  const toggleTheme = () => setDarkMode(prev => !prev);
  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'fr' : 'en');

  const addNotification = (message: string) => {
      const newNotif = {
          id: Date.now().toString() + Math.random().toString(),
          text: message,
          time: 'Just now',
          read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('ola_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Error loading saved user", e);
        localStorage.removeItem('ola_current_user');
      }
    }
  }, []);

  const handleLogin = (user: SystemUser) => {
    localStorage.setItem('ola_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);

    // Redirect Logic based on Role Priority
    const userRoles = user.roleIds || [];
    if (userRoles.includes('ROLE-ADMIN')) {
        setActiveTab('dashboard');
    } else if (userRoles.includes('ROLE-HR')) {
        setActiveTab('employees');
    } else if (userRoles.includes('ROLE-IT')) {
        setActiveTab('helpdesk');
    } else if (userRoles.includes('ROLE-STAFF')) {
        setActiveTab('academics');
    } else if (userRoles.includes('ROLE-NON-TEACHING')) {
        setActiveTab('leave');
    } else if (userRoles.includes('ROLE-STUDENT')) {
        setActiveTab('student_portal');
    } else {
        setActiveTab('dashboard');
    }
  };

  const handleRegister = (user: SystemUser) => {
    handleLogin(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('ola_current_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthView('login');
  };

  // Get current employee details based on login
  const currentEmployee = currentUser 
    ? currentEmployees.find(e => e.id === currentUser.employeeId) 
    : null;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'student_portal':
        return <StudentPortal studentId={currentUser?.employeeId || ''} />;
      case 'students':
        return (
            <StudentRecords 
                students={students} 
                setStudents={setStudents} 
                currentAcademicYear={currentAcademicYear}
                currentSemester={currentSemester}
                currentUser={currentUser}
            />
        );
      case 'academics':
        return (
            <AcademicManager 
                currentUser={currentUser} 
                students={students} 
                setStudents={setStudents}
                currentAcademicYear={currentAcademicYear}
                currentSemester={currentSemester}
            />
        );
      case 'timetable':
        return <TimetableManager />;
      case 'todo':
        return <TodoList onNotify={addNotification} />;
      case 'leave':
        // Pass the notification handler to LeaveManagement
        return <LeaveManagement onNotify={addNotification} />;
      case 'memos':
        return <MemoSystem currentUser={currentEmployee || null} onNotify={addNotification} />;
      case 'assistant':
        return <AIAssistant onNotify={addNotification} currentUser={currentUser || null} />;
      case 'employees':
        return <StaffDirectory />;
      case 'helpdesk':
        return <HelpDesk currentUser={currentUser || null} onNotify={addNotification} />;
      case 'appraisal':
        return <AppraisalSystem currentUser={currentUser || null} onNotify={addNotification} />;
      case 'settings':
        return (
            <Settings 
                currentAcademicYear={currentAcademicYear}
                currentSemester={currentSemester}
                onUpdateSession={(year, sem) => {
                    setCurrentAcademicYear(year);
                    setCurrentSemester(sem);
                }}
            />
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    if (authView === 'register') {
        return (
            <Register 
                onRegister={handleRegister} 
                onNavigateToLogin={() => setAuthView('login')} 
            />
        );
    }
    return (
        <Login 
            onLogin={handleLogin} 
            onNavigateToRegister={() => setAuthView('register')} 
        />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f3f4f6] dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        language={language}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-3 md:gap-4 text-slate-600 dark:text-slate-300">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
             >
                <Menu size={24} />
             </button>
             <div className="flex flex-col md:flex-row md:items-center md:gap-4">
               <span className="font-semibold text-base md:text-lg tracking-tight text-slate-800 dark:text-white truncate">OLA College</span>
               <span className="hidden md:inline text-slate-300 dark:text-slate-600">|</span>
               <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                   {currentAcademicYear}, Semester {currentSemester}
               </span>
             </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             {/* Language Switch */}
             <button 
                onClick={toggleLanguage}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-bold flex items-center gap-1"
                title={`Switch Language (Alt+L) - Current: ${language.toUpperCase()}`}
             >
                 <Globe size={18} />
                 <span className="hidden sm:inline">{language.toUpperCase()}</span>
             </button>

             {/* Dark Mode Toggle */}
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Dark Mode (Alt+T)"
             >
                 {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             {/* Notification Bell */}
             <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
                >
                    <Bell size={20} />
                    {notifications.some(n => !n.read) && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800 animate-pulse"></span>
                    )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)}></div>
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in fade-in zoom-in duration-200 overflow-hidden">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                                <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">Notifications</h3>
                                <button onClick={markAllRead} className="text-[10px] text-blue-600 font-medium hover:underline flex items-center gap-1">
                                    <Check size={12} /> Mark all read
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif.id} className={`p-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`text-sm ${!notif.read ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>{notif.text}</p>
                                                {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></div>}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No notifications</div>
                                )}
                            </div>
                        </div>
                    </>
                )}
             </div>

             <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : currentUser?.username}
                 </p>
                 <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentEmployee ? currentEmployee.role : 'System User'}
                 </p>
             </div>
             <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                 {currentEmployee?.photo ? (
                    <img src={currentEmployee.photo} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <span>
                        {currentEmployee 
                            ? `${currentEmployee.firstName[0]}${currentEmployee.lastName[0]}` 
                            : currentUser?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                 )}
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="p-4 md:p-8 flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;