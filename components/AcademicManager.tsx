import React, { useState, useEffect } from 'react';
import { Program, AvailableCourse, SystemUser, Student, Grade } from '../types';
import { MOCK_AVAILABLE_COURSES, MOCK_EMPLOYEES } from '../constants';
import { api } from '../services/api';
import { BookOpen, Book, Users, Layers, Plus, Search, Edit2, Trash2, CheckCircle, GraduationCap, X, ChevronRight, Filter, CheckSquare, Square, Trash, Loader2, ClipboardCheck, ArrowRight, Save } from 'lucide-react';
import CourseManager from './CourseManager';

interface AcademicManagerProps {
    currentUser: SystemUser | null;
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    currentAcademicYear: string;
    currentSemester: number;
}

const AcademicManager: React.FC<AcademicManagerProps> = ({ currentUser, students, setStudents, currentAcademicYear, currentSemester }) => {
  const [activeTab, setActiveTab] = useState<'programs' | 'courses' | 'assignments' | 'my_courses'>('programs');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<AvailableCourse[]>(MOCK_AVAILABLE_COURSES);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | ''>('');
  const [filterUnassigned, setFilterUnassigned] = useState(false);

  // Modal States
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  // Assignment View State
  const [assignmentView, setAssignmentView] = useState<'curriculum' | 'staffing'>('curriculum');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  // Lecturer Grading State
  const [selectedCourseForGrading, setSelectedCourseForGrading] = useState<AvailableCourse | null>(null);
  const [gradesInput, setGradesInput] = useState<Record<string, { classScore: string, examScore: string }>>({});

  // Forms
  const [programForm, setProgramForm] = useState<Partial<Program>>({});

  const isLecturer = currentUser?.roleIds.includes('ROLE-STAFF');

  useEffect(() => {
    const loadData = async () => {
        try {
            setIsLoading(true);
            const [programsData, coursesData] = await Promise.all([
                api.programs.getAll(),
                api.courses.getAll()
            ]);
            setPrograms(programsData);
            setCourses(coursesData);
            if (programsData.length > 0) {
                setSelectedProgramId(programsData[0].id);
            }
        } catch (error) {
            console.error("Failed to load academic data", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  // Set default tab for lecturers
  useEffect(() => {
      if (isLecturer && activeTab === 'programs') {
          setActiveTab('my_courses');
      }
  }, [isLecturer]);

  // --- Handlers: Programs ---

  const handleOpenProgramModal = (prog?: Program) => {
      if (prog) {
          setEditingProgramId(prog.id);
          setProgramForm(prog);
      } else {
          setEditingProgramId(null);
          setProgramForm({ durationYears: 4 });
      }
      setIsProgramModalOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!programForm.name || !programForm.code) return;

      try {
          if (editingProgramId) {
              const updatedProgram = await api.programs.update(editingProgramId, programForm);
              setPrograms(programs.map(p => p.id === editingProgramId ? updatedProgram : p));
          } else {
              const newProgram = await api.programs.create(programForm);
              setPrograms([...programs, newProgram]);
              if (!selectedProgramId) setSelectedProgramId(newProgram.id);
          }
          setIsProgramModalOpen(false);
      } catch (error) {
          console.error("Failed to save program", error);
      }
  };

  const handleDeleteProgram = async (id: string) => {
      if(window.confirm('Are you sure? This will remove the program.')) {
          try {
              await api.programs.delete(id);
              setPrograms(programs.filter(p => p.id !== id));
              if (selectedProgramId === id) {
                  setSelectedProgramId(programs.length > 1 ? programs.find(p => p.id !== id)?.id || '' : '');
              }
          } catch (error) {
              console.error("Failed to delete program", error);
          }
      }
  };

  // --- Handlers: Courses (Delegated to CourseManager) ---

  const handleAddCourse = async (course: AvailableCourse) => {
      try {
          const newCourse = await api.courses.create(course);
          setCourses(prev => [...prev, newCourse]);
      } catch (error) {
          console.error("Failed to create course", error);
      }
  };

  const handleBulkAddCourses = async (newCourses: AvailableCourse[]) => {
      // In a real app, use a bulk create endpoint.
      // For now, iterate.
      try {
          const createdCourses = await Promise.all(newCourses.map(c => api.courses.create(c)));
          setCourses(prev => [...prev, ...createdCourses]);
      } catch (error) {
          console.error("Failed to bulk create courses", error);
      }
  };

  const handleUpdateCourse = async (updatedCourse: AvailableCourse) => {
      try {
          // The API uses code as the identifier for courses
          const result = await api.courses.update(updatedCourse.code, updatedCourse);
          setCourses(courses.map(c => c.code === updatedCourse.code ? result : c));
      } catch (error) {
          console.error("Failed to update course", error);
      }
  };

  const handleDeleteCourse = async (code: string) => {
      try {
          await api.courses.delete(code);
          setCourses(courses.filter(c => c.code !== code));
      } catch (error) {
          console.error("Failed to delete course", error);
      }
  };

  // --- Handlers: Assignments ---

  const toggleCourseToProgram = async (courseCode: string, programId: string) => {
      const course = courses.find(c => c.code === courseCode);
      if (!course) return;

      const currentPrograms = course.programIds || [];
      let newPrograms: string[];
      
      if (currentPrograms.includes(programId)) {
          newPrograms = currentPrograms.filter(id => id !== programId);
      } else {
          newPrograms = [...currentPrograms, programId];
      }

      try {
          // Use code as ID
          const updatedCourse = await api.courses.update(course.code, { programIds: newPrograms });
          setCourses(prev => prev.map(c => c.code === courseCode ? updatedCourse : c));
      } catch (error) {
          console.error("Failed to update course assignment", error);
      }
  };

  const assignLecturer = async (courseCode: string, lecturerId: string) => {
      const course = courses.find(c => c.code === courseCode);
      if (!course) return;

      try {
          // Use code as ID
          const updatedCourse = await api.courses.update(course.code, { assignedLecturerId: lecturerId });
          setCourses(prev => prev.map(c => c.code === courseCode ? updatedCourse : c));
      } catch (error) {
          console.error("Failed to assign lecturer", error);
      }
  };

  // --- Handlers: Grading ---

  const handleSelectCourseForGrading = (course: AvailableCourse) => {
      setSelectedCourseForGrading(course);
      
      // Initialize inputs with existing grades if any
      const initialInputs: Record<string, { classScore: string, examScore: string }> = {};
      
      // Use Global State for Context
      const academicYear = currentAcademicYear;
      const semesterNum = currentSemester;

      students.forEach(student => {
          // Check if student is registered for this course
          if (student.registeredCourses?.includes(course.code)) {
              const history = student.academicHistory?.find(h => h.academicYear === academicYear && h.semesterNumber === semesterNum);
              const grade = history?.grades.find(g => g.courseCode === course.code);
              
              if (grade) {
                  // Reverse calculate approximate split for display if score exists
                  const score = grade.score;
                  initialInputs[student.id] = {
                      classScore: (score * 0.3).toFixed(0),
                      examScore: (score * 0.7).toFixed(0)
                  };
              } else {
                  initialInputs[student.id] = { classScore: '', examScore: '' };
              }
          }
      });
      setGradesInput(initialInputs);
  };

  const handleGradeInput = (studentId: string, type: 'classScore' | 'examScore', value: string) => {
      setGradesInput(prev => ({
          ...prev,
          [studentId]: {
              ...prev[studentId],
              [type]: value
          }
      }));
  };

  const calculateGrade = (total: number) => {
      if (total >= 80) return { grade: 'A', point: 4.0 };
      if (total >= 75) return { grade: 'B+', point: 3.5 };
      if (total >= 70) return { grade: 'B', point: 3.0 };
      if (total >= 65) return { grade: 'C+', point: 2.5 };
      if (total >= 60) return { grade: 'C', point: 2.0 };
      if (total >= 55) return { grade: 'D+', point: 1.5 };
      if (total >= 50) return { grade: 'D', point: 1.0 };
      return { grade: 'E', point: 0 }; // Fail
  };

  const handleSubmitGrades = async () => {
      if (!selectedCourseForGrading) return;

      const academicYear = currentAcademicYear;
      const semesterNum = currentSemester;
      const studentsToUpdate: Promise<any>[] = [];

      // Identify students with grade inputs
      for (const student of students) {
          const input = gradesInput[student.id];
          // Skip if student not registered for this course or no input
          if (!student.registeredCourses?.includes(selectedCourseForGrading.code) || !input) continue;
          
          const classScore = parseFloat(input.classScore) || 0;
          const examScore = parseFloat(input.examScore) || 0;
          const finalTotal = classScore + examScore; 
          
          const { grade, point } = calculateGrade(finalTotal);

          const newGrade: Grade = {
              courseCode: selectedCourseForGrading.code,
              courseTitle: selectedCourseForGrading.title,
              credits: selectedCourseForGrading.credits,
              score: finalTotal,
              grade: grade,
              gradePoint: point
          };

          // We need to send ALL grades for this semester for this student, not just this course.
          // So we need to fetch existing grades from student object, update/add this course grade, and send the whole list.
          
          const existingHistory = student.academicHistory?.find(h => h.academicYear === academicYear && h.semesterNumber === semesterNum);
          let currentSemesterGrades = existingHistory ? [...existingHistory.grades] : [];
          
          // Remove old grade for this course if exists
          currentSemesterGrades = currentSemesterGrades.filter(g => g.courseCode !== selectedCourseForGrading.code);
          // Add new grade
          currentSemesterGrades.push(newGrade);

          const semesterName = existingHistory?.semester || `Year ${student.year} - Sem ${semesterNum}`;

          studentsToUpdate.push(api.students.updateGrades(student.id, {
              academicYear,
              semesterNumber: semesterNum,
              semester: semesterName,
              grades: currentSemesterGrades
          }));
      }

      try {
          setIsLoading(true);
          await Promise.all(studentsToUpdate);
          
          // Reload students to get updated CGPA and history
          const updatedStudents = await api.students.getAll();
          setStudents(updatedStudents);
          
          alert(`Grades saved for ${academicYear}, Semester ${semesterNum} successfully!`);
          setSelectedCourseForGrading(null);
      } catch (error) {
          console.error("Failed to save grades", error);
          alert("Failed to save grades. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  // --- Render Helpers ---

  const uniqueDepts = Array.from(new Set(courses.map(c => c.department))).sort();

  const filteredPrograms = programs.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCoursesForAssignment = courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept ? c.department === filterDept : true;
      const matchesLevel = filterLevel ? c.level === filterLevel : true;
      return matchesSearch && matchesDept && matchesLevel;
  });

  const staffingCourses = filteredCoursesForAssignment.filter(c => {
      if (filterUnassigned) return !c.assignedLecturerId;
      return true;
  });

  // Lecturer Logic: Filter "My Courses"
  const lecturerCourses = courses.filter(c => c.assignedLecturerId === currentUser?.employeeId);

  const handleSelectAllFiltered = async () => {
      if (!selectedProgramId) return;
      const codesToUpdate = filteredCoursesForAssignment.map(c => c.code);
      
      // In a real app, we might want a bulk update endpoint.
      // For now, we'll iterate. This is not efficient for large datasets.
      for (const course of courses) {
          if (codesToUpdate.includes(course.code)) {
              const currentPrograms = course.programIds || [];
              if (!currentPrograms.includes(selectedProgramId)) {
                  await toggleCourseToProgram(course.code, selectedProgramId);
              }
          }
      }
  };

  const handleClearAllFiltered = async () => {
      if (!selectedProgramId) return;
      const codesToUpdate = filteredCoursesForAssignment.map(c => c.code);

      if (window.confirm("Are you sure you want to unassign all currently visible courses from this program?")) {
          for (const course of courses) {
              if (codesToUpdate.includes(course.code)) {
                  const currentPrograms = course.programIds || [];
                  if (currentPrograms.includes(selectedProgramId)) {
                      await toggleCourseToProgram(course.code, selectedProgramId);
                  }
              }
          }
      }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Academic Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Mount programs, courses, and manage curriculum allocations.</p>
        </div>
        {/* Context Display */}
        <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100 shadow-sm">
            Current Session: {currentAcademicYear}, Sem {currentSemester}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex space-x-8 min-w-max">
            {isLecturer && (
                <button
                    onClick={() => setActiveTab('my_courses')}
                    className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'my_courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <ClipboardCheck size={18} /> My Courses
                </button>
            )}
            <button
                onClick={() => setActiveTab('programs')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'programs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <GraduationCap size={18} /> Programs
            </button>
            <button
                onClick={() => setActiveTab('courses')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Book size={18} /> Courses
            </button>
            <button
                onClick={() => setActiveTab('assignments')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'assignments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Layers size={18} /> Allocations
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 overflow-hidden min-h-[600px] flex flex-col">
          
          {/* My Courses Tab (Lecturer View) */}
          {activeTab === 'my_courses' && isLecturer && (
              <div className="flex-1 p-6 overflow-y-auto">
                  {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                  ) : !selectedCourseForGrading ? (
                      // Course List
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {lecturerCourses.length > 0 ? lecturerCourses.map(course => (
                              <div key={course.code} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all bg-white group">
                                  <div className="flex justify-between items-start mb-4">
                                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold font-mono">{course.code}</span>
                                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Level {course.level}</span>
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-800 mb-2">{course.title}</h3>
                                  <p className="text-sm text-slate-500 mb-6">{course.credits} Credits • {course.department}</p>
                                  
                                  <button 
                                    onClick={() => handleSelectCourseForGrading(course)}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                  >
                                      <ClipboardCheck size={16} /> Manage Results
                                  </button>
                              </div>
                          )) : (
                              <div className="col-span-full text-center py-12 text-slate-500 italic">
                                  You have not been assigned to any courses yet.
                              </div>
                          )}
                      </div>
                  ) : (
                      // Grading Interface
                      <div className="space-y-6">
                          <button onClick={() => setSelectedCourseForGrading(null)} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium">
                              <ArrowRight size={16} className="rotate-180"/> Back to Course List
                          </button>
                          
                          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <div>
                                  <h3 className="text-xl font-bold text-blue-900">{selectedCourseForGrading.title} ({selectedCourseForGrading.code})</h3>
                                  <p className="text-sm text-blue-700 mt-1">Grading for Academic Year {currentAcademicYear} - Semester {currentSemester}</p>
                              </div>
                              <button 
                                onClick={handleSubmitGrades}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors"
                              >
                                  <Save size={18} /> Publish Results
                              </button>
                          </div>

                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                      <tr>
                                          <th className="px-6 py-4 font-semibold">Student ID</th>
                                          <th className="px-6 py-4 font-semibold">Name</th>
                                          <th className="px-6 py-4 font-semibold w-32">Class Score (30%)</th>
                                          <th className="px-6 py-4 font-semibold w-32">Exam Score (70%)</th>
                                          <th className="px-6 py-4 font-semibold w-24">Total</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {students.filter(s => s.registeredCourses?.includes(selectedCourseForGrading.code)).map(student => {
                                          const input = gradesInput[student.id] || { classScore: '', examScore: '' };
                                          const total = (parseFloat(input.classScore) || 0) + (parseFloat(input.examScore) || 0);
                                          return (
                                              <tr key={student.id} className="hover:bg-slate-50">
                                                  <td className="px-6 py-4 font-mono text-slate-600">{student.id}</td>
                                                  <td className="px-6 py-4 font-medium text-slate-800">{student.firstName} {student.lastName}</td>
                                                  <td className="px-6 py-4">
                                                      <input 
                                                        type="number" 
                                                        className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="0-30"
                                                        max={30}
                                                        value={input.classScore}
                                                        onChange={(e) => handleGradeInput(student.id, 'classScore', e.target.value)}
                                                      />
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <input 
                                                        type="number" 
                                                        className="w-full border border-slate-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="0-70"
                                                        max={70}
                                                        value={input.examScore}
                                                        onChange={(e) => handleGradeInput(student.id, 'examScore', e.target.value)}
                                                      />
                                                  </td>
                                                  <td className="px-6 py-4 font-bold text-slate-800">
                                                      {total > 0 ? total : '-'}
                                                  </td>
                                              </tr>
                                          );
                                      })}
                                      {students.filter(s => s.registeredCourses?.includes(selectedCourseForGrading.code)).length === 0 && (
                                          <tr>
                                              <td colSpan={5} className="p-8 text-center text-slate-500 italic">No registered students found for this course.</td>
                                          </tr>
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* Programs Tab */}
          {activeTab === 'programs' && (
              <div className="flex-1 flex flex-col p-6">
                  <div className="flex justify-between items-center mb-6">
                      <div className="relative w-full md:w-96">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                          <input
                              type="text"
                              placeholder="Search programs..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>
                      <button onClick={() => handleOpenProgramModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-sm transition-colors">
                          <Plus size={16} /> Add Program
                      </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                      ) : (
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <tr>
                                  <th className="px-6 py-4 font-semibold">Program Name</th>
                                  <th className="px-6 py-4 font-semibold">Code</th>
                                  <th className="px-6 py-4 font-semibold">Department</th>
                                  <th className="px-6 py-4 font-semibold">Duration</th>
                                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredPrograms.map(prog => (
                                  <tr key={prog.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-800">{prog.name}</td>
                                      <td className="px-6 py-4 font-mono text-slate-600">{prog.code}</td>
                                      <td className="px-6 py-4 text-slate-600">{prog.department}</td>
                                      <td className="px-6 py-4 text-slate-600">{prog.durationYears} Years</td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                              <button onClick={() => handleOpenProgramModal(prog)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                              <button onClick={() => handleDeleteProgram(prog.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      )}
                  </div>
              </div>
          )}

          {/* Courses Tab - Using New Component */}
          {activeTab === 'courses' && (
              <div className="h-full">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                  ) : (
                    <CourseManager 
                        courses={courses}
                        onAddCourse={handleAddCourse}
                        onBulkAddCourses={handleBulkAddCourses}
                        onUpdateCourse={handleUpdateCourse}
                        onDeleteCourse={handleDeleteCourse}
                    />
                  )}
              </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
              <div className="flex-1 flex flex-col">
                  {/* Sub-navigation */}
                  <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
                      <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                          <button 
                            onClick={() => { setAssignmentView('curriculum'); setSearchTerm(''); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${assignmentView === 'curriculum' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                              Program Curriculum
                          </button>
                          <button 
                            onClick={() => { setAssignmentView('staffing'); setSearchTerm(''); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${assignmentView === 'staffing' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                              Course Staffing
                          </button>
                      </div>
                      
                      {/* Contextual Filters */}
                      {assignmentView === 'curriculum' && (
                          <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500">Select Program:</span>
                              <select 
                                value={selectedProgramId}
                                onChange={(e) => setSelectedProgramId(e.target.value)}
                                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                  {programs.map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                              </select>
                          </div>
                      )}
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                      ) : (
                      <>
                      {assignmentView === 'curriculum' ? (
                          <div className="space-y-6">
                              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <div>
                                      <h3 className="font-bold text-slate-800 text-lg">Curriculum Builder</h3>
                                      <p className="text-xs text-slate-500 mt-1">Assign courses to <strong>{programs.find(p => p.id === selectedProgramId)?.name}</strong>.</p>
                                  </div>
                                  <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
                                      <div className="flex gap-2">
                                          <div className="relative flex-1 md:w-48">
                                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                                              <input 
                                                placeholder="Search..." 
                                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                              />
                                          </div>
                                          <select 
                                            value={filterDept} 
                                            onChange={(e) => setFilterDept(e.target.value)}
                                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                          >
                                              <option value="">All Depts</option>
                                              {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                                          </select>
                                          <select 
                                            value={filterLevel} 
                                            onChange={(e) => setFilterLevel(e.target.value ? Number(e.target.value) : '')}
                                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                          >
                                              <option value="">All Levels</option>
                                              <option value="100">100</option>
                                              <option value="200">200</option>
                                              <option value="300">300</option>
                                              <option value="400">400</option>
                                          </select>
                                      </div>
                                      <div className="flex gap-2">
                                          <button 
                                            onClick={handleSelectAllFiltered} 
                                            className="text-xs font-medium px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg flex items-center justify-center gap-1 transition-colors flex-1 md:flex-none"
                                          >
                                              <CheckSquare size={14} /> Select All
                                          </button>
                                          <button 
                                            onClick={handleClearAllFiltered} 
                                            className="text-xs font-medium px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg flex items-center justify-center gap-1 transition-colors flex-1 md:flex-none"
                                          >
                                              <Square size={14} /> Clear Selection
                                          </button>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {filteredCoursesForAssignment.map(course => {
                                      const isAssigned = course.programIds?.includes(selectedProgramId);
                                      return (
                                          <div 
                                            key={course.code} 
                                            onClick={() => toggleCourseToProgram(course.code, selectedProgramId)}
                                            className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between group select-none ${
                                                isAssigned 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-[1.01]' 
                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                            }`}
                                          >
                                              <div className="flex-1 mr-2 overflow-hidden">
                                                  <div className="flex items-center gap-2 mb-1.5">
                                                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${isAssigned ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{course.code}</span>
                                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isAssigned ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>L{course.level}</span>
                                                  </div>
                                                  <p className={`font-semibold text-sm leading-snug truncate ${isAssigned ? 'text-white' : 'text-slate-800'}`}>{course.title}</p>
                                                  <p className={`text-[11px] mt-1 truncate ${isAssigned ? 'text-blue-100' : 'text-slate-500'}`}>{course.credits} Credits • {course.department}</p>
                                              </div>
                                              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                                                  isAssigned 
                                                  ? 'bg-white text-blue-600' 
                                                  : 'bg-slate-100 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-400'
                                              }`}>
                                                  {isAssigned ? <CheckCircle size={16} /> : <Plus size={16} />}
                                              </div>
                                          </div>
                                      );
                                  })}
                                  {filteredCoursesForAssignment.length === 0 && (
                                      <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200 text-slate-400 italic">
                                          No courses found matching your filters.
                                      </div>
                                  )}
                              </div>
                          </div>
                      ) : (
                          // Staffing View
                          <div className="space-y-6">
                              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                  <div>
                                      <h3 className="font-bold text-slate-800 text-lg">Course Staffing</h3>
                                      <p className="text-sm text-slate-500">Assign lecturers to courses.</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                       <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                                          <input 
                                            type="checkbox" 
                                            id="unassigned" 
                                            checked={filterUnassigned} 
                                            onChange={e => setFilterUnassigned(e.target.checked)}
                                            className="rounded text-blue-600 focus:ring-blue-500" 
                                          />
                                          <label htmlFor="unassigned" className="text-sm text-slate-700 cursor-pointer select-none">Show Unassigned Only</label>
                                       </div>
                                       <div className="relative w-full md:w-64">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                                          <input 
                                            placeholder="Search courses..." 
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                          />
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                  <table className="w-full text-left text-sm">
                                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                          <tr>
                                              <th className="px-6 py-4 font-semibold">Course Details</th>
                                              <th className="px-6 py-4 font-semibold">Level & Dept</th>
                                              <th className="px-6 py-4 font-semibold">Assigned Lecturer</th>
                                              <th className="px-6 py-4 font-semibold text-right">Status</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                          {staffingCourses.map(course => {
                                              return (
                                                  <tr key={course.code} className="hover:bg-slate-50 transition-colors">
                                                      <td className="px-6 py-4">
                                                          <div className="flex items-center gap-3">
                                                              <div className="h-10 w-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                                                                  {course.code}
                                                              </div>
                                                              <div>
                                                                  <p className="font-medium text-slate-800">{course.title}</p>
                                                                  <p className="text-xs text-slate-500">{course.credits} Credits</p>
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="px-6 py-4">
                                                          <p className="text-slate-700">{course.department}</p>
                                                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Level {course.level}</span>
                                                      </td>
                                                      <td className="px-6 py-4">
                                                          <div className="relative">
                                                              <select 
                                                                value={course.assignedLecturerId || ''}
                                                                onChange={(e) => assignLecturer(course.code, e.target.value)}
                                                                className={`w-full max-w-xs pl-3 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors ${course.assignedLecturerId ? 'border-blue-200 bg-blue-50 text-blue-800 focus:ring-blue-500' : 'border-slate-300 bg-white text-slate-600 focus:ring-slate-400'}`}
                                                              >
                                                                  <option value="">-- Select Lecturer --</option>
                                                                  {MOCK_EMPLOYEES.map(emp => (
                                                                      <option key={emp.id} value={emp.id}>
                                                                          {emp.firstName} {emp.lastName} {emp.department !== course.department ? `(${emp.department})` : ''}
                                                                      </option>
                                                                  ))}
                                                              </select>
                                                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                  <ChevronRight size={14} className="rotate-90" />
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="px-6 py-4 text-right">
                                                          {course.assignedLecturerId ? (
                                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                                  <CheckCircle size={12} /> Assigned
                                                              </span>
                                                          ) : (
                                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                                                                  <Users size={12} /> Unassigned
                                                              </span>
                                                          )}
                                                      </td>
                                                  </tr>
                                              );
                                          })}
                                          {staffingCourses.length === 0 && (
                                              <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">No courses found matching criteria.</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                      </>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* Program Modal */}
      {isProgramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">{editingProgramId ? 'Edit Program' : 'Mount New Program'}</h3>
                      <button onClick={() => setIsProgramModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
                      <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">Program Name</label>
                          <input className="w-full border border-slate-300 rounded-lg p-2 text-sm" required value={programForm.name || ''} onChange={e => setProgramForm({...programForm, name: e.target.value})} placeholder="e.g. B.Ed. Primary Education" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Code</label>
                              <input className="w-full border border-slate-300 rounded-lg p-2 text-sm" required value={programForm.code || ''} onChange={e => setProgramForm({...programForm, code: e.target.value})} placeholder="BED-PRI" />
                          </div>
                          <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Duration (Years)</label>
                              <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm" required value={programForm.durationYears || 4} onChange={e => setProgramForm({...programForm, durationYears: parseInt(e.target.value)})} />
                          </div>
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                          <button type="button" onClick={() => setIsProgramModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save Program</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AcademicManager;