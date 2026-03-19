import React from 'react';
import { LayoutDashboard, GraduationCap, Users, CalendarDays, Bot, LogOut, School, Settings, X, LifeBuoy, FileText, BookOpenCheck, CalendarClock, ListTodo, ClipboardList } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

import { SystemUser } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'fr';
  currentUser: SystemUser | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, isOpen, onClose, language = 'en', currentUser }) => {
  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  const allMenuItems = [
    { id: 'dashboard', label: t('Dashboard'), icon: <LayoutDashboard size={20} />, roles: ['ROLE-ADMIN', 'ROLE-HR', 'ROLE-IT'] },
    { id: 'student_portal', label: t('Student Portal'), icon: <GraduationCap size={20} />, roles: ['ROLE-STUDENT'] },
    { id: 'students', label: t('Student Records'), icon: <GraduationCap size={20} />, roles: ['ROLE-ADMIN', 'ROLE-HR', 'ROLE-STAFF'] },
    { id: 'academics', label: t('Academic Manager'), icon: <BookOpenCheck size={20} />, roles: ['ROLE-ADMIN', 'ROLE-STAFF'] },
    { id: 'timetable', label: t('Timetable'), icon: <CalendarClock size={20} />, roles: ['ROLE-ADMIN', 'ROLE-STAFF', 'ROLE-STUDENT'] },
    { id: 'todo', label: t('To-Do List'), icon: <ListTodo size={20} />, roles: ['ROLE-ADMIN', 'ROLE-STAFF', 'ROLE-NON-TEACHING', 'ROLE-STUDENT'] },
    { id: 'appraisal', label: t('Self-Appraisal'), icon: <ClipboardList size={20} />, roles: ['ROLE-ADMIN', 'ROLE-STAFF', 'ROLE-NON-TEACHING'] },
    { id: 'employees', label: t('Staff Directory'), icon: <Users size={20} />, roles: ['ROLE-ADMIN', 'ROLE-HR'] },
    { id: 'leave', label: t('Leave Management'), icon: <CalendarDays size={20} />, roles: ['ROLE-ADMIN', 'ROLE-STAFF', 'ROLE-NON-TEACHING', 'ROLE-HR'] },
    { id: 'memos', label: t('Internal Memos'), icon: <FileText size={20} />, roles: ['ROLE-ADMIN', 'ROLE-STAFF', 'ROLE-NON-TEACHING'] },
    { id: 'helpdesk', label: t('Help Desk'), icon: <LifeBuoy size={20} />, roles: ['ROLE-ADMIN', 'ROLE-IT', 'ROLE-STAFF', 'ROLE-NON-TEACHING', 'ROLE-STUDENT'] },
    { id: 'assistant', label: t('AI Assistant'), icon: <Bot size={20} />, roles: ['ROLE-ADMIN', 'ROLE-STAFF', 'ROLE-STUDENT'] },
    { id: 'settings', label: t('Settings'), icon: <Settings size={20} />, roles: ['ROLE-ADMIN'] },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (!currentUser) return false;
    if (item.roles.includes('all')) return true;
    return item.roles.some(role => currentUser.roleIds.includes(role));
  });

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    onClose(); // Close sidebar on mobile when item selected
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 shadow-xl 
        transform transition-transform duration-300 ease-in-out flex flex-col dark:border-r dark:border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-700 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <School size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OLA College</h1>
              <p className="text-xs text-slate-400">MIS Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 dark:border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={20} />
            {t('Sign Out')}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;