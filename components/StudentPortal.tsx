import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, CreditCard, Calendar, Award, FileText, User, Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Student, SemesterRecord, FeeRecord } from '../types';
import { api } from '../services/api';

interface StudentPortalProps {
  studentId: string;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'academics' | 'financials' | 'courses'>('overview');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const data = await api.students.getById(studentId);
        setStudent(data);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
        <h2 className="text-xl font-bold text-red-800">Student Record Not Found</h2>
        <p className="text-red-600">We couldn't find a student record associated with your account.</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <GraduationCap size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {student.firstName}!</h2>
          <p className="text-blue-100 max-w-md">You are currently in Year {student.year} of the {student.program} program. Keep up the great work!</p>
          
          <div className="mt-8 flex flex-wrap gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-1">Current GPA</p>
              <p className="text-2xl font-bold">{student.gpa.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-1">Attendance</p>
              <p className="text-2xl font-bold">{student.attendance}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-1">Status</p>
              <p className="text-2xl font-bold">{student.status}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-600" size={20} />
              Recent Academic Performance
            </h3>
            <div className="space-y-4">
              {student.academicHistory && student.academicHistory.length > 0 ? (
                student.academicHistory.slice(0, 2).map((sem, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">{sem.semester}</p>
                      <p className="text-xs text-slate-500">{sem.academicYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{sem.gpa.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">GPA</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-4">No academic history available yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Upcoming Deadlines & Events
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Mid-Semester Exams</p>
                  <p className="text-xs text-slate-500">Starts in 5 days • Oct 25, 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Course Registration Deadline</p>
                  <p className="text-xs text-slate-500">Ends in 2 days • Oct 22, 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="text-blue-600" size={20} />
              Financial Status
            </h3>
            <div className="text-center py-6 border-b border-slate-100 mb-6">
              <p className="text-slate-500 text-sm mb-1">Outstanding Balance</p>
              <p className="text-4xl font-bold text-slate-900">
                GHS {student.financialHistory?.[student.financialHistory.length - 1]?.balance.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
                Pay Fees Online
              </button>
              <button className="w-full bg-white text-slate-700 border border-slate-200 font-semibold py-3 rounded-lg hover:bg-slate-50 transition-colors">
                Download Statement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademics = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xl font-bold text-slate-800">Academic History</h3>
        <p className="text-slate-500 text-sm">Detailed breakdown of your performance across semesters.</p>
      </div>
      <div className="p-6">
        {student.academicHistory && student.academicHistory.length > 0 ? (
          <div className="space-y-8">
            {student.academicHistory.map((sem, idx) => (
              <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800">{sem.semester}</h4>
                    <p className="text-xs text-slate-500">{sem.academicYear}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 border-r border-slate-200">
                      <p className="text-xs text-slate-400 uppercase font-semibold">GPA</p>
                      <p className="font-bold text-blue-600">{sem.gpa.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 uppercase font-semibold">Credits</p>
                      <p className="font-bold text-slate-700">{sem.creditsEarned}</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Course Title</th>
                        <th className="px-6 py-3 text-center">Credits</th>
                        <th className="px-6 py-3 text-center">Score</th>
                        <th className="px-6 py-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sem.grades.map((grade, gIdx) => (
                        <tr key={gIdx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-semibold text-blue-600">{grade.courseCode}</td>
                          <td className="px-6 py-4 text-slate-700">{grade.courseTitle}</td>
                          <td className="px-6 py-4 text-center text-slate-600">{grade.credits}</td>
                          <td className="px-6 py-4 text-center font-medium">{grade.score}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              ['A', 'A-'].includes(grade.grade) ? 'bg-green-100 text-green-700' :
                              ['B+', 'B', 'B-'].includes(grade.grade) ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {grade.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-500">No academic records found.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFinancials = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Financial History</h3>
          <p className="text-slate-500 text-sm">Track your payments and outstanding balances.</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
          Balance: GHS {student.financialHistory?.[student.financialHistory.length - 1]?.balance.toFixed(2) || '0.00'}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Ref Number</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {student.financialHistory?.map((txn, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-500">{txn.date}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-800">{txn.description}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{txn.paymentMethod || 'System'}</p>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{txn.referenceNumber}</td>
                <td className={`px-6 py-4 text-right font-bold ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'CREDIT' ? '+' : '-'} {txn.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">{txn.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-blue-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
            {student.photo ? (
              <img src={student.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{student.firstName} {student.lastName}</h1>
            <p className="text-slate-500 flex items-center gap-2">
              <GraduationCap size={16} />
              ID: {student.id} • {student.program}
            </p>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveSubTab('overview')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveSubTab('academics')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'academics' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Academics
          </button>
          <button 
            onClick={() => setActiveSubTab('financials')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'financials' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Financials
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeSubTab === 'overview' && renderOverview()}
        {activeSubTab === 'academics' && renderAcademics()}
        {activeSubTab === 'financials' && renderFinancials()}
      </div>
    </div>
  );
};

export default StudentPortal;
