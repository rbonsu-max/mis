import React, { useState, useEffect } from 'react';
import { MOCK_EMPLOYEES } from '../constants';
import { Ticket, TicketStatus, TicketPriority, SystemUser } from '../types';
import { api } from '../services/api';
import { Plus, Search, Filter, MessageSquare, AlertCircle, CheckCircle, Clock, X, Eye, Save, Loader2 } from 'lucide-react';

interface HelpDeskProps {
    currentUser: SystemUser | null;
    onNotify?: (message: string) => void;
}

const HelpDesk: React.FC<HelpDeskProps> = ({ currentUser, onNotify }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: TicketPriority.MEDIUM, requesterId: '' });

  // Manage/View Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Status Update State (for IT)
  const [statusUpdate, setStatusUpdate] = useState<TicketStatus>(TicketStatus.OPEN);

  const isITSupport = currentUser?.roleIds.includes('ROLE-IT');

  useEffect(() => {
    const loadTickets = async () => {
        try {
            setIsLoading(true);
            const data = await api.tickets.getAll();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets", error);
            if (onNotify) onNotify("Failed to load tickets");
        } finally {
            setIsLoading(false);
        }
    };
    loadTickets();
  }, [onNotify]);

  // Filter logic: IT sees all, others see only their own tickets
  const accessibleTickets = isITSupport 
    ? tickets 
    : tickets.filter(t => t.requesterId === currentUser?.employeeId);

  const filteredTickets = accessibleTickets.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-blue-100 text-blue-700';
      case TicketStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700';
      case TicketStatus.WAITING_ON_CLIENT: return 'bg-purple-100 text-purple-700';
      case TicketStatus.RESOLVED: return 'bg-green-100 text-green-700';
      case TicketStatus.CLOSED: return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
      switch(status) {
          case TicketStatus.OPEN: return 'Pending'; // Mapping OPEN to Pending for UI as requested
          case TicketStatus.RESOLVED: return 'Completed';
          case TicketStatus.WAITING_ON_CLIENT: return 'Waiting on Client';
          case TicketStatus.IN_PROGRESS: return 'In Progress';
          default: return status.replace('_', ' ');
      }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.CRITICAL: return 'text-red-600 font-bold';
      case TicketPriority.HIGH: return 'text-red-500 font-semibold';
      case TicketPriority.MEDIUM: return 'text-amber-600';
      case TicketPriority.LOW: return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let requesterName = 'Unknown';
    const requester = MOCK_EMPLOYEES.find(e => e.id === newTicket.requesterId);
    
    if (requester) {
        requesterName = `${requester.firstName} ${requester.lastName}`;
    } else if (newTicket.requesterId === currentUser?.employeeId) {
        requesterName = currentUser?.username || 'Current User';
    }
    
    const ticketData: Partial<Ticket> = {
        title: newTicket.title,
        description: newTicket.description,
        requesterId: newTicket.requesterId,
        requesterName: requesterName,
        status: TicketStatus.OPEN,
        priority: newTicket.priority,
        createdAt: new Date().toISOString().split('T')[0]
    };

    try {
        const createdTicket = await api.tickets.create(ticketData);
        setTickets([createdTicket, ...tickets]);
        setIsModalOpen(false);
        setNewTicket({ title: '', description: '', priority: TicketPriority.MEDIUM, requesterId: '' });
        if (onNotify) onNotify("Ticket created successfully.");
    } catch (error) {
        console.error("Failed to create ticket", error);
        if (onNotify) onNotify("Failed to create ticket");
    }
  };

  const handleRowClick = (ticket: Ticket) => {
      setSelectedTicket(ticket);
      setStatusUpdate(ticket.status);
      setIsManageModalOpen(true);
  };

  const handleUpdateStatus = async () => {
      if (!selectedTicket) return;
      
      try {
          const updatedTicket = await api.tickets.update(selectedTicket.id, { status: statusUpdate });
          setTickets(prev => prev.map(t => 
              t.id === selectedTicket.id ? updatedTicket : t
          ));
          
          setIsManageModalOpen(false);
          setSelectedTicket(null);
          if (onNotify) onNotify("Ticket status updated.");
      } catch (error) {
          console.error("Failed to update ticket status", error);
          if (onNotify) onNotify("Failed to update ticket status");
      }
  };

  const handleOpenCreateModal = () => {
      setNewTicket({ 
          title: '', 
          description: '', 
          priority: TicketPriority.MEDIUM, 
          requesterId: currentUser?.employeeId || '' 
      });
      setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">IT Help Desk</h2>
          <p className="text-sm text-slate-500 mt-1">
              {isITSupport ? 'Manage support tickets and resolve issues.' : 'Submit and track your support requests.'}
          </p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Ticket</span>
        </button>
      </div>

       {/* Stats Overview */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><AlertCircle size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Pending</p>
                    <p className="text-2xl font-bold text-slate-800">{accessibleTickets.filter(t => t.status === TicketStatus.OPEN).length}</p>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">In Progress</p>
                    <p className="text-2xl font-bold text-slate-800">{accessibleTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length}</p>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Completed</p>
                    <p className="text-2xl font-bold text-slate-800">{accessibleTickets.filter(t => t.status === TicketStatus.RESOLVED).length}</p>
                </div>
            </div>
             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-lg"><MessageSquare size={20} /></div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Total</p>
                    <p className="text-2xl font-bold text-slate-800">{accessibleTickets.length}</p>
                </div>
            </div>
       </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search tickets..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">
                <Filter size={16} /> Filter
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
                        <th className="px-6 py-4 font-semibold">Ticket Details</th>
                        <th className="px-6 py-4 font-semibold">Requester</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Priority</th>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map(ticket => (
                        <tr key={ticket.id} onClick={() => handleRowClick(ticket)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                            <td className="px-6 py-4">
                                <div>
                                    <p className="font-medium text-slate-900">{ticket.title}</p>
                                    <p className="text-xs text-slate-500 truncate max-w-xs">{ticket.description}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{ticket.id}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-slate-900">{ticket.requesterName}</p>
                                <p className="text-xs text-slate-500">{ticket.requesterId}</p>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                                    {getStatusLabel(ticket.status)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                {ticket.createdAt}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors">
                                    <Eye size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No tickets found.</td></tr>
                    )}
                </tbody>
            </table>
            )}
        </div>
      </div>

       {/* New Ticket Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Create Support Ticket</h3>
                    <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Requester</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={newTicket.requesterId}
                            onChange={(e) => setNewTicket({...newTicket, requesterId: e.target.value})}
                            required
                            disabled={!isITSupport} // Only IT can change requester
                        >
                            <option value="">Select Employee</option>
                            {MOCK_EMPLOYEES.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                            ))}
                            {/* Fallback option if current user is not in mock list */}
                            {currentUser?.employeeId && !MOCK_EMPLOYEES.find(e => e.id === currentUser.employeeId) && (
                                <option value={currentUser.employeeId}>
                                    {currentUser.username || 'Current User'}
                                </option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
                        <input 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            placeholder="e.g. Internet connectivity issue"
                            value={newTicket.title}
                            onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                            required
                        />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            rows={3}
                            placeholder="Describe the issue..."
                            value={newTicket.description}
                            onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Priority</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={newTicket.priority}
                            onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as TicketPriority})}
                        >
                            {Object.values(TicketPriority).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Submit Ticket</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* View/Manage Ticket Modal */}
      {isManageModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <AlertCircle size={20} className="text-blue-600" />
                        {isITSupport ? 'Manage Ticket' : 'Ticket Details'}
                    </h3>
                    <button onClick={() => setIsManageModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">{selectedTicket.title}</h4>
                                <p className="text-xs text-slate-500 font-mono mt-1">{selectedTicket.id}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(selectedTicket.status)}`}>
                                {getStatusLabel(selectedTicket.status)}
                            </span>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase">Requester</p>
                                <p className="text-slate-800">{selectedTicket.requesterName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase">Priority</p>
                                <p className={`font-semibold ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase">Date Created</p>
                                <p className="text-slate-800">{selectedTicket.createdAt}</p>
                            </div>
                        </div>
                    </div>

                    {/* IT Support Action Area */}
                    {isITSupport && (
                        <div className="border-t border-slate-100 pt-4 mt-4">
                            <label className="text-sm font-bold text-slate-700 mb-2 block">Update Status</label>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={statusUpdate}
                                    onChange={(e) => setStatusUpdate(e.target.value as TicketStatus)}
                                >
                                    <option value={TicketStatus.OPEN}>Pending (Open)</option>
                                    <option value={TicketStatus.WAITING_ON_CLIENT}>Waiting on Client</option>
                                    <option value={TicketStatus.IN_PROGRESS}>In Progress</option>
                                    <option value={TicketStatus.RESOLVED}>Completed (Resolved)</option>
                                </select>
                                <button 
                                    onClick={handleUpdateStatus}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Save size={16} /> Update
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {!isITSupport && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                        <button onClick={() => setIsManageModalOpen(false)} className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm hover:bg-slate-50">Close</button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default HelpDesk;