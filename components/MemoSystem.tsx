import React, { useState, useEffect } from 'react';
import { Memo, MemoStatus, Employee } from '../types';
import { MOCK_EMPLOYEES, MOCK_DEPARTMENTS } from '../constants';
import { api } from '../services/api';
import { Mail, Send, FileText, CheckCircle, XCircle, Eye, PenTool, Plus, X, Search, Clock, ArrowRight, User, Archive, History, Loader2 } from 'lucide-react';

interface MemoSystemProps {
  currentUser: Employee | null;
  onNotify?: (message: string) => void;
}

const MemoSystem: React.FC<MemoSystemProps> = ({ currentUser, onNotify }) => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'approvals' | 'archived'>('inbox');
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [archivedMemoIds, setArchivedMemoIds] = useState<string[]>([]);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<'write' | 'preview'>('write');
  
  const [newMemo, setNewMemo] = useState({
    receiverId: '',
    subject: '',
    body: '',
  });

  const isArchived = (id: string) => archivedMemoIds.includes(id);

  useEffect(() => {
      const loadMemos = async () => {
          try {
              setIsLoading(true);
              const data = await api.memos.getAll();
              setMemos(data);
          } catch (error) {
              console.error("Failed to load memos", error);
              if (onNotify) onNotify("Failed to load memos");
          } finally {
              setIsLoading(false);
          }
      };
      loadMemos();
  }, [onNotify]);

  // Auto-archive effect
  useEffect(() => {
    if (currentUser && memos.length > 0) {
        runArchiveLogic(true);
    }
  }, [currentUser, memos]);

  // Derived Lists
  const inbox = memos.filter(m => m.receiverId === currentUser?.id && m.status === MemoStatus.APPROVED && !isArchived(m.id));
  const sent = memos.filter(m => m.senderId === currentUser?.id && !isArchived(m.id));
  // Approvals: Show memos where approverId is current user AND status is pending
  const approvals = memos.filter(m => m.approverId === currentUser?.id && m.status === MemoStatus.PENDING_APPROVAL && !isArchived(m.id));
  // Archived: Show archived memos for the current user
  const archived = memos.filter(m => (m.receiverId === currentUser?.id || m.senderId === currentUser?.id) && isArchived(m.id));

  const getStatusBadge = (status: MemoStatus) => {
    switch(status) {
        case MemoStatus.APPROVED: return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={10} /> Approved</span>;
        case MemoStatus.PENDING_APPROVAL: return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={10} /> Pending Approval</span>;
        case MemoStatus.REJECTED: return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle size={10} /> Rejected</span>;
        default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Draft</span>;
    }
  };

  const handleCreateOpen = () => {
      setNewMemo({ receiverId: '', subject: '', body: '' });
      setCreationStep('write');
      setIsCreateModalOpen(true);
  };

  const determineApprover = (sender: Employee): Employee | null => {
      // Find the Principal first as they are the ultimate approver
      const principal = MOCK_EMPLOYEES.find(e => e.role === 'Principal');

      // If sender is Principal, self-approve (or no approval needed, handled as self here)
      if (principal && sender.id === principal.id) {
          return principal;
      }

      // Find sender's department
      const dept = MOCK_DEPARTMENTS.find(d => d.name === sender.department);
      if (!dept) return principal || null; // Fallback to Principal if dept not found

      // Identify HOD
      const hodName = dept.headOfDept;
      const hod = MOCK_EMPLOYEES.find(e => `${e.firstName} ${e.lastName}` === hodName);

      // If HOD not found in system, route to Principal
      if (!hod) return principal || null;

      // Logic: 
      // 1. If sender IS the HOD -> Route to Principal
      if (sender.id === hod.id) {
          return principal || null;
      }

      // 2. If sender is NOT the HOD -> Route to HOD
      return hod;
  };

  const handleSubmitMemo = async () => {
      if (!currentUser) return;
      
      const receiver = MOCK_EMPLOYEES.find(e => e.id === newMemo.receiverId);
      if (!receiver) return;

      const approver = determineApprover(currentUser);
      
      // Fallback: If no approver determined (e.g. config error), default to sender (self-sign)
      const finalApproverId = approver ? approver.id : currentUser.id;

      const memoData: Partial<Memo> = {
          senderId: currentUser.id,
          senderName: `${currentUser.firstName} ${currentUser.lastName}`,
          senderDept: currentUser.department,
          receiverId: receiver.id,
          receiverName: `${receiver.firstName} ${receiver.lastName}`,
          approverId: finalApproverId,
          subject: newMemo.subject,
          body: newMemo.body,
          date: new Date().toISOString().split('T')[0],
          status: MemoStatus.PENDING_APPROVAL,
          isRead: false
      };

      try {
          const createdMemo = await api.memos.create(memoData);
          setMemos([createdMemo, ...memos]);
          setIsCreateModalOpen(false);
          
          if (onNotify) {
              const approverRole = approver?.role === 'Principal' ? 'Principal' : 'Head of Department';
              const approverName = approver ? `${approver.firstName} ${approver.lastName}` : 'System Admin';
              onNotify(`Memo submitted. Routed to ${approverRole} (${approverName}) for approval.`);
          }
      } catch (error) {
          console.error("Failed to create memo", error);
          if (onNotify) onNotify("Failed to create memo");
      }
  };

  const handleApprove = async (memo: Memo) => {
      try {
          const updatedMemo = await api.memos.update(memo.id, { status: MemoStatus.APPROVED });
          setMemos(memos.map(m => m.id === memo.id ? updatedMemo : m));
          setSelectedMemo(null);
          if (onNotify) onNotify(`Memo "${memo.subject}" approved and sent to ${memo.receiverName}`);
      } catch (error) {
          console.error("Failed to approve memo", error);
          if (onNotify) onNotify("Failed to approve memo");
      }
  };

  const handleReject = async (memo: Memo) => {
      const reason = prompt("Enter rejection reason:");
      if (reason) {
        try {
            const updatedMemo = await api.memos.update(memo.id, { status: MemoStatus.REJECTED, rejectionReason: reason });
            setMemos(memos.map(m => m.id === memo.id ? updatedMemo : m));
            setSelectedMemo(null);
            if (onNotify) onNotify(`Memo "${memo.subject}" rejected.`);
        } catch (error) {
            console.error("Failed to reject memo", error);
            if (onNotify) onNotify("Failed to reject memo");
        }
      }
  };

  const runArchiveLogic = async (silent: boolean) => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const oldMemos = memos.filter(m => {
        const memoDate = new Date(m.date);
        const isRelevant = m.receiverId === currentUser?.id || m.senderId === currentUser?.id;
        // Don't archive pending approvals
        const isNotPending = m.status !== MemoStatus.PENDING_APPROVAL;
        return isRelevant && memoDate < oneYearAgo && isNotPending && !isArchived(m.id);
    });

    if (oldMemos.length === 0) {
        if (!silent && onNotify) onNotify("No memos older than 1 year found to archive.");
        return;
    }

    // In a real app, we would update the backend. For now, we'll just update local state or call update for each.
    // Since we don't have a bulk update endpoint, we'll just update the local state for "archived view" purposes
    // or we could iterate and update each one (expensive).
    // Let's assume we just update the local state for now as the backend doesn't have a specific "archive" field exposed in the UI logic other than filtering.
    // Wait, the backend DOES have `isArchived`.
    
    // We will update them one by one for now, or just update the local list of IDs if we want to simulate client-side archiving view.
    // But to persist, we should update the backend.
    
    const ids = oldMemos.map(m => m.id);
    setArchivedMemoIds(prev => {
        const newIds = ids.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
    });

    // Ideally call API to archive
    // await Promise.all(ids.map(id => api.memos.update(id, { isArchived: true })));

    if (onNotify) {
        onNotify(silent 
            ? `System Check: Archived ${ids.length} old memos (>1 yr).` 
            : `Successfully archived ${ids.length} memos older than one year.`
        );
    }
  };

  const handleManualArchive = () => {
      runArchiveLogic(false);
  };

  const getDisplayedMemos = () => {
      switch(activeTab) {
          case 'inbox': return inbox;
          case 'sent': return sent;
          case 'approvals': return approvals;
          case 'archived': return archived;
          default: return inbox;
      }
  };

  const displayedMemos = getDisplayedMemos();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Internal Memos</h2>
          <p className="text-sm text-slate-500 mt-1">Send and manage official internal correspondence.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleManualArchive}
                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm font-medium"
                title="Archive memos older than 1 year"
            >
                <Archive size={16} />
                <span className="hidden sm:inline">Archive Old Memos</span>
            </button>
            <button 
            onClick={handleCreateOpen}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
            <Plus size={18} />
            <span>Compose Memo</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex overflow-hidden min-h-[500px]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-slate-100 bg-slate-50 p-4 flex flex-col gap-1">
              <button 
                onClick={() => { setActiveTab('inbox'); setSelectedMemo(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inbox' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                  <div className="flex items-center gap-2"><Mail size={16} /> Inbox</div>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs border border-slate-200">{inbox.length}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('sent'); setSelectedMemo(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sent' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                  <div className="flex items-center gap-2"><Send size={16} /> Sent</div>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs border border-slate-200">{sent.length}</span>
              </button>
              
              {approvals.length > 0 || currentUser?.role === 'Principal' || currentUser?.role === 'Registrar' ? (
                   <>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <button 
                        onClick={() => { setActiveTab('approvals'); setSelectedMemo(null); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'approvals' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                        <div className="flex items-center gap-2"><CheckCircle size={16} /> Approvals</div>
                        {approvals.length > 0 && <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs">{approvals.length}</span>}
                    </button>
                   </>
              ) : null}

              <div className="h-px bg-slate-200 my-2"></div>
              <button 
                onClick={() => { setActiveTab('archived'); setSelectedMemo(null); }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'archived' ? 'bg-slate-200 text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                  <div className="flex items-center gap-2"><History size={16} /> Archived</div>
                  {archived.length > 0 && <span className="bg-white px-2 py-0.5 rounded-full text-xs border border-slate-200">{archived.length}</span>}
              </button>
          </div>

          {/* List / Detail View */}
          <div className="flex-1 flex flex-col">
              {!selectedMemo ? (
                  // List View
                  <div className="flex-1 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                      ) : (
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white sticky top-0 border-b border-slate-100 text-slate-500">
                              <tr>
                                  <th className="px-6 py-3 font-medium">{activeTab === 'sent' ? 'To' : 'From'}</th>
                                  <th className="px-6 py-3 font-medium">Subject</th>
                                  <th className="px-6 py-3 font-medium">Date</th>
                                  <th className="px-6 py-3 font-medium">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {displayedMemos.map(memo => (
                                  <tr 
                                    key={memo.id} 
                                    onClick={() => setSelectedMemo(memo)}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                                  >
                                      <td className="px-6 py-4 font-medium text-slate-800">
                                          {activeTab === 'sent' ? memo.receiverName : memo.senderName}
                                      </td>
                                      <td className="px-6 py-4 text-slate-600">
                                          {memo.subject}
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{memo.date}</td>
                                      <td className="px-6 py-4">
                                          {getStatusBadge(memo.status)}
                                      </td>
                                  </tr>
                              ))}
                              {displayedMemos.length === 0 && (
                                  <tr>
                                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">Folder is empty</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                      )}
                  </div>
              ) : (
                  // Detail View
                  <div className="flex-1 flex flex-col h-full">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                          <div>
                              <button onClick={() => setSelectedMemo(null)} className="text-slate-500 hover:text-blue-600 text-xs flex items-center gap-1 mb-2 font-medium">
                                  <ArrowRight size={12} className="rotate-180" /> Back to list
                              </button>
                              <h3 className="text-xl font-bold text-slate-800">{selectedMemo.subject}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                  <span><span className="font-semibold text-slate-700">From:</span> {selectedMemo.senderName} ({selectedMemo.senderDept})</span>
                                  <span><span className="font-semibold text-slate-700">To:</span> {selectedMemo.receiverName}</span>
                                  <span><span className="font-semibold text-slate-700">Date:</span> {selectedMemo.date}</span>
                              </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(selectedMemo.status)}
                              {activeTab === 'approvals' && selectedMemo.status === MemoStatus.PENDING_APPROVAL && (
                                  <div className="flex gap-2 mt-2">
                                      <button onClick={() => handleReject(selectedMemo)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-bold hover:bg-red-200 transition-colors">Reject</button>
                                      <button onClick={() => handleApprove(selectedMemo)} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition-colors">Approve</button>
                                  </div>
                              )}
                          </div>
                      </div>
                      <div className="p-8 flex-1 overflow-y-auto bg-white">
                          <div className="max-w-3xl mx-auto border border-slate-200 shadow-sm p-8 min-h-[600px] bg-white relative">
                               {/* Paper effect */}
                               <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
                                   <div>
                                       <h1 className="text-3xl font-serif font-bold text-slate-900">MEMORANDUM</h1>
                                       <p className="text-sm font-serif text-slate-600 uppercase tracking-widest mt-1">OLA College of Education</p>
                                   </div>
                                   <div className="text-right">
                                       <img src="https://ui-avatars.com/api/?name=OLA+College&background=1e293b&color=fff" alt="Logo" className="w-12 h-12 rounded opacity-80" />
                                   </div>
                               </div>
                               
                               <div className="grid grid-cols-[80px_1fr] gap-y-3 mb-8 text-sm font-serif">
                                   <span className="font-bold text-slate-700 uppercase">To:</span>
                                   <span className="border-b border-slate-200">{selectedMemo.receiverName}</span>
                                   
                                   <span className="font-bold text-slate-700 uppercase">From:</span>
                                   <span className="border-b border-slate-200">{selectedMemo.senderName}, {selectedMemo.senderDept}</span>
                                   
                                   <span className="font-bold text-slate-700 uppercase">Date:</span>
                                   <span className="border-b border-slate-200">{selectedMemo.date}</span>
                                   
                                   <span className="font-bold text-slate-700 uppercase">Subject:</span>
                                   <span className="font-bold border-b border-slate-200">{selectedMemo.subject}</span>
                               </div>

                               <div className="prose prose-slate max-w-none font-serif leading-relaxed text-justify">
                                   {selectedMemo.body.split('\n').map((para, i) => (
                                       <p key={i}>{para}</p>
                                   ))}
                               </div>

                               <div className="mt-12">
                                    <div className="mb-2 font-serif italic text-lg font-bold text-slate-700 font-script">
                                        {selectedMemo.senderName}
                                    </div>
                                    <div className="border-t border-slate-300 w-48 pt-2">
                                        <p className="font-serif text-xs text-slate-500 uppercase tracking-wider">Sender's Signature</p>
                                    </div>
                               </div>

                               {selectedMemo.status === MemoStatus.APPROVED && (
                                   <div className="mt-16 pt-8">
                                       <div className="inline-block relative">
                                            <div className="absolute -top-6 -left-4 border-4 border-green-600 text-green-600 px-4 py-1 font-bold text-lg opacity-30 -rotate-12 rounded uppercase tracking-widest">
                                                Approved
                                            </div>
                                            <p className="border-t border-slate-400 w-48 pt-2 font-serif text-sm">
                                                Head of Department Signature
                                            </p>
                                       </div>
                                   </div>
                               )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Create Memo Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">Compose New Memo</h3>
                      <button onClick={() => setIsCreateModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                      {creationStep === 'write' ? (
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-sm font-medium text-slate-700 block mb-1">To (Receiver)</label>
                                      <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <select 
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                                            value={newMemo.receiverId}
                                            onChange={(e) => setNewMemo({...newMemo, receiverId: e.target.value})}
                                        >
                                            <option value="">Select Staff Member</option>
                                            {MOCK_EMPLOYEES.filter(e => e.id !== currentUser?.id).map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} - {emp.department}</option>
                                            ))}
                                        </select>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-sm font-medium text-slate-700 block mb-1">From (Department)</label>
                                      <input 
                                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-sm cursor-not-allowed"
                                        value={currentUser?.department || ''}
                                        disabled
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-sm font-medium text-slate-700 block mb-1">Subject</label>
                                  <input 
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Brief subject of the memo"
                                    value={newMemo.subject}
                                    onChange={(e) => setNewMemo({...newMemo, subject: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-sm font-medium text-slate-700 block mb-1">Message Body</label>
                                  <textarea 
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm min-h-[200px]"
                                    placeholder="Type your memo content here..."
                                    value={newMemo.body}
                                    onChange={(e) => setNewMemo({...newMemo, body: e.target.value})}
                                  />
                              </div>
                          </div>
                      ) : (
                          // Preview Step
                          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                               <div className="bg-white shadow-lg p-8 max-w-2xl mx-auto min-h-[400px]">
                                   <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                                       <h2 className="text-2xl font-serif font-bold">INTERNAL MEMO</h2>
                                       <p className="text-xs uppercase tracking-widest text-slate-500">OLA College of Education</p>
                                   </div>
                                   <div className="grid grid-cols-[60px_1fr] gap-y-2 text-sm font-serif mb-6">
                                       <span className="font-bold">TO:</span> 
                                       <span>{MOCK_EMPLOYEES.find(e => e.id === newMemo.receiverId)?.firstName} {MOCK_EMPLOYEES.find(e => e.id === newMemo.receiverId)?.lastName}</span>
                                       
                                       <span className="font-bold">FROM:</span> 
                                       <span>{currentUser?.firstName} {currentUser?.lastName}, {currentUser?.department}</span>
                                       
                                       <span className="font-bold">DATE:</span> 
                                       <span>{new Date().toLocaleDateString()}</span>
                                       
                                       <span className="font-bold">RE:</span> 
                                       <span className="font-bold underline">{newMemo.subject}</span>
                                   </div>
                                   <div className="prose prose-sm max-w-none font-serif text-justify whitespace-pre-wrap">
                                       {newMemo.body}
                                   </div>

                                   <div className="mt-12">
                                        <div className="mb-2 font-serif italic text-lg font-bold text-slate-700 font-script">
                                            {currentUser?.firstName} {currentUser?.lastName}
                                        </div>
                                        <div className="border-t border-slate-300 w-48 pt-2">
                                            <p className="font-serif text-xs text-slate-500 uppercase tracking-wider">Sender's Signature</p>
                                        </div>
                                   </div>

                               </div>
                               <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg flex items-start gap-2">
                                   <Clock size={16} className="shrink-0 mt-0.5" />
                                   <p>
                                       <strong>Note:</strong> Upon submission, this memo will be routed to the 
                                       Head of Department ({currentUser?.department}) for approval before delivery.
                                   </p>
                               </div>
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                      {creationStep === 'preview' ? (
                          <button onClick={() => setCreationStep('write')} className="text-slate-600 hover:text-slate-800 text-sm font-medium px-4 py-2">Back to Edit</button>
                      ) : (
                          <div />
                      )}
                      
                      <div className="flex gap-2">
                          <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-white">Cancel</button>
                          {creationStep === 'write' ? (
                              <button 
                                onClick={() => setCreationStep('preview')} 
                                disabled={!newMemo.receiverId || !newMemo.subject || !newMemo.body}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
                              >
                                  <Eye size={16} /> Preview
                              </button>
                          ) : (
                              <button 
                                onClick={handleSubmitMemo} 
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                              >
                                  <Send size={16} /> Submit Memo
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MemoSystem;