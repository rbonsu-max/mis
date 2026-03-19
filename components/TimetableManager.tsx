import React, { useState, useEffect } from 'react';
import { AvailableCourse, Program } from '../types';
import { api } from '../services/api';
import { Search, Filter, CalendarClock, MapPin, Clock, BookOpen, Users, Loader2 } from 'lucide-react';

const TimetableManager: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('100');
  const [selectedSemester, setSelectedSemester] = useState<string>('1');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [courses, setCourses] = useState<AvailableCourse[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [coursesData, programsData] = await Promise.all([
                api.courses.getAll(),
                api.programs.getAll()
            ]);
            setCourses(coursesData);
            setPrograms(programsData);
        } catch (error) {
            console.error("Failed to load timetable data", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesProgram = selectedProgram ? course.programIds?.includes(selectedProgram) : true;
    const matchesLevel = selectedLevel ? course.level === parseInt(selectedLevel) : true;
    const matchesSemester = selectedSemester ? course.semester === parseInt(selectedSemester) : true;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show courses that have a schedule
    const hasSchedule = course.schedule && course.schedule.length > 0;

    return matchesProgram && matchesLevel && matchesSemester && matchesSearch && hasSchedule;
  });

  const getCoursesForDay = (day: string) => {
    return filteredCourses.filter(course => 
      course.schedule?.some(s => s.day === day)
    ).sort((a, b) => {
      // Sort by start time
      const timeA = a.schedule?.find(s => s.day === day)?.startTime || '';
      const timeB = b.schedule?.find(s => s.day === day)?.startTime || '';
      return timeA.localeCompare(timeB);
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Master Timetable</h2>
          <p className="text-sm text-slate-500 mt-1">View class schedules by program and level.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="Search course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <select 
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
                >
                    <option value="">All Programs</option>
                    {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <select 
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="">All Levels</option>
                    <option value="100">Level 100</option>
                    <option value="200">Level 200</option>
                    <option value="300">Level 300</option>
                    <option value="400">Level 400</option>
                </select>

                <select 
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                </select>
            </div>
        </div>
      </div>

      {/* Timetable Grid (Kanban Style) */}
      <div className="flex-1 overflow-x-auto pb-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
          <div className="min-w-[1000px] grid grid-cols-5 gap-4 h-full">
              {days.map(day => {
                  const dayCourses = getCoursesForDay(day);
                  return (
                      <div key={day} className="flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                          <div className="p-3 bg-white border-b border-slate-200 font-bold text-slate-700 text-center sticky top-0 z-10 shadow-sm">
                              {day}
                          </div>
                          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-16rem)] custom-scrollbar">
                              {dayCourses.length > 0 ? (
                                  dayCourses.map(course => {
                                      const slot = course.schedule?.find(s => s.day === day);
                                      if (!slot) return null;
                                      return (
                                          <div key={`${course.code}-${day}`} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
                                              <div className="flex justify-between items-start mb-2">
                                                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{course.code}</span>
                                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{course.credits} Cr</span>
                                              </div>
                                              <h4 className="font-bold text-sm text-slate-800 leading-tight mb-2 line-clamp-2" title={course.title}>
                                                  {course.title}
                                              </h4>
                                              <div className="space-y-1.5">
                                                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                      <Clock size={12} className="text-blue-500" />
                                                      <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                      <MapPin size={12} className="text-red-400" />
                                                      <span>{slot.venue || 'TBA'}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                      <Users size={12} className="text-amber-500" />
                                                      <span className="truncate max-w-[120px]" title={course.assignedLecturerId || 'Unassigned'}>
                                                          {course.assignedLecturerId || 'Unassigned'}
                                                      </span>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })
                              ) : (
                                  <div className="h-24 flex flex-col items-center justify-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-lg">
                                      <CalendarClock size={20} className="mb-1 opacity-50" />
                                      <span>No classes</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
          )}
      </div>
    </div>
  );
};

export default TimetableManager;