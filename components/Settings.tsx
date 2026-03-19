import React, { useState, useEffect } from 'react';
import { MOCK_USERS, MOCK_DEPARTMENTS, MOCK_ROLES, MOCK_EMPLOYEES } from '../constants';
import { SystemUser, Department, Role, Employee } from '../types';
import { Plus, Trash2, Edit2, Shield, Users, Building, Key, Check, Search, X, CheckSquare, Square, RefreshCw, CalendarClock, Save } from 'lucide-react';

type SettingsTab = 'users' | 'departments' | 'roles' | 'session';

const AVAILABLE_PERMISSIONS = [
  'read:students', 'write:students', 
  'read:staff', 'write:staff', 
  'read:leave', 'approve:leave', 
  'read:settings', 'write:settings',
  'read:ticket', 'write:ticket'
];

interface SettingsProps {
    currentAcademicYear?: string;
    currentSemester?: number;
    onUpdateSession?: (year: string, sem: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentAcademicYear = '2023/2024', currentSemester = 1, onUpdateSession }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);

  // Session State
  const [sessionForm, setSessionForm] = useState({ year: currentAcademicYear, semester: currentSemester });

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Edit States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Filter States
  const [roleSearch, setRoleSearch] = useState('');

  // Form States
  const [userForm, setUserForm] = useState<Partial<SystemUser>>({ isActive: true, roleIds: [] });
  const [deptForm, setDeptForm] = useState<Partial<Department>>({});
  const [roleForm, setRoleForm] = useState<Partial<Role>>({ permissions: [] });

  // Load users from local storage on mount to display them
  useEffect(() => {
    const storedUsers = localStorage.getItem('ola_system_users');
    if (storedUsers) {
      setUsers(prev => {
        const parsed = JSON.parse(storedUsers);
        // Merge mock and stored users, avoiding duplicates by ID
        const existingIds = new Set(prev.map(u => u.id));
        const newUsers = parsed.filter((u: SystemUser) => !existingIds.has(u.id));
        return [...prev, ...newUsers];
      });
    }
  }, []);

  // Update local session form if props change
  useEffect(() => {
      setSessionForm({ year: currentAcademicYear, semester: currentSemester });
  }, [currentAcademicYear, currentSemester]);

  // --- Helpers ---

  const getRoleBadgeStyle = (roleName: string) => {
      const lower = roleName.toLowerCase();
      if (lower.includes('admin')) return 'bg-purple-100 text-purple-700 border-purple-200';
      if (lower.includes('hr')) return 'bg-orange-100 text-orange-700 border-orange-200';
      if (lower.includes('it')) return 'bg-slate-100 text-slate-700 border-slate-200';
      if (lower.includes('staff') || lower.includes('academic')) return 'bg-blue-100 text-blue-700 border-blue-200';
      return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // --- Handlers ---

  const handleUpdateSession = () => {
      if (onUpdateSession) {
          onUpdateSession(sessionForm.year, sessionForm.semester);
          alert(`Academic Session updated to ${sessionForm.year}, Semester ${sessionForm.semester}`);
      }
  };
  
  const generateCredentials = (empId: string) => {
    const employee = MOCK_EMPLOYEES.find(e => e.id === empId);
    if (!employee) return;

    // We no longer auto-generate the username, allowing manual email entry.
    setUserForm(prev => ({
        ...prev,
        password: 'Ola@2024',
        employeeId: empId
    }));
  };

  const openCreateUserModal = () => {
      setEditingUserId(null);
      setUserForm({ isActive: true, roleIds: [] });
      setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: SystemUser) => {
      setEditingUserId(user.id);
      setUserForm({ ...user, password: '' }); // Clear password field for security
      setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.roleIds || userForm.roleIds.length === 0 || !userForm.employeeId) {
        alert("Please fill in all fields and select at least one role.");
        return;
    }

    if (editingUserId) {
        // Update local state
        const updatedUsers = users.map(u => u.id === editingUserId ? { ...u, ...userForm, password: userForm.password || u.password } as SystemUser : u);
        setUsers(updatedUsers);
        
        // Update localStorage for persistence
        // Filter out mock users (assuming mock IDs start with USR-00)
        const persistentUsers = updatedUsers.filter(u => !MOCK_USERS.find(mu => mu.id === u.id));
        localStorage.setItem('ola_system_users', JSON.stringify(persistentUsers));
        
        setIsUserModalOpen(false);
        setUserForm({ isActive: true, roleIds: [] });
        setEditingUserId(null);

    } else {
        // Create New User
        try {
            const newUserPayload = {
                id: `USR-${Date.now()}`,
                username: userForm.username,
                password: userForm.password || 'Ola@2024',
                employeeId: userForm.employeeId,
                roleIds: userForm.roleIds,
                isActive: userForm.isActive !== undefined ? userForm.isActive : true
            };

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to register user');
            }

            const newUser = await response.json();

            // 3. Update State and LocalStorage
            const updatedUsers = [...users, newUser];
            setUsers(updatedUsers);

            const storedUsers = JSON.parse(localStorage.getItem('ola_system_users') || '[]');
            localStorage.setItem('ola_system_users', JSON.stringify([...storedUsers, newUser]));
            
            alert(`User ${newUser.username} created successfully! They can now log in.`);
            
            setIsUserModalOpen(false);
            setUserForm({ isActive: true, roleIds: [] });
            setEditingUserId(null);

        } catch (error: any) {
            console.error("Error creating user:", error);
            alert("Failed to create user: " + error.message);
            // Don't close modal on error so user can correct it
        }
    }
  };

  const handleDeleteUser = (userId: string) => {
      if(window.confirm('Are you sure you want to delete this user? (Note: This only removes system access, it does not delete the account from authentication provider in this demo)')) {
          const updatedUsers = users.filter(u => u.id !== userId);
          setUsers(updatedUsers);
          
          // Update persistence
          const persistentUsers = updatedUsers.filter(u => !MOCK_USERS.find(mu => mu.id === u.id));
          localStorage.setItem('ola_system_users', JSON.stringify(persistentUsers));
      }
  };

  // --- Handlers for Departments ---

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) return;

    const newDept: Department = {
        id: `DEPT-${Date.now()}`,
        name: deptForm.name,
        headOfDept: deptForm.headOfDept,
        description: deptForm.description
    };

    setDepartments([...departments, newDept]);
    setIsDeptModalOpen(false);
    setDeptForm({});
  };

  const handleDeleteDept = (deptId: string) => {
    if(window.confirm('Delete this department?')) {
        setDepartments(departments.filter(d => d.id !== deptId));
    }
  };

  // --- Handlers for Roles ---

  const openCreateRoleModal = () => {
    setEditingRoleId(null);
    setRoleForm({ permissions: [] });
    setIsRoleModalOpen(true);
  };

  const openEditRoleModal = (role: Role) => {
    setEditingRoleId(role.id);
    setRoleForm({ ...role });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) return;

    if (editingRoleId) {
        setRoles(roles.map(r => r.id === editingRoleId ? { ...r, ...roleForm } as Role : r));
    } else {
        const newRole: Role = {
            id: `ROLE-${Date.now()}`,
            name: roleForm.name,
            description: roleForm.description || '',
            permissions: roleForm.permissions || []
        };
        setRoles([...roles, newRole]);
    }

    setIsRoleModalOpen(false);
    setRoleForm({ permissions: [] });
    setEditingRoleId(null);
  };

  const togglePermission = (perm: string) => {
      setRoleForm(prev => {
          const current = prev.permissions || [];
          if (current.includes(perm)) {
              return { ...prev, permissions: current.filter(p => p !== perm) };
          } else {
              return { ...prev, permissions: [...current, perm] };
          }
      });
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(roleSearch.toLowerCase()) || 
    role.description.toLowerCase().includes(roleSearch.toLowerCase())
  );


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage academic session, users, departments, and roles.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex space-x-8 min-w-max">
            <button
                onClick={() => setActiveTab('users')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Users size={18} />
                User Management
            </button>
            <button
                onClick={() => setActiveTab('departments')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'departments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Building size={18} />
                Departments
            </button>
            <button
                onClick={() => setActiveTab('roles')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Shield size={18} />
                Roles & Permissions
            </button>
            <button
                onClick={() => setActiveTab('session')}
                className={`pb-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'session' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <CalendarClock size={18} />
                Academic Session
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
        
        {/* SESSION TAB */}
        {activeTab === 'session' && (
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Academic Year & Semester Configuration</h3>
                    <p className="text-sm text-slate-500 mt-1">Set the current active academic period for the entire system.</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 max-w-2xl">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-white text-blue-600 rounded-lg shadow-sm">
                            <CalendarClock size={32} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-lg">Current System Status</h4>
                            <div className="flex gap-3 mt-2">
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-bold shadow-sm">
                                    {currentAcademicYear}
                                </span>
                                <span className="bg-white text-blue-600 border border-blue-200 px-3 py-1 rounded-md text-sm font-bold">
                                    Semester {currentSemester}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-slate-200">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Academic Year</label>
                            <input 
                                type="text"
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 2023/2024"
                                value={sessionForm.year}
                                onChange={(e) => setSessionForm({...sessionForm, year: e.target.value})}
                            />
                            <p className="text-xs text-slate-500 mt-1">Format: YYYY/YYYY</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Academic Semester</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={sessionForm.semester}
                                onChange={(e) => setSessionForm({...sessionForm, semester: parseInt(e.target.value)})}
                            >
                                <option value={1}>Semester 1</option>
                                <option value={2}>Semester 2</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 pt-2 border-t border-slate-100 mt-2">
                            <button 
                                onClick={handleUpdateSession}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 w-full md:w-auto transition-colors shadow-sm"
                            >
                                <Save size={18} /> Update Active Session
                            </button>
                            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                                <span className="font-bold">Note:</span> Changing this affects course registration and grading contexts immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">System Users</h3>
                    <button 
                        onClick={openCreateUserModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Create User</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">User Profile</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Username</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Roles</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => {
                                const emp = MOCK_EMPLOYEES.find(e => e.id === user.employeeId);
                                return (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden">
                                                    {emp?.photo ? (
                                                        <img src={emp.photo} alt="" className="w-full h-full object-cover"/>
                                                    ) : (
                                                        <span>{emp ? `${emp.firstName[0]}${emp.lastName[0]}` : 'U'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 whitespace-nowrap">{emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500">{user.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{user.username}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roleIds && user.roleIds.length > 0 ? user.roleIds.map(rid => {
                                                    const role = roles.find(r => r.id === rid);
                                                    const style = role ? getRoleBadgeStyle(role.name) : 'bg-gray-100 text-gray-700';
                                                    return (
                                                        <span key={rid} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} whitespace-nowrap`}>
                                                            {role ? role.name : rid}
                                                        </span>
                                                    );
                                                }) : <span className="text-slate-400 italic">No roles</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditUserModal(user)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
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

        {/* DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
            <div className="p-4 md:p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Departments</h3>
                    <button 
                        onClick={() => setIsDeptModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Add Department</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map(dept => (
                        <div key={dept.id} className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Building size={20} />
                                </div>
                                <button onClick={() => handleDeleteDept(dept.id)} className="text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                            <h4 className="font-bold text-slate-800">{dept.name}</h4>
                            <p className="text-xs text-slate-500 mt-1 mb-3 line-clamp-2">{dept.description}</p>
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500">Head:</span>
                                <span className="font-medium text-slate-700">{dept.headOfDept || 'Unassigned'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ROLES TAB */}
        {activeTab === 'roles' && (
            <div className="p-4 md:p-6">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-lg font-bold text-slate-800">User Roles</h3>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <button 
                            onClick={openCreateRoleModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm whitespace-nowrap"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Add Role</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    {filteredRoles.map(role => (
                        <div 
                            key={role.id} 
                            onClick={() => openEditRoleModal(role)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                             <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg mt-1 transition-colors ${getRoleBadgeStyle(role.name).replace('text', 'bg').split(' ')[0].replace('100', '50')} ${getRoleBadgeStyle(role.name).split(' ')[1]}`}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{role.name}</h4>
                                    <p className="text-sm text-slate-500 mb-2">{role.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.slice(0, 4).map((perm, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200 uppercase font-bold tracking-wider">
                                                {perm}
                                            </span>
                                        ))}
                                        {role.permissions.length > 4 && (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">
                                                +{role.permissions.length - 4}
                                            </span>
                                        )}
                                    </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-4 mt-4 sm:mt-0 pl-14 sm:pl-0">
                                 <div className="text-xs text-slate-400">
                                     {MOCK_USERS.filter(u => u.roleIds && u.roleIds.includes(role.id)).length} Users Assigned
                                 </div>
                                 <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-200">
                                     <Edit2 size={16} />
                                 </button>
                             </div>
                        </div>
                    ))}
                    {filteredRoles.length === 0 && (
                        <div className="p-8 text-center text-slate-500 italic">No roles match your search.</div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* ... (Existing Modals: User, Dept, Role) ... */}
      
      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
                    <h3 className="font-bold text-lg text-slate-800">{editingUserId ? 'Edit User' : 'Create System User'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Employee</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                            onChange={(e) => generateCredentials(e.target.value)}
                            value={userForm.employeeId || ''}
                            required
                            disabled={!!editingUserId}
                        >
                            <option value="">-- Select Staff --</option>
                            {MOCK_EMPLOYEES.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.id})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Username (Email)</label>
                            <input 
                                type="email"
                                value={userForm.username || ''}
                                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                                placeholder="user@ola.edu.gh"
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Password</label>
                            <input 
                                value={userForm.password || ''}
                                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                                placeholder={editingUserId ? "Unchanged" : "Generated"}
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono text-slate-700 placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-slate-700">Assign Roles</label>
                            {userForm.roleIds && userForm.roleIds.length > 0 && (
                                <button 
                                    type="button" 
                                    onClick={() => setUserForm({...userForm, roleIds: []})}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Clear ({userForm.roleIds.length})
                                </button>
                            )}
                        </div>
                        <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-slate-50/50 space-y-1 custom-scrollbar">
                            {roles.map(r => (
                                <label key={r.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white hover:shadow-sm p-2 rounded-md transition-all select-none border border-transparent hover:border-slate-200">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${userForm.roleIds?.includes(r.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                        {userForm.roleIds?.includes(r.id) && <Check size={12} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={userForm.roleIds?.includes(r.id) || false}
                                        onChange={(e) => {
                                            const current = userForm.roleIds || [];
                                            if (e.target.checked) {
                                                setUserForm({...userForm, roleIds: [...current, r.id]});
                                            } else {
                                                setUserForm({...userForm, roleIds: current.filter(id => id !== r.id)});
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <span className={userForm.roleIds?.includes(r.id) ? 'font-medium text-blue-700' : 'text-slate-700'}>{r.name}</span>
                                </label>
                            ))}
                        </div>
                        {(!userForm.roleIds || userForm.roleIds.length === 0) && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Shield size={12} /> At least one role is required.</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="isActive"
                            checked={userForm.isActive}
                            onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <label htmlFor="isActive" className="text-sm text-slate-700 select-none cursor-pointer">Account is Active</label>
                    </div>

                    {!editingUserId && (
                        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2">
                            <Key size={16} className="shrink-0" />
                            <p>Password will be auto-generated. The user can change their password after first login.</p>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                            {editingUserId ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Add Department</h3>
                    <button onClick={() => setIsDeptModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleCreateDept} className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Department Name</label>
                        <input 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            placeholder="e.g. Social Sciences"
                            onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            rows={3}
                            onChange={(e) => setDeptForm({...deptForm, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Head of Department</label>
                         <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            onChange={(e) => setDeptForm({...deptForm, headOfDept: e.target.value})}
                        >
                            <option value="">-- Assign Later --</option>
                            {MOCK_EMPLOYEES.map(emp => (
                                <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName}</option>
                            ))}
                        </select>
                    </div>
                     <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Department</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{editingRoleId ? 'Edit Role' : 'Create Role'}</h3>
                    <button onClick={() => setIsRoleModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSaveRole} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Role Name</label>
                        <input 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            placeholder="e.g. Exam Officer"
                            value={roleForm.name || ''}
                            onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
                         <input 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                            value={roleForm.description || ''}
                            onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Permissions</label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50">
                            {AVAILABLE_PERMISSIONS.map(perm => (
                                <label key={perm} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                                    <div 
                                        onClick={() => togglePermission(perm)}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${roleForm.permissions?.includes(perm) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}
                                    >
                                        <Check size={12} />
                                    </div>
                                    <span className="text-xs font-mono text-slate-600">{perm}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                     <div className="pt-2 flex justify-end gap-2 sticky bottom-0 bg-white border-t border-slate-100 mt-4">
                        <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                            {editingRoleId ? 'Save Changes' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default Settings;