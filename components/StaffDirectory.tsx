import React, { useState, useEffect, useRef } from 'react';
import { MOCK_EMPLOYEES } from '../constants';
import { Employee, Education, EmergencyContact, NextOfKin } from '../types';
import { api } from '../services/api';
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone, X, CheckCircle, Send, Upload, User, Edit2, Trash2, Eye, Building, GraduationCap, ArrowRight, ArrowLeft, Save, AlertCircle, Check, FileSpreadsheet, Download, UploadCloud, Loader2 } from 'lucide-react';

const StaffDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [filterDept, setFilterDept] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  // Missing states
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const loadEmployees = async () => {
          try {
              setIsLoading(true);
              const data = await api.employees.getAll();
              setEmployees(data);
          } catch (error) {
              console.error("Failed to fetch employees:", error);
          } finally {
              setIsLoading(false);
          }
      };
      loadEmployees();
  }, []);

  // Initial Empty State
  const initialFormState: Partial<Employee> = {
    firstName: '',
    lastName: '',
    id: '',
    department: '',
    role: '',
    phone: '',
    email: '', // Institutional email
    joinDate: new Date().toISOString().split('T')[0],
    photo: undefined,
    personalEmail: '',
    houseAddress: '',
    boxAddress: '',
    education: [],
    emergencyContact: { name: '', relation: '', email: '', phone: '' },
    nextOfKin: { name: '', relation: '', phone: '', address: '' }
  };

  const [formData, setFormData] = useState<Partial<Employee>>(initialFormState);

  // Temporary state for adding a single education record
  const [eduForm, setEduForm] = useState<Partial<Education>>({
    degree: '',
    institution: '',
    admissionYear: '',
    completionYear: '',
    referenceNumber: ''
  });

  // Load draft on open if creating new
  useEffect(() => {
    if (isModalOpen && !editingEmployeeId) {
        const savedDraft = localStorage.getItem('new_staff_draft');
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if(window.confirm("Found a saved draft for a new staff member. Would you like to continue?")) {
                    setFormData(parsed);
                } else {
                    localStorage.removeItem('new_staff_draft');
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }
  }, [isModalOpen]);

  const saveDraft = () => {
      if (!editingEmployeeId) {
          localStorage.setItem('new_staff_draft', JSON.stringify(formData));
      }
  };

  // --- Validation Helpers ---
  const sanitizePhone = (value: string) => {
    // Only allow digits, +, -, (, ), and space
    return value.replace(/[^0-9+\-()\s]/g, '');
  };

  const validateGhanaPhone = (value: string) => {
    if (!value) return false;
    // Remove spaces, hyphens, brackets
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    
    // Check for +233 format (e.g. +233244123456) - Country code + 9 digits
    const isInternational = /^\+233\d{9}$/.test(cleanPhone);
    
    // Check for 0 format (e.g. 0244123456) - Leading 0 + 9 digits
    const isLocal = /^0\d{9}$/.test(cleanPhone);

    return isInternational || isLocal;
  };

  const checkPhoneUnique = (phone: string, excludeId?: string | null) => {
      const cleanInput = phone.replace(/[\s\-\(\)]/g, '');
      
      const exists = employees.some(emp => {
          if (excludeId && emp.id === excludeId) return false;
          const cleanEmpPhone = emp.phone.replace(/[\s\-\(\)]/g, '');
          return cleanEmpPhone === cleanInput;
      });
      
      return !exists;
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = filterDept ? emp.department === filterDept : true;

    return matchesSearch && matchesDept;
  });

  // Unique Departments for filter
  const uniqueDepts = Array.from(new Set(employees.map(e => e.department))).sort();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
        const sanitized = sanitizePhone(value);
        setFormData(prev => ({ ...prev, [name]: sanitized }));
        // Clear error if user is typing
        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Nested input handlers
  const handleEmergencyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === 'phone') {
          const sanitized = sanitizePhone(value);
          setFormData(prev => ({
              ...prev,
              emergencyContact: { ...prev.emergencyContact!, [name]: sanitized }
          }));
          if (errors.emergencyPhone) setErrors(prev => ({ ...prev, emergencyPhone: '' }));
      } else {
          setFormData(prev => ({
              ...prev,
              emergencyContact: { ...prev.emergencyContact!, [name]: value }
          }));
      }
  };

  const handleNextOfKinChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === 'phone') {
          const sanitized = sanitizePhone(value);
          setFormData(prev => ({
              ...prev,
              nextOfKin: { ...prev.nextOfKin!, [name]: sanitized }
          }));
          if (errors.nokPhone) setErrors(prev => ({ ...prev, nokPhone: '' }));
      } else {
          setFormData(prev => ({
              ...prev,
              nextOfKin: { ...prev.nextOfKin!, [name]: value }
          }));
      }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Immediate local preview
      const localPreviewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photo: localPreviewUrl }));
      
      setIsUploadingPhoto(true);
      
      try {
          // Mocking a cloud upload delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In a real app without Firebase, you'd upload to your own backend
          // For now, we'll just use the local preview URL as the "uploaded" URL
          setFormData(prev => ({ ...prev, photo: localPreviewUrl }));
          setNotification({ show: true, ticketId: null, message: "Photo uploaded (Mock)." });
      } catch (error) {
          console.error("Upload failed", error);
          setNotification({ show: true, ticketId: null, message: "Upload failed." });
      } finally {
          setIsUploadingPhoto(false);
          setTimeout(() => setNotification({ show: false, ticketId: null }), 3000);
      }
    }
  };

  const handleAddEducation = () => {
      if(!eduForm.degree || !eduForm.institution) return;
      
      const newEdu: Education = {
          id: Date.now().toString(),
          degree: eduForm.degree!,
          institution: eduForm.institution!,
          admissionYear: eduForm.admissionYear || '',
          completionYear: eduForm.completionYear || '',
          referenceNumber: eduForm.referenceNumber || '',
          certificateUrl: eduForm.certificateUrl
      };

      setFormData(prev => ({
          ...prev,
          education: [...(prev.education || []), newEdu]
      }));

      // Reset edu form
      setEduForm({
        degree: '',
        institution: '',
        admissionYear: '',
        completionYear: '',
        referenceNumber: '',
        certificateUrl: undefined
      });
  };

  const handleRemoveEducation = (id: string) => {
      setFormData(prev => ({
          ...prev,
          education: prev.education?.filter(e => e.id !== id)
      }));
  };

  // --- Actions ---

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkEmail = () => {
    const selectedEmails = employees
        .filter(emp => selectedIds.includes(emp.id))
        .map(emp => emp.email)
        .filter(email => email);

    if (selectedEmails.length > 0) {
        window.location.href = `mailto:?bcc=${selectedEmails.join(',')}`;
    } else {
        alert("No valid email addresses found for the selected staff.");
    }
  };

  const handleAddClick = () => {
    setEditingEmployeeId(null);
    setFormData(initialFormState);
    setCurrentStep(1);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, emp: Employee) => {
    e.stopPropagation();
    setEditingEmployeeId(emp.id);
    setFormData({
        ...emp,
        education: emp.education || [],
        emergencyContact: emp.emergencyContact || { name: '', relation: '', email: '', phone: '' },
        nextOfKin: emp.nextOfKin || { name: '', relation: '', phone: '', address: '' }
    });
    setCurrentStep(1);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      if (viewingEmployee?.id === id) {
        setIsViewModalOpen(false);
        setViewingEmployee(null);
      }
    }
  };

  const handleRowClick = (emp: Employee) => {
    setViewingEmployee(emp);
    setIsViewModalOpen(true);
  };

  // --- Bulk Upload Handlers ---
  const handleDownloadTemplate = () => {
    const headers = ["FirstName", "LastName", "StaffID", "Department", "Role", "Email", "Phone", "Date Joined"];
    // Using simple CSV content generation
    const rows = [
      headers,
      ["Kwame", "Mensah", "EMP-NEW-01", "Science", "Lecturer", "k.mensah@ola.edu.gh", "0240000000", "2024-01-01", "\"Hse 10, Cape Coast\""]
    ];

    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "staff_upload_template.csv");
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

        // Split by new line
        const lines = text.split(/\r\n|\n/);
        const newEmployees: Employee[] = [];
        let skippedCount = 0;
        
        // Skip header row (index 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Regex to parse CSV line, correctly handling quotes (e.g. "City, Country")
            const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, '').trim());

            // Basic validation: needs at least First Name, Last Name, ID (indices 0, 1, 2)
            if (parts.length < 3) {
                skippedCount++;
                continue;
            }

            // Map based on template headers: 
            // 0:FN, 1:LN, 2:ID, 3:Dept, 4:Role, 5:Email, 6:Phone, 7:Date, 8:Addr
            const newEmp: Employee = {
                firstName: parts[0] || 'Unknown',
                lastName: parts[1] || 'Staff',
                id: parts[2] || `EMP-${Date.now()}-${i}`,
                department: parts[3] || 'General',
                role: parts[4] || 'Staff',
                email: parts[5] || '',
                phone: parts[6] || '',
                joinDate: parts[7] || new Date().toISOString().split('T')[0],
                houseAddress: parts[8] || '',
                // Initialize others
                education: [],
                emergencyContact: { name: '', relation: '', email: '', phone: '' },
                nextOfKin: { name: '', relation: '', phone: '', address: '' }
            };
            newEmployees.push(newEmp);
        }

        if (newEmployees.length > 0) {
            setEmployees(prev => [...newEmployees, ...prev]);
            setNotification({ 
                show: true, 
                ticketId: null, 
                message: `Successfully imported ${newEmployees.length} staff members.${skippedCount > 0 ? ` Skipped ${skippedCount} invalid rows.` : ''}` 
            });
            setIsBulkModalOpen(false);
            setBulkFile(null);
            setTimeout(() => setNotification({ show: false, ticketId: null }), 4000);
        } else {
            alert("No valid records found in the uploaded file. Please ensure you are using the correct template.");
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

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
        alert("No records to export.");
        return;
    }

    const headers = ["First Name", "Last Name", "Staff ID", "Department", "Role", "Email", "Phone", "Date Joined"];
    
    const csvRows = [
        headers.join(','),
        ...filteredEmployees.map(emp => {
            return [
                `"${emp.firstName}"`,
                `"${emp.lastName}"`,
                `"${emp.id}"`,
                `"${emp.department}"`,
                `"${emp.role}"`,
                `"${emp.email}"`,
                `"${emp.phone}"`,
                `"${emp.joinDate}"`
            ].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `staff_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateCurrentStep = () => {
      const newErrors: Record<string, string> = {};
      let isValid = true;

      if (currentStep === 1) {
          if (!formData.firstName) { newErrors.firstName = 'First name is required'; isValid = false; }
          if (!formData.lastName) { newErrors.lastName = 'Last name is required'; isValid = false; }
          if (!formData.id && !editingEmployeeId) { newErrors.id = 'Staff ID is required'; isValid = false; }
          
          if (!formData.phone) {
              newErrors.phone = 'Phone number is required';
              isValid = false;
          } else {
              if (!validateGhanaPhone(formData.phone)) {
                  newErrors.phone = 'Invalid Ghana number (e.g. 024xxxxxxx or +233...)';
                  isValid = false;
              } else if (!checkPhoneUnique(formData.phone, editingEmployeeId)) {
                  newErrors.phone = 'This phone number is already registered.';
                  isValid = false;
              }
          }
      }

      if (currentStep === 3) {
          if (formData.emergencyContact?.phone && !validateGhanaPhone(formData.emergencyContact.phone)) {
              newErrors.emergencyPhone = 'Invalid Ghana phone format';
              isValid = false;
          }
          if (formData.nextOfKin?.phone && !validateGhanaPhone(formData.nextOfKin.phone)) {
              newErrors.nokPhone = 'Invalid Ghana phone format';
              isValid = false;
          }
      }

      setErrors(newErrors);
      return isValid;
  };

  const sendWhatsAppNotification = (newEmployee: Employee) => {
    // In a real app, this would call a WhatsApp Business API
    // For this MIS, we simulate the notification and log it
    const message = `*New Staff Member Joined!* 🎓\n\nWe are excited to introduce *${newEmployee.firstName} ${newEmployee.lastName}* as our new *${newEmployee.role}* in the *${newEmployee.department}* department.\n\nWelcome to the OLA College family! 🏫✨`;
    
    console.log("--- WHATSAPP NOTIFICATION SENT TO ALL STAFF ---");
    console.log(message);
    console.log("-----------------------------------------------");
    
    // Also add a system notification
    if (typeof window !== 'undefined') {
        const pending = JSON.parse(localStorage.getItem('ola_pending_notifications') || '[]');
        pending.push({
            id: Date.now().toString(),
            text: `New Staff: ${newEmployee.firstName} ${newEmployee.lastName} has joined as ${newEmployee.role}.`,
            targetRole: 'ROLE-HR',
            time: 'Just now'
        });
        localStorage.setItem('ola_pending_notifications', JSON.stringify(pending));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;

    // Auto-generate institutional email if missing
    const finalEmail = formData.email || `${formData.firstName?.charAt(0).toLowerCase()}.${formData.lastName?.toLowerCase()}@ola.edu.gh`;

    // Ensure ID is present if not editing
    if (!editingEmployeeId && !formData.id) {
        alert("Please enter a Staff ID");
        return;
    }

    const finalData: Employee = {
        ...formData as Employee,
        email: finalEmail
    };

    if (editingEmployeeId) {
      setEmployees(prev => prev.map(emp => 
        emp.id === editingEmployeeId ? finalData : emp
      ));
    } else {
      setEmployees(prev => [finalData, ...prev]);
      localStorage.removeItem('new_staff_draft'); // Clear draft
      
      // Send WhatsApp notification for new employee
      sendWhatsAppNotification(finalData);
    }
    
    setIsModalOpen(false);
    setEditingEmployeeId(null);
    setFormData(initialFormState);
    setErrors({});
    
    // Show success notification
    setNotification({ show: true, ticketId: null });
    setTimeout(() => setNotification({ show: false, ticketId: null }), 3000);
  };

  const nextStep = () => {
      if (validateCurrentStep()) {
        saveDraft();
        setCurrentStep(prev => prev + 1);
      }
  };
  
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // --- Wizard Steps ---

  const renderStep1_BasicInfo = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group transition-colors hover:border-blue-400">
                    {formData.photo ? (
                        <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <User size={32} className="text-slate-400" />
                    )}
                    
                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-medium z-10">
                        <Upload size={20} className="mb-1" />
                        <span>Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isUploadingPhoto} />
                    </label>

                    {isUploadingPhoto && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                            <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    {isUploadingPhoto ? 'Uploading...' : 'Passport Photo'}
                </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">First Name <span className="text-red-500">*</span></label>
                  <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.firstName ? 'border-red-500' : ''}`} placeholder="e.g. Samuel" required />
                  {errors.firstName && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.firstName}</span>}
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Last Name <span className="text-red-500">*</span></label>
                  <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.lastName ? 'border-red-500' : ''}`} placeholder="e.g. Adjei" required />
                  {errors.lastName && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.lastName}</span>}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Staff ID <span className="text-red-500">*</span></label>
                  <input name="id" value={formData.id} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.id ? 'border-red-500' : ''}`} placeholder="e.g. EMP-001" required />
                  {errors.id && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.id}</span>}
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Department <span className="text-red-500">*</span></label>
                  <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                        <option value="">Select Dept</option>
                        <option value="Administration">Administration</option>
                        <option value="Academic Affairs">Academic Affairs</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="Education">Education</option>
                        <option value="ICT">ICT</option>
                  </select>
               </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Role / Job Title <span className="text-red-500">*</span></label>
                  <input name="role" value={formData.role} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Senior Lecturer" required />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Date Joined <span className="text-red-500">*</span></label>
                  <input type="date" name="joinDate" value={formData.joinDate} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" required />
               </div>
          </div>

          <hr className="border-slate-100" />
          <h4 className="text-sm font-bold text-slate-700">Contact Information</h4>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Phone Number <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.phone ? 'border-red-500 focus:ring-red-200' : ''}`} 
                    placeholder="+233 24 123 4567" 
                    required 
                  />
                  {errors.phone && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.phone}</span>}
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Personal Email</label>
                  <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="personal@gmail.com" />
              </div>
          </div>

          <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">House Address</label>
              <input name="houseAddress" value={formData.houseAddress} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Hse No. 123, Street Name, City" />
          </div>
           <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Box Address</label>
              <input name="boxAddress" value={formData.boxAddress} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="P.O. Box 45, Cape Coast" />
          </div>
      </div>
  );

  const renderStep2_Education = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                   <GraduationCap size={16} />
                   Add Qualification
               </h4>
               <div className="grid grid-cols-2 gap-3 mb-3">
                   <div>
                       <label className="text-xs font-medium text-blue-700 block mb-1">Degree</label>
                       <select 
                        value={eduForm.degree}
                        onChange={(e) => setEduForm({...eduForm, degree: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-300"
                       >
                           <option value="">Select Degree</option>
                           <option value="PhD">PhD</option>
                           <option value="M.Sc">M.Sc</option>
                           <option value="M.Phil">M.Phil</option>
                           <option value="M.Ed">M.Ed</option>
                           <option value="B.Sc">B.Sc</option>
                           <option value="B.Ed">B.Ed</option>
                           <option value="Diploma">Diploma</option>
                           <option value="Certificate">Certificate</option>
                       </select>
                   </div>
                   <div>
                       <label className="text-xs font-medium text-blue-700 block mb-1">Institution</label>
                       <input 
                        value={eduForm.institution}
                        onChange={(e) => setEduForm({...eduForm, institution: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm"
                        placeholder="University of Ghana"
                       />
                   </div>
               </div>
               <div className="grid grid-cols-3 gap-3 mb-3">
                   <div>
                       <label className="text-xs font-medium text-blue-700 block mb-1">Admission Year</label>
                       <input 
                        type="number"
                        value={eduForm.admissionYear}
                        onChange={(e) => setEduForm({...eduForm, admissionYear: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm"
                        placeholder="2010"
                       />
                   </div>
                   <div>
                       <label className="text-xs font-medium text-blue-700 block mb-1">Completion Year</label>
                       <input 
                        type="number"
                        value={eduForm.completionYear}
                        onChange={(e) => setEduForm({...eduForm, completionYear: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm"
                        placeholder="2014"
                       />
                   </div>
                   <div>
                       <label className="text-xs font-medium text-blue-700 block mb-1">Cert. Serial/Ref</label>
                       <input 
                        value={eduForm.referenceNumber}
                        onChange={(e) => setEduForm({...eduForm, referenceNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm"
                        placeholder="UEW/123/456"
                       />
                   </div>
               </div>
               <div className="flex items-end gap-3">
                   <div className="flex-1">
                        <label className="text-xs font-medium text-blue-700 block mb-1">Upload Certificate</label>
                        <input type="file" className="block w-full text-xs text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-xs file:font-semibold
                            file:bg-blue-100 file:text-blue-700
                            hover:file:bg-blue-200
                        "/>
                   </div>
                   <button 
                    type="button"
                    onClick={handleAddEducation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                   >
                       Add
                   </button>
               </div>
          </div>

          <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Education History</h4>
              {formData.education && formData.education.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                      {formData.education.map((edu) => (
                          <div key={edu.id} className="p-3 flex justify-between items-center bg-white">
                              <div>
                                  <p className="font-semibold text-slate-800 text-sm">{edu.degree} - {edu.institution}</p>
                                  <p className="text-xs text-slate-500">{edu.admissionYear} to {edu.completionYear} • Ref: {edu.referenceNumber}</p>
                              </div>
                              <button onClick={() => handleRemoveEducation(edu.id)} className="text-slate-400 hover:text-red-500">
                                  <X size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">No qualifications added yet.</p>
              )}
          </div>
      </div>
  );

  const renderStep3_Contacts = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          
          {/* Emergency Contact */}
          <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Emergency Contact Details</h4>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Full Name</label>
                      <input name="name" value={formData.emergencyContact?.name} onChange={handleEmergencyChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Contact Person" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Relation</label>
                       <select name="relation" value={formData.emergencyContact?.relation} onChange={handleEmergencyChange} className="w-full px-3 py-2 border rounded-lg text-sm">
                            <option value="">Select Relation</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                      </select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Phone</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.emergencyContact?.phone} 
                        onChange={handleEmergencyChange} 
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.emergencyPhone ? 'border-red-500' : ''}`} 
                        placeholder="020xxxxxxx" 
                      />
                      {errors.emergencyPhone && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.emergencyPhone}</span>}
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Email</label>
                      <input type="email" name="email" value={formData.emergencyContact?.email} onChange={handleEmergencyChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="contact@email.com" />
                  </div>
              </div>
          </div>

          {/* Next of Kin */}
          <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Next of Kin Details</h4>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Full Name</label>
                      <input name="name" value={formData.nextOfKin?.name} onChange={handleNextOfKinChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Next of Kin Name" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Relation</label>
                      <select name="relation" value={formData.nextOfKin?.relation} onChange={handleNextOfKinChange} className="w-full px-3 py-2 border rounded-lg text-sm">
                            <option value="">Select Relation</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Other">Other</option>
                      </select>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Phone</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.nextOfKin?.phone} 
                        onChange={handleNextOfKinChange} 
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.nokPhone ? 'border-red-500' : ''}`} 
                        placeholder="024xxxxxxx" 
                      />
                      {errors.nokPhone && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.nokPhone}</span>}
                  </div>
                   <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Address</label>
                      <input name="address" value={formData.nextOfKin?.address} onChange={handleNextOfKinChange} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Residential Address" />
                  </div>
              </div>
          </div>
      </div>
  );

  const renderStep4_Preview = () => (
      <div className="animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-800 rounded-t-xl p-6 text-white flex items-center gap-6">
               <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/20">
                    {formData.photo ? (
                        <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <User size={40} className="text-white/50" />
                    )}
               </div>
               <div>
                   <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
                   <p className="text-blue-300 font-medium">{formData.role}</p>
                   <p className="text-sm text-slate-400">{formData.department} • {formData.id}</p>
               </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 border-t-0 p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                   <div>
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Details</h4>
                       <div className="space-y-2 text-sm text-slate-700">
                           <p><span className="font-medium text-slate-900 w-24 inline-block">Phone:</span> {formData.phone}</p>
                           <p><span className="font-medium text-slate-900 w-24 inline-block">Email:</span> {formData.personalEmail || 'N/A'}</p>
                           <p><span className="font-medium text-slate-900 w-24 inline-block">Address:</span> {formData.houseAddress || 'N/A'}</p>
                           <p><span className="font-medium text-slate-900 w-24 inline-block">Joined:</span> {formData.joinDate}</p>
                       </div>
                   </div>
                   <div>
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contacts</h4>
                        <div className="space-y-3 text-sm">
                           <div className="bg-white p-2 rounded border border-slate-200">
                               <p className="font-bold text-slate-800 text-xs mb-1">Emergency Contact</p>
                               <p className="text-slate-600">{formData.emergencyContact?.name} ({formData.emergencyContact?.relation})</p>
                               <p className="text-slate-500 text-xs">{formData.emergencyContact?.phone}</p>
                           </div>
                           <div className="bg-white p-2 rounded border border-slate-200">
                               <p className="font-bold text-slate-800 text-xs mb-1">Next of Kin</p>
                               <p className="text-slate-600">{formData.nextOfKin?.name} ({formData.nextOfKin?.relation})</p>
                               <p className="text-slate-500 text-xs">{formData.nextOfKin?.phone}</p>
                           </div>
                        </div>
                   </div>
              </div>

              <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qualifications</h4>
                   <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-slate-100 text-slate-600 font-semibold">
                               <tr>
                                   <th className="p-2">Degree</th>
                                   <th className="p-2">Institution</th>
                                   <th className="p-2">Year</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {formData.education?.map((edu, i) => (
                                   <tr key={i}>
                                       <td className="p-2 font-medium">{edu.degree}</td>
                                       <td className="p-2">{edu.institution}</td>
                                       <td className="p-2">{edu.completionYear}</td>
                                   </tr>
                               ))}
                               {(!formData.education || formData.education.length === 0) && (
                                   <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic">No education history added.</td></tr>
                               )}
                           </tbody>
                       </table>
                   </div>
              </div>
            </div>
      </div>
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Staff Directory</h2>
           <p className="text-sm text-slate-500">Manage employee records and information</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExportCSV}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Download size={18} />
                <span>Export CSV</span>
            </button>
            <button 
                onClick={() => setIsBulkModalOpen(true)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <FileSpreadsheet size={18} />
                <span>Bulk Import</span>
            </button>
            <button 
                onClick={handleAddClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Plus size={18} />
                <span>Add Staff</span>
            </button>
        </div>
      </div>

      {/* Filters */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search staff..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto relative">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                filterDept || showFilterMenu 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            Filter
            {filterDept && <div className="w-2 h-2 rounded-full bg-blue-600 ml-1"></div>}
          </button>
          
          {showFilterMenu && (
             <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-20 animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="p-1 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Department</p>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                    <button
                        onClick={() => { setFilterDept(''); setShowFilterMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                            filterDept === '' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        All Departments
                        {filterDept === '' && <Check size={14} />}
                    </button>
                    {uniqueDepts.map(dept => (
                         <button
                            key={dept}
                            onClick={() => { setFilterDept(dept); setShowFilterMenu(false); }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                                filterDept === dept ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className="truncate mr-2">{dept}</span>
                            {filterDept === dept && <Check size={14} className="flex-shrink-0" />}
                        </button>
                    ))}
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right flex items-center gap-3">
              <CheckCircle size={20} />
              <div>
                  <p className="font-medium text-sm">{notification.message || 'Action completed successfully'}</p>
              </div>
          </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
          ) : (
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 w-12">
                            <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredEmployees.length} />
                        </th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Employee</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Department</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                        <th className="px-6 py-4 font-semibold text-slate-600">Contact</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredEmployees.map(emp => (
                          <tr key={emp.id} onClick={() => handleRowClick(emp)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                  <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={(e) => handleSelectOne(e, emp.id)} />
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden">
                                          {emp.photo ? <img src={emp.photo} alt="" className="w-full h-full object-cover" /> : <span>{emp.firstName[0]}{emp.lastName[0]}</span>}
                                      </div>
                                      <div>
                                          <p className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</p>
                                          <p className="text-xs text-slate-500">{emp.id}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{emp.department}</td>
                              <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{emp.role}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                  <div className="flex flex-col text-xs">
                                      <span className="flex items-center gap-1"><Mail size={10} /> {emp.email}</span>
                                      <span className="flex items-center gap-1 mt-0.5"><Phone size={10} /> {emp.phone}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={(e) => handleEditClick(e, emp)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                      <button onClick={(e) => handleDeleteClick(e, emp.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {filteredEmployees.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">No staff records found.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
          )}
      </div>

       {/* View Modal */}
       {isViewModalOpen && viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-800 rounded-t-xl p-6 text-white flex items-center gap-6 relative">
                 <button onClick={() => setIsViewModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={20} /></button>
                 <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/20">
                      {viewingEmployee.photo ? (
                          <img src={viewingEmployee.photo} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                          <User size={40} className="text-white/50" />
                      )}
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold">{viewingEmployee.firstName} {viewingEmployee.lastName}</h2>
                     <p className="text-blue-300 font-medium">{viewingEmployee.role}</p>
                     <p className="text-sm text-slate-400">{viewingEmployee.department} • {viewingEmployee.id}</p>
                 </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 border-t-0 p-6 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                     <div>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Details</h4>
                         <div className="space-y-2 text-sm text-slate-700">
                             <p><span className="font-medium text-slate-900 w-24 inline-block">Phone:</span> {viewingEmployee.phone}</p>
                             <p><span className="font-medium text-slate-900 w-24 inline-block">Email:</span> {viewingEmployee.email}</p>
                             <p><span className="font-medium text-slate-900 w-24 inline-block">Address:</span> {viewingEmployee.houseAddress || 'N/A'}</p>
                             <p><span className="font-medium text-slate-900 w-24 inline-block">Joined:</span> {viewingEmployee.joinDate}</p>
                         </div>
                     </div>
                     <div>
                         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contacts</h4>
                          <div className="space-y-3 text-sm">
                             <div className="bg-white p-2 rounded border border-slate-200">
                                 <p className="font-bold text-slate-800 text-xs mb-1">Emergency Contact</p>
                                 <p className="text-slate-600">{viewingEmployee.emergencyContact?.name} ({viewingEmployee.emergencyContact?.relation})</p>
                                 <p className="text-slate-500 text-xs">{viewingEmployee.emergencyContact?.phone}</p>
                             </div>
                          </div>
                     </div>
                </div>
                 {viewingEmployee.education && viewingEmployee.education.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Qualifications</h4>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-semibold">
                                    <tr>
                                        <th className="p-2">Degree</th>
                                        <th className="p-2">Institution</th>
                                        <th className="p-2">Year</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {viewingEmployee.education.map((edu, i) => (
                                        <tr key={i}>
                                            <td className="p-2 font-medium">{edu.degree}</td>
                                            <td className="p-2">{edu.institution}</td>
                                            <td className="p-2">{edu.completionYear}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                  <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-white text-sm font-medium">Close</button>
                  <button onClick={(e) => { setIsViewModalOpen(false); handleEditClick(e, viewingEmployee); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                      <Edit2 size={14} /> Edit Profile
                  </button>
              </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Bulk Import Staff</h3>
                <button onClick={handleCloseBulkModal}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">Step 1: Download Template</h4>
                    <p className="text-xs text-blue-600 mb-3">Download the CSV template to ensure your data is formatted correctly.</p>
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
                <button onClick={handleProcessBulkUpload} disabled={!bulkFile} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bulkFile ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Import Records</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div>
                  <h3 className="text-lg font-bold text-slate-800">{editingEmployeeId ? 'Edit Staff Profile' : 'New Staff Registration'}</h3>
                  <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4].map(step => (
                          <div key={step} className={`h-1.5 w-8 rounded-full transition-colors ${currentStep >= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                      ))}
                      <span className="text-xs font-medium text-slate-500 ml-2">Step {currentStep} of 4</span>
                  </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full border border-slate-200 hover:bg-slate-100"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {currentStep === 1 && renderStep1_BasicInfo()}
                {currentStep === 2 && renderStep2_Education()}
                {currentStep === 3 && renderStep3_Contacts()}
                {currentStep === 4 && renderStep4_Preview()}
            </form>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                {currentStep > 1 ? (
                    <button type="button" onClick={prevStep} className="px-4 py-2 text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all text-sm font-medium flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                ) : <div></div>}

                <div className="flex gap-3">
                    {currentStep < 4 ? (
                         <button type="button" onClick={nextStep} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2">Save & Continue <ArrowRight size={16} /></button>
                    ) : (
                        <button type="button" onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2"><Save size={16} /> Submit Registration</button>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;