import React, { useState, useEffect } from 'react';
import { LeaveRequest, LeaveStatus, LeaveType } from '../types';
import { MOCK_LEAVE_REQUESTS, MOCK_EMPLOYEES } from '../constants';
import { api } from '../services/api';
import { Check, X, Clock, CalendarDays, Plus, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface LeaveManagementProps {
  onNotify?: (message: string) => void;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ onNotify }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Rejection State
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Toast Notification State
  const [toastConfig, setToastConfig] = useState<{show: boolean, title: string, message: string, type: 'success' | 'error'}>({
    show: false, title: '', message: '', type: 'success'
  });

  const [formData, setFormData] = useState({
    employeeId: '',
    type: LeaveType.SICK,
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
      const loadLeaves = async () => {
          try {
              setIsLoading(true);
              const data = await api.leaves.getAll();
              setRequests(data);
          } catch (error) {
              console.error("Failed to fetch leave requests:", error);
          } finally {
              setIsLoading(false);
          }
      };
      loadLeaves();
  }, []);

  const showNotification = (title: string, message: string, type: 'success' | 'error') => {
    setToastConfig({ show: true, title, message, type });
    setTimeout(() => setToastConfig(prev => ({ ...prev, show: false })), 4000);
  };

  const handleApprove = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    setRequests(prev => prev.map(r => 
      r.id === id ? { ...r, status: LeaveStatus.APPROVED } : r
    ));
    
    if (onNotify) {
        onNotify(`Leave Request for ${req.employeeName} (${req.type}) has been APPROVED.`);
    }
    showNotification('Request Approved', `Leave for ${req.employeeName} has been approved.`, 'success');
  };

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectionReason('');
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    
    const req = requests.find(r => r.id === rejectingId);
    if (!req) return;

    setRequests(prev => prev.map(r => 
        r.id === rejectingId ? { ...r, status: LeaveStatus.REJECTED, rejectionReason: rejectionReason } : r
    ));

    if (onNotify) {
        onNotify(`Leave Request for ${req.employeeName} REJECTED. Reason: ${rejectionReason}`);
    }

    showNotification('Request Rejected', `Leave for ${req.employeeName} has been rejected.`, 'error');
    setRejectingId(null);
    setRejectionReason('');
  };

  const filteredRequests = filterStatus === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case LeaveStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return <Check size={14} />;
      case LeaveStatus.REJECTED: return <X size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = MOCK_EMPLOYEES.find(e => e.id === formData.employeeId);
    const empName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
    
    const newRequest: LeaveRequest = {
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: formData.employeeId,
      employeeName: empName,
      type: formData.type as LeaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: LeaveStatus.PENDING,
      requestDate: new Date().toISOString().split('T')[0]
    };

    setRequests([newRequest, ...requests]);
    setIsModalOpen(false);
    
    // Trigger System Notification
    if (onNotify) {
        onNotify(`New Leave Request submitted by ${empName} (${formData.type})`);
    }

    showNotification('Request Submitted', 'The leave request has been processed.', 'success');
    
    // Reset form
    setFormData({
      employeeId: '',
      type: LeaveType.SICK,
      startDate: '',
      endDate: '',
      reason: ''
    });
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastConfig.show && (
        <div className={`fixed top-20 right-4 z-50 bg-white border-l-4 shadow-lg rounded-r-lg p-4 animate-in slide-in-from-right flex items-start gap-3 max-w-sm ${toastConfig.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`mt-0.5 ${toastConfig.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {toastConfig.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div>
                <h4 className="font-bold text-gray-800 text-sm">{toastConfig.title}</h4>
                <p className="text-gray-600 text-xs mt-1">{toastConfig.message}</p>
            </div>
            <button onClick={() => setToastConfig(prev => ({ ...prev, show: false }))} className="text-gray-400 hover:text-gray-600 ml-2"><X size={16} /></button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Leave Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage employee leave requests and approvals.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Request</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-amber-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Pending Approvals</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{requests.filter(r => r.status === LeaveStatus.PENDING).length}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
              <Clock size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Currently on Leave</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{requests.filter(r => r.status === LeaveStatus.APPROVED && new Date(r.endDate) >= new Date()).length}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-500">
              <CalendarDays size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Staff</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{MOCK_EMPLOYEES.length}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-slate-800">Leave Requests</h3>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
          ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">Employee</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Leave Type</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Duration</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Reason</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{req.employeeName}</p>
                      <p className="text-xs text-slate-500">{req.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-600 text-xs font-medium">
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col">
                      <span className="font-medium">{req.startDate} to {req.endDate}</span>
                      <span className="text-xs text-slate-400">Request Date: {req.requestDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                     <p className="truncate max-w-xs" title={req.reason}>{req.reason}</p>
                     {req.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 italic">Rejected: {req.rejectionReason}</p>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                      {getStatusIcon(req.status)}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {req.status === LeaveStatus.PENDING && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(req.id)}
                          className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors" 
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => handleRejectClick(req.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" 
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
          {!isLoading && filteredRequests.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No leave requests found.
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">New Leave Request</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Employee</label>
                <select 
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                >
                  <option value="">Select Employee</option>
                  {MOCK_EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Leave Type</label>
                <select 
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                >
                  {Object.values(LeaveType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Start Date</label>
                  <input 
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">End Date</label>
                  <input 
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Reason</label>
                <textarea 
                  name="reason"
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Please provide a brief reason for the leave request..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
                    <h3 className="font-bold text-lg text-red-800 flex items-center gap-2">
                        <AlertCircle size={20} /> Reject Request
                    </h3>
                    <button onClick={() => setRejectingId(null)}><X size={20} className="text-red-400 hover:text-red-600" /></button>
                </div>
                <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-slate-600">
                        Please provide a reason for rejecting this leave request. This will be logged and notified to HR.
                    </p>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Reason for Rejection <span className="text-red-500">*</span></label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g. Staff shortage during this period..."
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setRejectingId(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Confirm Rejection</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;