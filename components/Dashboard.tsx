import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, GraduationCap, CalendarOff, AlertCircle } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_LEAVE_REQUESTS, MOCK_EMPLOYEES } from '../constants';
import { LeaveStatus } from '../types';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Calculated metrics
  const totalStudents = MOCK_STUDENTS.length;
  const totalStaff = MOCK_EMPLOYEES.length;
  const pendingLeaves = MOCK_LEAVE_REQUESTS.filter(l => l.status === LeaveStatus.PENDING).length;
  const activeLeaves = MOCK_LEAVE_REQUESTS.filter(l => l.status === LeaveStatus.APPROVED).length;

  const studentData = [
    { name: 'Year 1', count: MOCK_STUDENTS.filter(s => s.year === 1).length },
    { name: 'Year 2', count: MOCK_STUDENTS.filter(s => s.year === 2).length },
    { name: 'Year 3', count: MOCK_STUDENTS.filter(s => s.year === 3).length },
    { name: 'Year 4', count: MOCK_STUDENTS.filter(s => s.year === 4).length },
  ];

  const leaveData = [
    { name: 'Pending', value: pendingLeaves, color: '#F59E0B' },
    { name: 'Approved', value: activeLeaves, color: '#10B981' },
    { name: 'Rejected', value: MOCK_LEAVE_REQUESTS.filter(l => l.status === LeaveStatus.REJECTED).length, color: '#EF4444' },
  ];

  if (isLoading) {
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-32 animate-pulse flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                          <div className="space-y-2 flex-1">
                              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                              <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-96 animate-pulse"></div>
                  <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 h-96 animate-pulse"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Administrator Dashboard</h2>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Staff</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalStaff}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Leaves</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{pendingLeaves}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            <CalendarOff size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Staff on Leave</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{activeLeaves}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Enrollment Chart */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Student Enrollment by Year</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                  cursor={{ fill: '#f1f5f9', opacity: 0.2 }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Status Chart */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Leave Request Status</h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 ml-4">
              {leaveData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white dark:bg-slate-850 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent System Activities</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border-b last:border-0 border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  SYS
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">System Backup Completed</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Automated task ran successfully</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">2 hours ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;