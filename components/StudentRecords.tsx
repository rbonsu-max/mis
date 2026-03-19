import React, { useState, useEffect, useRef } from 'react';
import { MOCK_AVAILABLE_COURSES } from '../constants';
import { Student, AvailableCourse, FeeRecord, SystemUser } from '../types';
import { api } from '../services/api';
import { Search, GraduationCap, ChevronRight, ArrowLeft, Mail, BookOpen, CreditCard, Calendar, User, Download, Plus, Edit2, Trash2, Eye, X, Save, CheckCircle, BookPlus, AlertTriangle, AlertCircle, UploadCloud, FileText, Banknote, Clock, CalendarDays, Loader2, FileSpreadsheet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface StudentRecordsProps {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    currentAcademicYear: string;
    currentSemester: number;
    currentUser: SystemUser | null;
}

const StudentRecords: React.FC<StudentRecordsProps> = ({ students, setStudents, currentAcademicYear, currentSemester, currentUser }) => {
  const isAdmin = currentUser?.roleIds.includes('ROLE-ADMIN') || currentUser?.roleIds.includes('ROLE-HR');
  const isStaff = currentUser?.roleIds.includes('ROLE-STAFF') || isAdmin;
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<number | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'financials' | 'registration'>('overview');

  // Missing states
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showToast, setShowToast] = useState<any>({show: false, message: '', type: 'success'});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<any>({});
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch students from API on mount
  useEffect(() => {
      const loadStudents = async () => {
          try {
              setIsLoading(true);
              const data = await api.students.getAll();
              setStudents(data);
          } catch (error) {
              console.error("Failed to fetch students:", error);
          } finally {
              setIsLoading(false);
          }
      };
      loadStudents();
  }, [setStudents]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'ALL' || student.year === filterYear;
    return matchesSearch && matchesYear;
  });

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return 'text-green-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.0) return 'text-amber-600';
    return 'text-red-600';
  };

  // --- Registration Logic ---
  
  const handleOpenStudent = (student: Student) => {
      setSelectedStudent(student);
      setSelectedCourses(student.registeredCourses || []);
      setActiveTab('overview');
  };

  const checkPrerequisites = (course: AvailableCourse): boolean => {
      if (!course.prerequisites || course.prerequisites.length === 0) return true;
      if (!selectedStudent || !selectedStudent.academicHistory) return false;

      // Get all passed courses from history
      const passedCourses = selectedStudent.academicHistory.flatMap(sem => sem.grades)
          .filter(g => g.grade !== 'F' && g.grade !== 'D' && g.grade !== 'E') 
          .map(g => g.courseCode);

      return course.prerequisites.every(prereq => passedCourses.includes(prereq));
  };

  const checkAlreadyPassed = (courseCode: string): boolean => {
       if (!selectedStudent || !selectedStudent.academicHistory) return false;
       const passedCourses = selectedStudent.academicHistory.flatMap(sem => sem.grades)
          .filter(g => g.grade !== 'F')
          .map(g => g.courseCode);
       return passedCourses.includes(courseCode);
  };

  const checkTimetableConflict = (newCourse: AvailableCourse, currentCodes: string[]) => {
      const currentCourses = MOCK_AVAILABLE_COURSES.filter(c => currentCodes.includes(c.code));
      
      for (const existing of currentCourses) {
          if (!existing.schedule || !newCourse.schedule) continue;
          
          for (const newSlot of newCourse.schedule) {
              for (const existingSlot of existing.schedule) {
                  if (newSlot.day === existingSlot.day) {
                      const startA = parseInt(newSlot.startTime.replace(':', ''));
                      const endA = parseInt(newSlot.endTime.replace(':', ''));
                      const startB = parseInt(existingSlot.startTime.replace(':', ''));
                      const endB = parseInt(existingSlot.endTime.replace(':', ''));
                      
                      // Simple overlap check: StartA < EndB && StartB < EndA
                      if (startA < endB && startB < endA) {
                          return {
                              existingCourse: existing,
                              day: newSlot.day,
                              existingTime: `${existingSlot.startTime}-${existingSlot.endTime}`,
                              newTime: `${newSlot.startTime}-${newSlot.endTime}`
                          };
                      }
                  }
              }
          }
      }
      return null;
  };

  const handleToggleCourse = (course: AvailableCourse) => {
      if (checkAlreadyPassed(course.code)) {
          setShowToast({ show: true, message: 'You have already passed this course.', type: 'info' });
          setTimeout(() => setShowToast({ ...showToast, show: false }), 3000);
          return;
      }

      if (!checkPrerequisites(course)) {
          setShowToast({ show: true, message: 'Prerequisites not met for this course.', type: 'error' });
          setTimeout(() => setShowToast({ ...showToast, show: false }), 3000);
          return;
      }

      setSelectedCourses(prev => {
          if (prev.includes(course.code)) {
              return prev.filter(c => c !== course.code);
          } else {
              // Check credit limit
              const currentCredits = prev.reduce((sum, code) => {
                  const c = MOCK_AVAILABLE_COURSES.find(mc => mc.code === code);
                  return sum + (c ? c.credits : 0);
              }, 0);
              
              if (currentCredits + course.credits > 24) {
                  setShowToast({ show: true, message: 'Credit limit exceeded (Max 24).', type: 'error' });
                  setTimeout(() => setShowToast({ ...showToast, show: false }), 3000);
                  return prev;
              }

              // Check Timetable Conflict
              const conflict = checkTimetableConflict(course, prev);
              if (conflict) {
                  const { existingCourse, day, existingTime, newTime } = conflict;
                  setShowToast({ 
                      show: true, 
                      message: `Timetable conflict: ${course.code} (${newTime}) overlaps with ${existingCourse.code} (${existingTime}) on ${day}.`, 
                      type: 'error' 
                  });
                  setTimeout(() => setShowToast({ ...showToast, show: false }), 6000);
                  return prev;
              }

              return [...prev, course.code];
          }
      });
  };

  const handleRegisterCourses = () => {
      if (!selectedStudent) return;
      
      const updatedStudent = {
          ...selectedStudent,
          registeredCourses: selectedCourses
      };
      
      setSelectedStudent(updatedStudent);
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      
      setShowToast({ show: true, message: `Courses registered for ${currentAcademicYear} Sem ${currentSemester} successfully.`, type: 'success' });
      setTimeout(() => setShowToast({ ...showToast, show: false }), 3000);
  };

  // --- Timetable Logic ---

  const getStudentTimetable = () => {
    if (!selectedStudent || !selectedStudent.registeredCourses) return [];
    
    // Get full course objects for registered courses
    const myCourses = MOCK_AVAILABLE_COURSES.filter(c => 
        selectedStudent.registeredCourses?.includes(c.code) && c.schedule
    );

    let flatSchedule: any[] = [];

    const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    myCourses.forEach(course => {
        course.schedule?.forEach(slot => {
            flatSchedule.push({
                courseCode: course.code,
                courseTitle: course.title,
                day: slot.day,
                startTime: slot.startTime,
                endTime: slot.endTime,
                venue: slot.venue,
                startMin: parseTime(slot.startTime),
                endMin: parseTime(slot.endTime)
            });
        });
    });

    // Detect conflicts
    const scheduleWithConflicts = flatSchedule.map((slot, index, array) => {
        const hasConflict = array.some((other, otherIndex) => {
            if (index === otherIndex) return false; // Don't compare with self
            if (slot.day !== other.day) return false; // Different days
            
            // Check overlap: StartA < EndB && StartB < EndA
            return slot.startMin < other.endMin && other.startMin < slot.endMin;
        });
        return { ...slot, hasConflict };
    });

    // Sort by Day then Time
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    scheduleWithConflicts.sort((a, b) => {
        const dayDiff = daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.startMin - b.startMin;
    });

    return scheduleWithConflicts;
  };


  // --- Actions ---

  const handleExportData = () => {
    if (filteredStudents.length === 0) {
        alert("No data to export.");
        return;
    }
    const headers = ["Student ID", "First Name", "Last Name", "Email", "Program", "Year", "GPA", "Status", "Enrollment Date"];
    const rows = filteredStudents.map(s => [
        `"${s.id}"`,
        `"${s.firstName}"`,
        `"${s.lastName}"`,
        `"${s.email}"`,
        `"${s.program}"`,
        s.year,
        (s.gpa ?? 0).toFixed(2),
        s.status,
        `"${s.enrollmentDate}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `student_records_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddClick = () => {
      setEditingId(null);
      setFormData({
        firstName: '',
        lastName: '',
        id: '',
        program: '',
        year: 1,
        email: '',
        status: 'Active',
        enrollmentDate: new Date().toISOString().split('T')[0],
        gpa: 0.0
      });
      setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, student: Student) => {
      e.stopPropagation();
      setEditingId(student.id);
      setFormData({ ...student });
      setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this student record?")) {
          setStudents(prev => prev.filter(s => s.id !== id));
      }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.firstName || !formData.lastName || !formData.id || !formData.program) {
          alert("Please fill in all required fields.");
          return;
      }

      if (editingId) {
          setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...formData } as Student : s));
      } else {
          // Add new
          const newStudent = { ...formData } as Student;
          // Ensure arrays exist
          newStudent.academicHistory = [];
          newStudent.financialHistory = [];
          setStudents(prev => [newStudent, ...prev]);
      }
      setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: name === 'year' || name === 'gpa' ? Number(value) : value
      }));
  };

  // --- Payment Logic ---

  const handlePaymentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudent) return;
      if (!paymentForm.amount || !paymentForm.bankName || !paymentForm.draftNumber) {
          alert("Please fill in all required payment details");
          return;
      }

      const currentHistory = selectedStudent.financialHistory || [];
      const paymentAmount = parseFloat(paymentForm.amount);
      
      // Calculate previous balance
      const debits = currentHistory.filter(f => f.type === 'DEBIT').reduce((acc, curr) => acc + curr.amount, 0);
      const credits = currentHistory.filter(f => f.type === 'CREDIT').reduce((acc, curr) => acc + curr.amount, 0);
      const currentBalance = debits - credits;
      const newBalance = currentBalance - paymentAmount;

      const newTransaction: FeeRecord = {
          id: `TXN-${Date.now()}`,
          date: paymentForm.date,
          description: `Payment via Banker's Draft - ${paymentForm.bankName}`,
          amount: paymentAmount,
          type: 'CREDIT',
          balance: newBalance,
          paymentMethod: 'Bank Draft',
          referenceNumber: paymentForm.draftNumber
      };

      const updatedStudent = {
          ...selectedStudent,
          financialHistory: [...currentHistory, newTransaction]
      };

      setSelectedStudent(updatedStudent);
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      
      setIsPaymentModalOpen(false);
      setPaymentForm({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          bankName: '',
          draftNumber: '',
          receiptFile: null
      });
      
      setShowToast({ show: true, message: 'Payment recorded successfully.', type: 'success' });
      setTimeout(() => setShowToast({ ...showToast, show: false }), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setPaymentForm(prev => ({ ...prev, receiptFile: e.target.files![0] }));
      }
  };

  // --- Bulk Import Logic ---

  const handleDownloadTemplate = () => {
    const headers = ["FirstName", "LastName", "StudentID", "Email", "Program", "Year", "EnrollmentDate"];
    const rows = [
        headers,
        ["Kwame", "Mensah", "OLA-2024-999", "k.mensah@example.com", "B.Ed. Primary Education", "1", "2024-09-01"],
        ["Ama", "Osei", "OLA-2024-998", "a.osei@example.com", "B.Ed. Mathematics", "2", "2023-09-01"]
    ];
    
    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setBulkFile(e.target.files[0]);
      }
  };

  const handleProcessBulkImport = () => {
    if (!bulkFile) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (!text) return;

        // Split by new line
        const lines = text.split(/\r\n|\n/);
        const newStudents: Student[] = [];
        let skippedCount = 0;
        
        // Skip header row (index 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Regex to parse CSV line, correctly handling quotes
            const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, '').trim());

            // Basic validation: needs at least 7 fields based on template
            // FirstName, LastName, StudentID, Email, Program, Year, EnrollmentDate
            if (parts.length < 7) {
                skippedCount++;
                continue;
            }

            const newStudent: Student = {
                firstName: parts[0],
                lastName: parts[1],
                id: parts[2],
                email: parts[3],
                program: parts[4],
                year: parseInt(parts[5]) || 1,
                enrollmentDate: parts[6],
                status: 'Active',
                gpa: 0.0,
                academicHistory: [],
                financialHistory: [],
                attendance: 100,
                registeredCourses: []
            };
            newStudents.push(newStudent);
        }

        if (newStudents.length > 0) {
            setStudents(prev => [...newStudents, ...prev]);
            setShowToast({ show: true, message: `Successfully imported ${newStudents.length} students.${skippedCount > 0 ? ` Skipped ${skippedCount} invalid rows.` : ''}`, type: 'success' });
            setTimeout(() => setShowToast({ ...showToast, show: false }), 4000);
            setIsBulkImportModalOpen(false);
            setBulkFile(null);
        } else {
            alert("No valid records found in the uploaded file. Please ensure you are using the correct template.");
        }
    };
    reader.readAsText(bulkFile);
  };

  const handleCloseBulkModal = () => {
      setIsBulkImportModalOpen(false);
      setBulkFile(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const renderStudentList = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Student Records</h2>
           <p className="text-sm text-slate-500">Manage and view student academic and financial data.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
                onClick={handleExportData}
                className="flex-1 md:flex-none justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
            >
                <Download size={16} /> Export Data
            </button>
            {isAdmin && (
                <>
                    <button 
                        onClick={() => setIsBulkImportModalOpen(true)}
                        className="flex-1 md:flex-none justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                    >
                        <FileSpreadsheet size={16} /> Import Students
                    </button>
                    <button 
                        onClick={handleAddClick}
                        className="flex-1 md:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                    >
                        <Plus size={16} /> Add Student
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
             <span className="text-sm text-slate-500 whitespace-nowrap">Filter Year:</span>
             <div className="flex bg-slate-100 p-1 rounded-lg">
                 {['ALL', 1, 2, 3, 4].map(year => (
                     <button
                        key={year}
                        onClick={() => setFilterYear(year as number | 'ALL')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${filterYear === year ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                         {year === 'ALL' ? 'All' : `Yr ${year}`}
                     </button>
                 ))}
             </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600">Student Name</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">ID Number</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Program</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Level</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">GPA</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(student => (
                        <tr key={student.id} onClick={() => handleOpenStudent(student)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shrink-0">
                                         {student.photo ? (
                                             <img src={student.photo} alt="" className="w-full h-full object-cover" />
                                         ) : (
                                             <span>{student.firstName[0]}{student.lastName[0]}</span>
                                         )}
                                    </div>
                                    <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{student.firstName} {student.lastName}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500">{student.id}</td>
                            <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={student.program}>{student.program}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">Year {student.year}</span>
                            </td>
                            <td className={`px-6 py-4 font-bold ${getGPAColor(student.gpa)}`}>{(student.gpa ?? 0).toFixed(2)}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {student.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleOpenStudent(student)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="View Details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    {isAdmin && (
                                        <>
                                            <button 
                                                onClick={(e) => handleEditClick(e, student)}
                                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                title="Edit Student"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteClick(e, student.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete Student"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500">No students found matching your search.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">First Name</label>
                            <input name="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Kwame"/>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                            <input name="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. Mensah"/>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Student ID</label>
                        <input name="id" required value={formData.id} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. OLA-2024-001"/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="student@ola.edu.gh"/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Program</label>
                        <select name="program" required value={formData.program} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                            <option value="">Select Program</option>
                            <option value="B.Ed. Primary Education">B.Ed. Primary Education</option>
                            <option value="B.Ed. JHS Education">B.Ed. JHS Education</option>
                            <option value="B.Ed. Early Childhood">B.Ed. Early Childhood</option>
                            <option value="B.Ed. Mathematics">B.Ed. Mathematics</option>
                            <option value="B.Ed. Science">B.Ed. Science</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Year Level</label>
                            <select name="year" value={formData.year} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                <option value={1}>Year 1</option>
                                <option value={2}>Year 2</option>
                                <option value={3}>Year 3</option>
                                <option value={4}>Year 4</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                <option value="Active">Active</option>
                                <option value="Graduated">Graduated</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-auto">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2">
                            <Save size={16} /> Save Student
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-green-600"/>
                    Import Students
                </h3>
                <button onClick={handleCloseBulkModal}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">Step 1: Download Template</h4>
                    <p className="text-xs text-blue-600 mb-3">Use the standard CSV template to ensure data is formatted correctly.</p>
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors w-full justify-center">
                        <Download size={16} /> Download CSV Template
                    </button>
                </div>

                <div>
                     <h4 className="text-sm font-bold text-slate-700 mb-2">Step 2: Upload CSV File</h4>
                     <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 transition-colors bg-slate-50 relative">
                         {bulkFile ? (
                             <div className="flex items-center gap-3 relative z-10">
                                 <FileSpreadsheet size={32} className="text-green-500" />
                                 <div className="text-left">
                                     <p className="text-sm font-medium text-slate-800 max-w-[150px] truncate">{bulkFile.name}</p>
                                     <p className="text-xs text-slate-500">{(bulkFile.size / 1024).toFixed(2)} KB</p>
                                 </div>
                                 <button onClick={() => { setBulkFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="ml-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
                             </div>
                         ) : (
                             <>
                                <UploadCloud size={32} className="text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600 font-medium">Click to select or drag file here</p>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept=".csv" 
                                    onChange={handleBulkFileChange} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                />
                             </>
                         )}
                     </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button onClick={handleCloseBulkModal} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-white text-sm font-medium">Cancel</button>
                <button onClick={handleProcessBulkImport} disabled={!bulkFile} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bulkFile ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Import Students</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStudentDetails = () => {
      if (!selectedStudent) return null;
      
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 overflow-hidden">
                        {selectedStudent.photo ? <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" /> : <span>{selectedStudent.firstName[0]}{selectedStudent.lastName[0]}</span>}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                        <p className="text-sm text-slate-500 font-mono">{selectedStudent.id} • {selectedStudent.program}</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Current Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${selectedStudent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedStudent.status}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 gap-6">
                <button onClick={() => setActiveTab('overview')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Overview</button>
                <button onClick={() => setActiveTab('academics')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'academics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Academics</button>
                <button onClick={() => setActiveTab('financials')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'financials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Financials</button>
                <button onClick={() => setActiveTab('registration')} className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'registration' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Registration</button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 bg-slate-50/50">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Student Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-slate-500">Email</p><p className="font-medium">{selectedStudent.email}</p></div>
                                <div><p className="text-slate-500">Enrollment Date</p><p className="font-medium">{selectedStudent.enrollmentDate}</p></div>
                                <div><p className="text-slate-500">Current Year</p><p className="font-medium">Year {selectedStudent.year}</p></div>
                                <div><p className="text-slate-500">GPA</p><p className={`font-bold ${getGPAColor(selectedStudent.gpa ?? 0)}`}>{(selectedStudent.gpa ?? 0).toFixed(2)}</p></div>
                                <div><p className="text-slate-500">Attendance</p><p className="font-medium">{selectedStudent.attendance}%</p></div>
                            </div>
                        </div>
                        {/* Academic Performance Chart */}
                         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-64 flex flex-col">
                             <p className="text-slate-800 font-bold text-sm mb-4">Academic Performance Trend (GPA)</p>
                             <div className="flex-1 w-full min-h-0">
                                {selectedStudent.academicHistory && selectedStudent.academicHistory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={selectedStudent.academicHistory.map(h => ({
                                            name: h.semester.replace('Year ', 'Y').replace(' - Semester ', 'S'),
                                            gpa: h.gpa ?? 0
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                            <YAxis domain={[0, 4]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: '#2563eb', fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                            <Line type="monotone" dataKey="gpa" stroke="#2563eb" strokeWidth={2} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 italic text-xs">
                                        No academic history available to chart.
                                    </div>
                                )}
                             </div>
                         </div>
                    </div>
                )}
                {activeTab === 'academics' && (
                    <div className="space-y-6">
                        {/* CGPA Summary */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-blue-900">Academic Summary</h4>
                                 <p className="text-sm text-blue-700">Cumulative Grade Point Average (CGPA)</p>
                             </div>
                             <div className="text-right">
                                <div className="text-3xl font-bold text-blue-700">
                                    {(selectedStudent.gpa ?? 0).toFixed(2)}
                                </div>
                                <p className="text-xs text-blue-600 font-medium">
                                    Total Credits: {selectedStudent.academicHistory?.reduce((acc, sem) => acc + sem.creditsEarned, 0) || 0}
                                </p>
                             </div>
                        </div>

                         {selectedStudent.academicHistory && selectedStudent.academicHistory.length > 0 ? selectedStudent.academicHistory.map((sem, idx) => {
                             // Calculate CGPA up to this semester (Fallback)
                             const previousSemesters = selectedStudent.academicHistory!.slice(0, idx + 1);
                             const totalPoints = previousSemesters.reduce((acc, s) => acc + (s.gpa * s.creditsEarned), 0);
                             const totalCredits = previousSemesters.reduce((acc, s) => acc + s.creditsEarned, 0);
                             const calculatedCGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
                             
                             const displayCGPA = (sem.cgpa ?? Number(calculatedCGPA)).toFixed(2);

                             return (
                             <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                 <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                                     <h4 className="font-bold text-slate-700">{sem.semester} ({sem.academicYear})</h4>
                                     <div className="flex gap-4 text-sm text-slate-600">
                                         <div>GPA: <span className="font-bold text-blue-600">{(sem.gpa ?? 0).toFixed(2)}</span></div>
                                         <div>CGPA: <span className="font-bold text-blue-800">{(sem.cgpa ?? Number(calculatedCGPA)).toFixed(2)}</span></div>
                                     </div>
                                 </div>
                                 <table className="w-full text-sm text-left">
                                     <thead className="bg-slate-50/50 text-slate-500">
                                         <tr>
                                             <th className="px-6 py-2">Course</th>
                                             <th className="px-6 py-2">Title</th>
                                             <th className="px-6 py-2 text-center">Credits</th>
                                             <th className="px-6 py-2 text-center">Grade</th>
                                             <th className="px-6 py-2 text-center">Score</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100">
                                         {sem.grades.map((grade, gIdx) => (
                                             <tr key={gIdx}>
                                                 <td className="px-6 py-3 font-mono text-xs">{grade.courseCode}</td>
                                                 <td className="px-6 py-3">{grade.courseTitle}</td>
                                                 <td className="px-6 py-3 text-center">{grade.credits}</td>
                                                 <td className="px-6 py-3 text-center font-bold">{grade.grade}</td>
                                                 <td className="px-6 py-3 text-center text-slate-500">{grade.score}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         )}) : (
                             <div className="text-center py-12 text-slate-500">No academic records found.</div>
                         )}
                    </div>
                )}
                {activeTab === 'financials' && (
                    <div className="space-y-4">
                         <div className="flex justify-end">
                             <button onClick={() => setIsPaymentModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                                 <Banknote size={16} /> Record Payment
                             </button>
                         </div>
                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                     <tr>
                                         <th className="px-6 py-3">Date</th>
                                         <th className="px-6 py-3">Description</th>
                                         <th className="px-6 py-3">Ref No.</th>
                                         <th className="px-6 py-3 text-right">Debit</th>
                                         <th className="px-6 py-3 text-right">Credit</th>
                                         <th className="px-6 py-3 text-right">Balance</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {selectedStudent.financialHistory?.map((fee) => (
                                         <tr key={fee.id}>
                                             <td className="px-6 py-3 whitespace-nowrap text-slate-500">{fee.date}</td>
                                             <td className="px-6 py-3">{fee.description}</td>
                                             <td className="px-6 py-3 font-mono text-xs text-slate-400">{fee.referenceNumber}</td>
                                             <td className="px-6 py-3 text-right text-red-600">{fee.type === 'DEBIT' ? (fee.amount ?? 0).toFixed(2) : '-'}</td>
                                             <td className="px-6 py-3 text-right text-green-600">{fee.type === 'CREDIT' ? (fee.amount ?? 0).toFixed(2) : '-'}</td>
                                             <td className="px-6 py-3 text-right font-bold">{(fee.balance ?? 0).toFixed(2)}</td>
                                         </tr>
                                     ))}
                                     {(!selectedStudent.financialHistory || selectedStudent.financialHistory.length === 0) && (
                                         <tr><td colSpan={6} className="p-8 text-center text-slate-500">No transactions recorded.</td></tr>
                                     )}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                )}
                {activeTab === 'registration' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-blue-900">Course Registration</h4>
                                 <p className="text-sm text-blue-700">Academic Year: {currentAcademicYear}, Semester {currentSemester}</p>
                             </div>
                             <button onClick={handleRegisterCourses} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                                 Submit Registration
                             </button>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                     <tr>
                                         <th className="px-6 py-3 w-12 text-center">Select</th>
                                         <th className="px-6 py-3">Code</th>
                                         <th className="px-6 py-3">Course Title</th>
                                         <th className="px-6 py-3 text-center">Credits</th>
                                         <th className="px-6 py-3 text-center">Level</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {MOCK_AVAILABLE_COURSES.filter(c => c.semester === currentSemester).map(course => {
                                         const isSelected = selectedCourses.includes(course.code);
                                         const passed = checkAlreadyPassed(course.code);
                                         return (
                                             <tr key={course.code} className={`hover:bg-slate-50 ${passed ? 'bg-slate-50 opacity-60' : ''}`}>
                                                 <td className="px-6 py-3 text-center">
                                                     <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => handleToggleCourse(course)}
                                                        disabled={passed}
                                                        className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                                     />
                                                 </td>
                                                 <td className="px-6 py-3 font-mono text-xs">{course.code}</td>
                                                 <td className="px-6 py-3">
                                                     {course.title}
                                                     {passed && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Passed</span>}
                                                 </td>
                                                 <td className="px-6 py-3 text-center">{course.credits}</td>
                                                 <td className="px-6 py-3 text-center">{course.level}</td>
                                             </tr>
                                         );
                                     })}
                                 </tbody>
                             </table>
                        </div>
                        
                        {/* Timetable View */}
                         <div className="mt-8">
                             <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18}/> Student Timetable</h4>
                             <div className="grid grid-cols-5 gap-4">
                                 {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                     const slots = getStudentTimetable().filter((s: any) => s.day === day);
                                     return (
                                         <div key={day} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                             <div className="bg-slate-200 p-2 text-center text-xs font-bold text-slate-700">{day}</div>
                                             <div className="p-2 space-y-2 min-h-[150px]">
                                                 {slots.map((slot: any, idx: number) => (
                                                     <div key={idx} className={`p-2 rounded border text-xs ${slot.hasConflict ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                         <div className="font-bold text-slate-800">{slot.courseCode}</div>
                                                         <div className="text-slate-500">{slot.startTime} - {slot.endTime}</div>
                                                         <div className="text-slate-400 italic truncate">{slot.venue}</div>
                                                         {slot.hasConflict && <div className="text-red-500 font-bold text-[10px] mt-1 flex items-center gap-1"><AlertTriangle size={10}/> Conflict</div>}
                                                     </div>
                                                 ))}
                                                 {slots.length === 0 && <div className="text-center text-slate-300 text-xs py-4">Free</div>}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                    </div>
                )}
            </div>

             {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Record Fee Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Payment Date</label>
                                <input type="date" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Amount (GHS)</label>
                                <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} placeholder="0.00" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Bank Name</label>
                                    <input className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={paymentForm.bankName} onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})} placeholder="e.g. GCB" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Draft Number</label>
                                    <input className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={paymentForm.draftNumber} onChange={(e) => setPaymentForm({...paymentForm, draftNumber: e.target.value})} placeholder="Ref No." />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Upload Receipt (Optional)</label>
                                <input type="file" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300">
        {selectedStudent ? renderStudentDetails() : renderStudentList()}

        {/* Toast Notification */}
        {showToast.show && (
            <div className={`fixed top-20 right-4 z-50 bg-white border-l-4 shadow-lg rounded-r-lg p-4 flex items-center gap-3 max-w-sm ${showToast.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                {showToast.type === 'error' ? <AlertCircle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
                <p className="text-sm text-slate-700">{showToast.message}</p>
            </div>
        )}
    </div>
  );
};

export default StudentRecords;