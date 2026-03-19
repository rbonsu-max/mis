import React, { useState, useRef } from 'react';
import { AvailableCourse } from '../types';
import { Search, Plus, Edit2, Trash2, Filter, X, Book, Check, FileSpreadsheet, UploadCloud, Download } from 'lucide-react';

interface CourseManagerProps {
  courses: AvailableCourse[];
  onAddCourse: (course: AvailableCourse) => void;
  onBulkAddCourses: (courses: AvailableCourse[]) => void;
  onUpdateCourse: (course: AvailableCourse) => void;
  onDeleteCourse: (code: string) => void;
}

const CourseManager: React.FC<CourseManagerProps> = ({ courses, onAddCourse, onBulkAddCourses, onUpdateCourse, onDeleteCourse }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | ''>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  
  // Bulk Upload State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Partial<AvailableCourse> = {
      code: '',
      title: '',
      credits: 3,
      level: 100,
      semester: 1,
      department: '',
      prerequisites: []
  };
  const [formData, setFormData] = useState<Partial<AvailableCourse>>(initialFormState);

  // --- Helpers ---
  const uniqueDepts = Array.from(new Set(courses.map(c => c.department))).sort();

  const filteredCourses = courses.filter(course => {
      const matchesSearch = 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        course.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept ? course.department === filterDept : true;
      const matchesLevel = filterLevel ? course.level === filterLevel : true;
      
      return matchesSearch && matchesDept && matchesLevel;
  });

  // --- Handlers ---
  const handleOpenModal = (course?: AvailableCourse) => {
      if (course) {
          setEditingCode(course.code);
          setFormData({ ...course });
      } else {
          setEditingCode(null);
          setFormData(initialFormState);
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.code || !formData.title || !formData.department) return;

      const courseData = formData as AvailableCourse;

      if (editingCode) {
          onUpdateCourse(courseData);
      } else {
          onAddCourse(courseData);
      }
      setIsModalOpen(false);
  };

  // --- Bulk Upload Handlers ---
  
  const handleDownloadTemplate = () => {
      const headers = ["CourseCode", "CourseTitle", "Credits", "Level", "Semester", "Department", "Prerequisites"];
      const rows = [
          headers,
          ["CSC101", "\"Intro to Computer Science\"", "3", "100", "1", "Science", "\"\""],
          ["MTH201", "\"Calculus I\"", "3", "200", "1", "Mathematics", "\"MTH101\""]
      ];

      const csvContent = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "courses_upload_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setBulkFile(e.target.files[0]);
      }
  };

  const handleProcessBulkUpload = () => {
      if (!bulkFile) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target?.result as string;
          if (!text) return;

          const lines = text.split(/\r\n|\n/);
          const newCourses: AvailableCourse[] = [];
          let skippedCount = 0;

          // Skip header row
          for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              // Handle CSV parsing with potential quoted strings
              const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, '').trim());
              
              // Basic check: Code, Title, Credits, Level, Semester, Dept (6 fields)
              if (parts.length < 6) {
                  skippedCount++;
                  continue;
              }

              const newCourse: AvailableCourse = {
                  code: parts[0] || `CRS-${Date.now()}-${i}`,
                  title: parts[1] || 'Untitled Course',
                  credits: parseInt(parts[2]) || 3,
                  level: parseInt(parts[3]) || 100,
                  semester: parseInt(parts[4]) || 1,
                  department: parts[5] || 'General',
                  prerequisites: parts[6] ? parts[6].split(';').map(p => p.trim()).filter(p => p) : [],
                  programIds: [],
                  assignedLecturerId: undefined
              };
              newCourses.push(newCourse);
          }
          
          if (newCourses.length > 0) {
              onBulkAddCourses(newCourses);
              alert(`Successfully imported ${newCourses.length} courses.${skippedCount > 0 ? ` Skipped ${skippedCount} invalid rows.` : ''}`);
              setIsBulkModalOpen(false);
              setBulkFile(null);
          } else {
              alert("No valid course records found in the uploaded file.");
          }
      };
      reader.readAsText(bulkFile);
  };

  const handleCloseBulkModal = () => {
      setIsBulkModalOpen(false);
      setBulkFile(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </div>
              <div className="relative">
                  <select 
                    value={filterDept} 
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                  >
                      <option value="">All Departments</option>
                      {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Filter size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                  <select 
                    value={filterLevel} 
                    onChange={(e) => setFilterLevel(e.target.value ? Number(e.target.value) : '')}
                    className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                  >
                      <option value="">All Levels</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="300">300</option>
                      <option value="400">400</option>
                  </select>
                  <Filter size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
              >
                  <FileSpreadsheet size={16} /> Bulk Import
              </button>
              <button 
                onClick={() => handleOpenModal()} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
              >
                  <Plus size={16} /> Add Course
              </button>
          </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
                  <tr>
                      <th className="px-6 py-4 font-semibold">Course Code</th>
                      <th className="px-6 py-4 font-semibold">Title</th>
                      <th className="px-6 py-4 font-semibold">Department</th>
                      <th className="px-6 py-4 font-semibold text-center">Level</th>
                      <th className="px-6 py-4 font-semibold text-center">Credits</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredCourses.map(course => (
                      <tr key={course.code} className="hover:bg-slate-50 group transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-blue-600">{course.code}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">
                              {course.title}
                              {course.prerequisites && course.prerequisites.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                      {course.prerequisites.map(p => (
                                          <span key={p} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded">
                                              Req: {p}
                                          </span>
                                      ))}
                                  </div>
                              )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{course.department}</td>
                          <td className="px-6 py-4 text-center">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">L{course.level}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600">{course.credits}</td>
                          <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleOpenModal(course)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                  <button 
                                    onClick={() => {
                                        if(window.confirm(`Delete course ${course.code}?`)) onDeleteCourse(course.code);
                                    }} 
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {filteredCourses.length === 0 && (
                      <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">No courses found matching your filters.</td></tr>
                  )}
              </tbody>
          </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <Book size={20} className="text-blue-600"/>
                          {editingCode ? 'Edit Course' : 'Mount New Course'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Code</label>
                              <input 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm uppercase" 
                                required 
                                value={formData.code || ''} 
                                onChange={e => setFormData({...formData, code: e.target.value})} 
                                placeholder="EDU101" 
                                disabled={!!editingCode} // Disable code editing to prevent ID conflicts easily
                              />
                          </div>
                          <div className="col-span-2">
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Course Title</label>
                              <input className="w-full border border-slate-300 rounded-lg p-2 text-sm" required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Foundations of Education" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Department</label>
                              <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" required value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>
                                  <option value="">Select Dept</option>
                                  <option value="Education">Education</option>
                                  <option value="Mathematics">Mathematics</option>
                                  <option value="Science">Science</option>
                                  <option value="Languages">Languages</option>
                                  <option value="ICT">ICT</option>
                                  <option value="General">General</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Credits</label>
                              <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm" required value={formData.credits || 3} onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Level</label>
                              <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={formData.level || 100} onChange={e => setFormData({...formData, level: parseInt(e.target.value)})}>
                                  <option value="100">100</option>
                                  <option value="200">200</option>
                                  <option value="300">300</option>
                                  <option value="400">400</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-sm font-medium text-slate-700 mb-1 block">Semester</label>
                              <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={formData.semester || 1} onChange={e => setFormData({...formData, semester: parseInt(e.target.value)})}>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="text-sm font-medium text-slate-700 mb-1 block">Prerequisites (Optional)</label>
                          <input 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                            value={formData.prerequisites?.join(', ') || ''} 
                            onChange={e => setFormData({...formData, prerequisites: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} 
                            placeholder="e.g. EDU101, PSY101" 
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Comma separated course codes</p>
                      </div>
                      <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-4">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                              <Check size={16} /> Save Course
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-green-600"/>
                    Bulk Import Courses
                </h3>
                <button onClick={handleCloseBulkModal}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">Step 1: Download Template</h4>
                    <p className="text-xs text-blue-600 mb-3">Use the standard CSV template for course data.</p>
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors w-full justify-center">
                        <Download size={16} /> Download CSV
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
                <button onClick={handleProcessBulkUpload} disabled={!bulkFile} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bulkFile ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Import Courses</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;