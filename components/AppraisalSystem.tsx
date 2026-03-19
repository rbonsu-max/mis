import React, { useState, useEffect } from 'react';
import { AppraisalTemplate, AppraisalQuestion, Employee, SystemUser, AppraisalSubmission } from '../types';
import { MOCK_APPRAISAL_TEMPLATES, MOCK_EMPLOYEES, MOCK_DEPARTMENTS } from '../constants';
import { FileText, Plus, Trash2, Edit2, Save, X, Eye, CheckCircle, Send, User, Calendar, Printer, BarChart2, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AppraisalSystemProps {
  currentUser: SystemUser | null;
  onNotify?: (message: string) => void;
}

const AppraisalSystem: React.FC<AppraisalSystemProps> = ({ currentUser, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'my_appraisals' | 'manage_templates' | 'analytics'>('my_appraisals');
  const [templates, setTemplates] = useState<AppraisalTemplate[]>(MOCK_APPRAISAL_TEMPLATES);
  const [submissions, setSubmissions] = useState<AppraisalSubmission[]>([]);
  
  // Analytics State
  const [selectedAnalyticsTemplateId, setSelectedAnalyticsTemplateId] = useState<string | null>(null);

  // Template Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<AppraisalTemplate>>({
      title: '',
      description: '',
      questions: [],
      assignedDepartments: [],
      assignedEmployeeIds: []
  });

  // Document Filler State
  const [isFillerOpen, setIsFillerOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<AppraisalTemplate | null>(null);
  const [fillerAnswers, setFillerAnswers] = useState<Record<string, string | number>>({});
  const [viewOnlyMode, setViewOnlyMode] = useState(false);

  // HR View Submission State
  const [viewingSubmissionsForTemplate, setViewingSubmissionsForTemplate] = useState<string | null>(null);

  // Roles
  const isHR = currentUser?.roleIds.includes('ROLE-HR') || currentUser?.roleIds.includes('ROLE-ADMIN');
  const employeeDetails = MOCK_EMPLOYEES.find(e => e.id === currentUser?.employeeId);

  // Load Submissions from Persistence
  useEffect(() => {
      const storedSubmissions = localStorage.getItem('ola_appraisal_submissions');
      if (storedSubmissions) {
          try {
              setSubmissions(JSON.parse(storedSubmissions));
          } catch(e) {
              console.error("Failed to parse appraisal submissions", e);
          }
      }
  }, []);

  // --- Logic: My Appraisals ---
  
  // Determine assignments based on current user's dept or ID
  const myAssignedTemplates = templates.filter(t => {
      if (t.status !== 'active') return false;
      const deptMatch = employeeDetails && t.assignedDepartments.includes(employeeDetails.department);
      const idMatch = currentUser?.employeeId && t.assignedEmployeeIds.includes(currentUser.employeeId);
      // For demo, assume Non-teaching target group means everyone if not specified strictly
      return deptMatch || idMatch || t.assignedDepartments.length === 0; 
  });

  const handleOpenFiller = (template: AppraisalTemplate, viewOnly: boolean = false, existingAnswers?: Record<string, string | number>) => {
      setActiveTemplate(template);
      setFillerAnswers(existingAnswers || {});
      setViewOnlyMode(viewOnly);
      setIsFillerOpen(true);
  };

  const handleFillerChange = (qId: string, value: string | number) => {
      if (viewOnlyMode) return;
      setFillerAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmitAppraisal = () => {
      if (!activeTemplate || !currentUser) return;
      
      const submission: AppraisalSubmission = {
          id: `SUB-${Date.now()}`,
          templateId: activeTemplate.id,
          employeeId: currentUser.employeeId,
          employeeName: employeeDetails ? `${employeeDetails.firstName} ${employeeDetails.lastName}` : currentUser.username,
          answers: fillerAnswers,
          submittedAt: new Date().toISOString().split('T')[0],
          status: 'submitted'
      };

      const newSubmissions = [...submissions, submission];
      setSubmissions(newSubmissions);
      localStorage.setItem('ola_appraisal_submissions', JSON.stringify(newSubmissions));

      // Push notification to HR Queue
      const pendingNotifs = JSON.parse(localStorage.getItem('ola_pending_notifications') || '[]');
      pendingNotifs.push({
          id: Date.now(),
          text: `New Appraisal Submitted by ${submission.employeeName} for ${activeTemplate.title}`,
          targetRole: 'ROLE-HR',
          read: false
      });
      localStorage.setItem('ola_pending_notifications', JSON.stringify(pendingNotifs));

      setIsFillerOpen(false);
      setActiveTemplate(null);
      if (onNotify) onNotify(`Self-Appraisal "${activeTemplate.title}" submitted successfully.`);
  };

  // --- Logic: Template Management ---

  const handleOpenEditor = (template?: AppraisalTemplate) => {
      if (template) {
          setEditingTemplateId(template.id);
          setTemplateForm(JSON.parse(JSON.stringify(template))); // Deep copy
      } else {
          setEditingTemplateId(null);
          setTemplateForm({
              title: '',
              description: '',
              questions: [],
              assignedDepartments: [],
              assignedEmployeeIds: [],
              status: 'draft',
              targetGroup: 'non-teaching'
          });
      }
      setIsEditorOpen(true);
  };

  const addQuestion = (type: 'text' | 'rating' | 'yes_no') => {
      const newQ: AppraisalQuestion = {
          id: `q-${Date.now()}`,
          text: '',
          type: type,
          description: type === 'rating' ? 'Rate from 1 (Poor) to 5 (Excellent)' : ''
      };
      setTemplateForm(prev => ({
          ...prev,
          questions: [...(prev.questions || []), newQ]
      }));
  };

  const updateQuestion = (id: string, field: string, value: string) => {
      setTemplateForm(prev => ({
          ...prev,
          questions: prev.questions?.map(q => q.id === id ? { ...q, [field]: value } : q)
      }));
  };

  const removeQuestion = (id: string) => {
      setTemplateForm(prev => ({
          ...prev,
          questions: prev.questions?.filter(q => q.id !== id)
      }));
  };

  const toggleDeptAssignment = (deptName: string) => {
      setTemplateForm(prev => {
          const current = prev.assignedDepartments || [];
          return current.includes(deptName) 
            ? { ...prev, assignedDepartments: current.filter(d => d !== deptName) }
            : { ...prev, assignedDepartments: [...current, deptName] };
      });
  };

  const handleSaveTemplate = () => {
      if (!templateForm.title) return alert("Title is required");
      
      const newTemplate = {
          ...templateForm,
          id: editingTemplateId || `APP-TEMP-${Date.now()}`,
          createdAt: editingTemplateId ? (templateForm.createdAt || new Date().toISOString()) : new Date().toISOString(),
          createdBy: currentUser?.username || 'HR'
      } as AppraisalTemplate;

      if (editingTemplateId) {
          setTemplates(prev => prev.map(t => t.id === editingTemplateId ? newTemplate : t));
      } else {
          setTemplates(prev => [...prev, newTemplate]);
      }
      setIsEditorOpen(false);
      if (onNotify) onNotify(`Appraisal Template "${newTemplate.title}" saved.`);
  };

  const handleViewSubmissions = (templateId: string) => {
      setViewingSubmissionsForTemplate(templateId);
  };

  // --- Render Components ---

  const renderDocumentFiller = () => {
      if (!activeTemplate) return null;

      // Determine display details based on whether we are filling or viewing someone else's
      const fillerName = viewOnlyMode ? (submissions.find(s => s.templateId === activeTemplate.id && s.answers === fillerAnswers)?.employeeName || 'Unknown Staff') : (employeeDetails ? `${employeeDetails.firstName} ${employeeDetails.lastName}` : currentUser?.username);
      const fillerId = viewOnlyMode ? (submissions.find(s => s.templateId === activeTemplate.id && s.answers === fillerAnswers)?.employeeId || 'N/A') : employeeDetails?.id;
      const fillerDept = viewOnlyMode ? 'N/A' : employeeDetails?.department; // Dept retrieval for view mode is simplified
      
      return (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto flex justify-center py-8 px-4">
              {/* Document Container - A4 simulation */}
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col animate-in fade-in zoom-in duration-300">
                  <button 
                    onClick={() => setIsFillerOpen(false)} 
                    className="absolute top-4 right-4 print:hidden text-slate-400 hover:text-red-600 bg-white rounded-full p-1 border border-slate-200"
                  >
                      <X size={24} />
                  </button>

                  {/* Document Content */}
                  <div className="p-[20mm] flex-1 flex flex-col">
                      {/* Header */}
                      <div className="border-b-2 border-black pb-6 mb-8 text-center">
                          <h1 className="text-2xl font-serif font-bold uppercase tracking-wider mb-2">OLA College of Education</h1>
                          <h2 className="text-xl font-serif font-bold text-slate-800 uppercase underline decoration-double underline-offset-4">Staff Self-Appraisal Form</h2>
                          <p className="text-sm font-serif italic mt-2 text-slate-600">Non-Teaching Staff Performance Review</p>
                      </div>

                      {/* Section 1: Staff Details */}
                      <div className="mb-8">
                          <h3 className="bg-slate-100 border border-slate-300 px-4 py-1 font-bold text-sm uppercase mb-4">Section A: Staff Particulars</h3>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm font-serif">
                              <div className="flex items-end gap-2">
                                  <span className="font-bold min-w-[100px]">Name:</span>
                                  <div className="border-b border-black border-dotted flex-1 px-2 font-medium">
                                      {fillerName}
                                  </div>
                              </div>
                              <div className="flex items-end gap-2">
                                  <span className="font-bold min-w-[100px]">Staff ID:</span>
                                  <div className="border-b border-black border-dotted flex-1 px-2 font-medium">
                                      {fillerId}
                                  </div>
                              </div>
                              <div className="flex items-end gap-2">
                                  <span className="font-bold min-w-[100px]">Department:</span>
                                  <div className="border-b border-black border-dotted flex-1 px-2 font-medium">
                                      {fillerDept}
                                  </div>
                              </div>
                              <div className="flex items-end gap-2">
                                  <span className="font-bold min-w-[100px]">Current Role:</span>
                                  <div className="border-b border-black border-dotted flex-1 px-2 font-medium">
                                      {employeeDetails?.role}
                                  </div>
                              </div>
                              <div className="flex items-end gap-2">
                                  <span className="font-bold min-w-[100px]">Date:</span>
                                  <div className="border-b border-black border-dotted flex-1 px-2 font-medium">
                                      {new Date().toLocaleDateString()}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Section 2: Questions */}
                      <div className="mb-8 flex-1">
                          <h3 className="bg-slate-100 border border-slate-300 px-4 py-1 font-bold text-sm uppercase mb-4">Section B: Performance Assessment</h3>
                          <p className="text-sm italic mb-4 text-slate-600">{activeTemplate.description}</p>
                          
                          <div className="space-y-6">
                              {activeTemplate.questions.map((q, idx) => (
                                  <div key={q.id} className="break-inside-avoid">
                                      <div className="flex gap-2 mb-2 text-sm font-serif font-bold">
                                          <span>{idx + 1}.</span>
                                          <span>{q.text}</span>
                                      </div>
                                      
                                      {q.type === 'text' && (
                                          <textarea 
                                            className="w-full border border-slate-300 rounded p-2 text-sm font-serif min-h-[100px] bg-slate-50 focus:bg-white transition-colors outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-700"
                                            placeholder="Type your response here..."
                                            value={fillerAnswers[q.id] || ''}
                                            onChange={(e) => handleFillerChange(q.id, e.target.value)}
                                            disabled={viewOnlyMode}
                                          />
                                      )}

                                      {q.type === 'rating' && (
                                          <div className="ml-6">
                                              <p className="text-xs italic text-slate-500 mb-2">{q.description}</p>
                                              <div className="flex gap-6">
                                                  {[1, 2, 3, 4, 5].map(rating => (
                                                      <label key={rating} className={`flex items-center gap-2 ${viewOnlyMode ? '' : 'cursor-pointer'}`}>
                                                          <input 
                                                            type="radio" 
                                                            name={`q-${q.id}`} 
                                                            value={rating}
                                                            checked={fillerAnswers[q.id] == rating}
                                                            onChange={() => handleFillerChange(q.id, rating)}
                                                            className="accent-black"
                                                            disabled={viewOnlyMode}
                                                          />
                                                          <span className="text-sm font-serif">{rating}</span>
                                                      </label>
                                                  ))}
                                              </div>
                                          </div>
                                      )}

                                      {q.type === 'yes_no' && (
                                          <div className="ml-6 flex gap-8">
                                              <label className={`flex items-center gap-2 ${viewOnlyMode ? '' : 'cursor-pointer'}`}>
                                                  <input 
                                                    type="radio" 
                                                    name={`q-${q.id}`} 
                                                    value="Yes"
                                                    checked={fillerAnswers[q.id] === 'Yes'}
                                                    onChange={() => handleFillerChange(q.id, 'Yes')}
                                                    className="accent-black"
                                                    disabled={viewOnlyMode}
                                                  />
                                                  <span className="text-sm font-serif">Yes</span>
                                              </label>
                                              <label className={`flex items-center gap-2 ${viewOnlyMode ? '' : 'cursor-pointer'}`}>
                                                  <input 
                                                    type="radio" 
                                                    name={`q-${q.id}`} 
                                                    value="No"
                                                    checked={fillerAnswers[q.id] === 'No'}
                                                    onChange={() => handleFillerChange(q.id, 'No')}
                                                    className="accent-black"
                                                    disabled={viewOnlyMode}
                                                  />
                                                  <span className="text-sm font-serif">No</span>
                                              </label>
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Footer: Signature */}
                      <div className="mt-8 pt-8 border-t border-slate-300 break-inside-avoid">
                          <h3 className="font-bold text-sm uppercase mb-4 font-serif">Declaration</h3>
                          <p className="text-sm font-serif mb-8 text-justify">
                              I hereby certify that the information provided in this form is true and accurate to the best of my knowledge. 
                              I understand that this appraisal will form part of my permanent employment record.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-12">
                              <div>
                                  <div className="h-16 border-b border-black mb-2 flex items-end pb-2">
                                      <span className="font-script text-2xl ml-4">{fillerAnswers['signature'] ? fillerName : ''}</span>
                                  </div>
                                  <p className="text-xs uppercase font-bold">Signature of Staff</p>
                              </div>
                              <div>
                                  <div className="h-16 border-b border-black mb-2 flex items-end pb-2">
                                      <span className="ml-4 font-serif">{new Date().toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs uppercase font-bold">Date</p>
                              </div>
                          </div>
                          
                          <div className="mt-4">
                              <label className="flex items-center gap-2 text-sm text-blue-700 font-bold cursor-pointer print:hidden">
                                  <input 
                                    type="checkbox" 
                                    onChange={(e) => handleFillerChange('signature', e.target.checked ? 'signed' : '')}
                                    checked={!!fillerAnswers['signature']}
                                    disabled={viewOnlyMode}
                                  />
                                  Check box to electronically sign this document
                              </label>
                          </div>
                      </div>
                  </div>

                  {/* Sticky Footer Actions */}
                  <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center print:hidden rounded-b-lg">
                      <button onClick={() => window.print()} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium px-4">
                          <Printer size={16} /> Print / Save as PDF
                      </button>
                      {!viewOnlyMode && (
                          <button 
                            onClick={handleSubmitAppraisal}
                            disabled={!fillerAnswers['signature']}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                              Submit Appraisal
                          </button>
                      )}
                      {viewOnlyMode && (
                          <button onClick={() => setIsFillerOpen(false)} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-900">
                              Close Document
                          </button>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Self-Appraisal System</h2>
          <p className="text-sm text-slate-500 mt-1">Performance review and self-assessment portal.</p>
        </div>
        {isHR && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('my_appraisals')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'my_appraisals' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    My Appraisals
                </button>
                <button 
                    onClick={() => setActiveTab('manage_templates')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'manage_templates' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Manage Templates
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Analytics
                </button>
            </div>
        )}
      </div>

      <div className="flex-1">
          {activeTab === 'my_appraisals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myAssignedTemplates.length > 0 ? myAssignedTemplates.map(temp => {
                      const isSubmitted = submissions.some(s => s.templateId === temp.id && s.employeeId === currentUser?.employeeId);
                      return (
                          <div key={temp.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                      <FileText size={24} />
                                  </div>
                                  {isSubmitted && (
                                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                          <CheckCircle size={12} /> Submitted
                                      </span>
                                  )}
                              </div>
                              <h3 className="font-bold text-slate-800 mb-2">{temp.title}</h3>
                              <p className="text-sm text-slate-500 mb-6 line-clamp-2">{temp.description}</p>
                              
                              <button 
                                onClick={() => handleOpenFiller(temp, isSubmitted, isSubmitted ? submissions.find(s => s.templateId === temp.id && s.employeeId === currentUser?.employeeId)?.answers as any : undefined)}
                                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                                    isSubmitted 
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                }`}
                              >
                                  {isSubmitted ? 'View Submission' : 'Fill Appraisal Form'}
                              </button>
                          </div>
                      );
                  }) : (
                      <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                          <FileText size={48} className="mb-4 opacity-20" />
                          <p>No appraisal forms assigned to you at this time.</p>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'manage_templates' && isHR && (
              <div className="space-y-6">
                  <div className="flex justify-end">
                      <button 
                        onClick={() => handleOpenEditor()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                      >
                          <Plus size={16} /> Create New Template
                      </button>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <tr>
                                  <th className="px-6 py-4 font-semibold">Template Name</th>
                                  <th className="px-6 py-4 font-semibold">Target Group</th>
                                  <th className="px-6 py-4 font-semibold">Assigned Depts</th>
                                  <th className="px-6 py-4 font-semibold text-center">Responses</th>
                                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {templates.map(temp => {
                                  const responseCount = submissions.filter(s => s.templateId === temp.id).length;
                                  return (
                                      <tr key={temp.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4 font-medium text-slate-800">{temp.title}</td>
                                          <td className="px-6 py-4">
                                              <span className="bg-slate-100 px-2 py-1 rounded text-xs capitalize text-slate-600">{temp.targetGroup}</span>
                                          </td>
                                          <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                              {temp.assignedDepartments.join(', ') || 'None'}
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${responseCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                  {responseCount}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <div className="flex justify-end gap-2">
                                                  <button 
                                                    onClick={() => handleViewSubmissions(temp.id)} 
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="View Responses"
                                                  >
                                                      <Eye size={16} />
                                                  </button>
                                                  <button onClick={() => handleOpenEditor(temp)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                      <Edit2 size={16} />
                                                  </button>
                                                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                      <Trash2 size={16} />
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'analytics' && isHR && (
              <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                              <TrendingUp className="text-blue-600" /> Performance Analytics
                          </h3>
                          <select 
                              className="border border-slate-300 rounded-lg p-2 text-sm min-w-[250px]"
                              value={selectedAnalyticsTemplateId || ''}
                              onChange={(e) => setSelectedAnalyticsTemplateId(e.target.value)}
                          >
                              <option value="">Select Appraisal Template...</option>
                              {templates.map(t => (
                                  <option key={t.id} value={t.id}>{t.title}</option>
                              ))}
                          </select>
                      </div>

                      {selectedAnalyticsTemplateId ? (() => {
                          const template = templates.find(t => t.id === selectedAnalyticsTemplateId);
                          const templateSubmissions = submissions.filter(s => s.templateId === selectedAnalyticsTemplateId);
                          
                          if (!template || templateSubmissions.length === 0) {
                              return (
                                  <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                      <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                                      <p>No submission data available for this template yet.</p>
                                  </div>
                              );
                          }

                          // Calculate Stats
                          const ratingQuestions = template.questions.filter(q => q.type === 'rating');
                          
                          // Avg Rating per Question
                          const avgRatingsData = ratingQuestions.map(q => {
                              const answers = templateSubmissions.map(s => Number(s.answers[q.id])).filter(n => !isNaN(n) && n > 0);
                              const avg = answers.length ? (answers.reduce((a, b) => a + b, 0) / answers.length) : 0;
                              return {
                                  name: q.text.length > 40 ? q.text.substring(0, 40) + '...' : q.text,
                                  fullText: q.text,
                                  score: parseFloat(avg.toFixed(2))
                              };
                          });

                          // Overall Rating Distribution
                          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                          let totalRatingsCount = 0;
                          templateSubmissions.forEach(s => {
                              ratingQuestions.forEach(q => {
                                  const val = Number(s.answers[q.id]);
                                  if (val >= 1 && val <= 5) {
                                      distribution[val as keyof typeof distribution]++;
                                      totalRatingsCount++;
                                  }
                              });
                          });
                          const distributionData = Object.entries(distribution).map(([key, value]) => ({ 
                              name: `${key} Stars`, 
                              value,
                              percentage: totalRatingsCount ? ((value / totalRatingsCount) * 100).toFixed(1) : 0
                          }));
                          
                          const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

                          return (
                              <div className="space-y-8">
                                  {/* Key Metrics Cards */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                          <p className="text-sm text-blue-600 font-medium mb-1">Total Submissions</p>
                                          <p className="text-3xl font-bold text-blue-800">{templateSubmissions.length}</p>
                                      </div>
                                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                          <p className="text-sm text-green-600 font-medium mb-1">Questions Analyzed</p>
                                          <p className="text-3xl font-bold text-green-800">{ratingQuestions.length}</p>
                                      </div>
                                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                          <p className="text-sm text-purple-600 font-medium mb-1">Overall Avg. Score</p>
                                          <p className="text-3xl font-bold text-purple-800">
                                              {(avgRatingsData.reduce((acc, curr) => acc + curr.score, 0) / (avgRatingsData.length || 1)).toFixed(2)}
                                              <span className="text-sm font-normal text-purple-600 ml-1">/ 5.0</span>
                                          </p>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                      {/* Bar Chart: Avg Score per Question */}
                                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                          <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">Average Score by Question</h4>
                                          <div className="h-[300px] w-full">
                                              <ResponsiveContainer width="100%" height="100%">
                                                  <BarChart data={avgRatingsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                      <XAxis type="number" domain={[0, 5]} />
                                                      <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 11}} />
                                                      <Tooltip 
                                                          cursor={{fill: 'transparent'}}
                                                          content={({ active, payload }) => {
                                                              if (active && payload && payload.length) {
                                                                  return (
                                                                      <div className="bg-white p-2 border border-slate-200 shadow-lg rounded text-xs max-w-[200px]">
                                                                          <p className="font-bold mb-1">{payload[0].payload.fullText}</p>
                                                                          <p className="text-blue-600">Average: {payload[0].value}</p>
                                                                      </div>
                                                                  );
                                                              }
                                                              return null;
                                                          }}
                                                      />
                                                      <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                  </BarChart>
                                              </ResponsiveContainer>
                                          </div>
                                      </div>

                                      {/* Pie Chart: Rating Distribution */}
                                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                          <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">Overall Rating Distribution</h4>
                                          <div className="h-[300px] w-full flex items-center justify-center">
                                              <ResponsiveContainer width="100%" height="100%">
                                                  <PieChart>
                                                      <Pie
                                                          data={distributionData}
                                                          cx="50%"
                                                          cy="50%"
                                                          labelLine={false}
                                                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                          outerRadius={100}
                                                          fill="#8884d8"
                                                          dataKey="value"
                                                      >
                                                          {distributionData.map((entry, index) => (
                                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                          ))}
                                                      </Pie>
                                                      <Tooltip />
                                                  </PieChart>
                                              </ResponsiveContainer>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          );
                      })() : (
                          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              <PieChartIcon size={48} className="mx-auto mb-4 opacity-20" />
                              <p>Please select an appraisal template to view analytics.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                  {/* ... Existing Editor Modal Code ... */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">{editingTemplateId ? 'Edit Template' : 'Design New Appraisal Form'}</h3>
                      <button onClick={() => setIsEditorOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-2 space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Form Title</label>
                                  <input 
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                                    value={templateForm.title}
                                    onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                                    placeholder="e.g. 2024 End of Year Review"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Description / Instructions</label>
                                  <textarea 
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm" 
                                    rows={2}
                                    value={templateForm.description}
                                    onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                                    placeholder="Instructions for the staff member..."
                                  />
                              </div>

                              <div className="border-t border-slate-200 pt-4">
                                  <div className="flex justify-between items-center mb-4">
                                      <h4 className="font-bold text-slate-800 text-sm">Form Questions</h4>
                                      <div className="flex gap-2">
                                          <button onClick={() => addQuestion('text')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700">+ Text</button>
                                          <button onClick={() => addQuestion('rating')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700">+ Rating</button>
                                          <button onClick={() => addQuestion('yes_no')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-700">+ Yes/No</button>
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                      {templateForm.questions?.map((q, idx) => (
                                          <div key={q.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex gap-3 items-start group">
                                              <span className="text-xs font-bold text-slate-400 mt-2">{idx + 1}.</span>
                                              <div className="flex-1 space-y-2">
                                                  <input 
                                                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-sm"
                                                    value={q.text}
                                                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                                    placeholder="Enter question text..."
                                                  />
                                                  {q.type === 'rating' && (
                                                      <input 
                                                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-500"
                                                        value={q.description || ''}
                                                        onChange={(e) => updateQuestion(q.id, 'description', e.target.value)}
                                                        placeholder="Rating description (e.g. 1-5)"
                                                      />
                                                  )}
                                                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-1 rounded border border-slate-100 inline-block">
                                                      Type: {q.type}
                                                  </span>
                                              </div>
                                              <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      ))}
                                      {templateForm.questions?.length === 0 && (
                                          <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                                              No questions added. Click buttons above to add.
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>

                          {/* Sidebar: Assignment */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-fit">
                              <h4 className="font-bold text-slate-700 text-sm mb-4">Assignment Settings</h4>
                              
                              <div className="mb-4">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Group</label>
                                  <select 
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                    value={templateForm.targetGroup}
                                    onChange={(e) => setTemplateForm({...templateForm, targetGroup: e.target.value as any})}
                                  >
                                      <option value="non-teaching">Non-Teaching Staff</option>
                                      <option value="teaching">Teaching Staff</option>
                                      <option value="all">All Staff</option>
                                  </select>
                              </div>

                              <div className="mb-4">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign to Departments</label>
                                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                      {MOCK_DEPARTMENTS.map(dept => (
                                          <label key={dept.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                                              <input 
                                                type="checkbox" 
                                                checked={templateForm.assignedDepartments?.includes(dept.name)}
                                                onChange={() => toggleDeptAssignment(dept.name)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                              />
                                              <span className="truncate">{dept.name}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>

                              <div className="border-t border-slate-200 pt-4 mt-4">
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                                  <select 
                                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                    value={templateForm.status}
                                    onChange={(e) => setTemplateForm({...templateForm, status: e.target.value as any})}
                                  >
                                      <option value="draft">Draft</option>
                                      <option value="active">Active (Published)</option>
                                      <option value="closed">Closed</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                      <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-white text-sm font-medium">Cancel</button>
                      <button onClick={handleSaveTemplate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                          <Save size={16} /> Save Template
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Submissions List Modal */}
      {viewingSubmissionsForTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">
                          Submissions: {templates.find(t => t.id === viewingSubmissionsForTemplate)?.title}
                      </h3>
                      <button onClick={() => setViewingSubmissionsForTemplate(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-0">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                              <tr>
                                  <th className="px-6 py-3 font-medium">Employee</th>
                                  <th className="px-6 py-3 font-medium">Staff ID</th>
                                  <th className="px-6 py-3 font-medium">Date Submitted</th>
                                  <th className="px-6 py-3 font-medium text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {submissions.filter(s => s.templateId === viewingSubmissionsForTemplate).map(sub => (
                                  <tr key={sub.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 font-medium text-slate-800">{sub.employeeName}</td>
                                      <td className="px-6 py-3 text-slate-600">{sub.employeeId}</td>
                                      <td className="px-6 py-3 text-slate-600">{sub.submittedAt}</td>
                                      <td className="px-6 py-3 text-right">
                                          <button 
                                            onClick={() => {
                                                const tmpl = templates.find(t => t.id === sub.templateId);
                                                if (tmpl) handleOpenFiller(tmpl, true, sub.answers as any);
                                            }}
                                            className="text-blue-600 hover:underline text-xs font-medium flex items-center gap-1 justify-end"
                                          >
                                              <Eye size={14} /> View Form
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                              {submissions.filter(s => s.templateId === viewingSubmissionsForTemplate).length === 0 && (
                                  <tr>
                                      <td colSpan={4} className="p-8 text-center text-slate-400">No submissions yet for this template.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Render Filler (Overlay) */}
      {isFillerOpen && renderDocumentFiller()}

    </div>
  );
};

export default AppraisalSystem;