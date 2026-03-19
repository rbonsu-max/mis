import { Student, Employee, LeaveRequest, LeaveStatus, LeaveType, Department, Role, SystemUser, Ticket, TicketStatus, TicketPriority, SemesterRecord, FeeRecord, Memo, MemoStatus, AvailableCourse, Program, Task, AppraisalTemplate } from './types';

export const APP_NAME = "OLA College MIS";

// --- Mock Data Helpers ---

const mockAcademicHistory: SemesterRecord[] = [
    {
        academicYear: "2023/2024",
        semesterNumber: 1,
        semester: "Year 1 - Semester 1",
        gpa: 3.6,
        creditsEarned: 18,
        grades: [
            { courseCode: "EDU101", courseTitle: "Foundations of Education", credits: 3, assessmentScore: 30, examScore: 55, score: 85, grade: "A", gradePoint: 4.0 },
            { courseCode: "PSY101", courseTitle: "Intro to Psychology", credits: 3, assessmentScore: 25, examScore: 53, score: 78, grade: "B+", gradePoint: 3.5 },
            { courseCode: "ENG101", courseTitle: "Academic Writing", credits: 3, assessmentScore: 28, examScore: 54, score: 82, grade: "A-", gradePoint: 3.7 },
            { courseCode: "MAT101", courseTitle: "General Mathematics", credits: 3, assessmentScore: 30, examScore: 60, score: 90, grade: "A", gradePoint: 4.0 },
            { courseCode: "ICT101", courseTitle: "Intro to Computers", credits: 3, assessmentScore: 20, examScore: 55, score: 75, grade: "B", gradePoint: 3.0 },
            { courseCode: "GNS101", courseTitle: "General Science", credits: 3, assessmentScore: 24, examScore: 56, score: 80, grade: "A-", gradePoint: 3.7 },
        ]
    },
    {
        academicYear: "2023/2024",
        semesterNumber: 2,
        semester: "Year 1 - Semester 2",
        gpa: 3.4,
        creditsEarned: 18,
        grades: [
            { courseCode: "EDU102", courseTitle: "Curriculum Development", credits: 3, assessmentScore: 26, examScore: 50, score: 76, grade: "B+", gradePoint: 3.5 },
            { courseCode: "PSY102", courseTitle: "Child Development", credits: 3, assessmentScore: 28, examScore: 52, score: 80, grade: "A-", gradePoint: 3.7 },
            { courseCode: "ENG102", courseTitle: "Literature in English", credits: 3, assessmentScore: 22, examScore: 50, score: 72, grade: "B", gradePoint: 3.0 },
            { courseCode: "MAT102", courseTitle: "Algebra & Geometry", credits: 3, assessmentScore: 30, examScore: 55, score: 85, grade: "A", gradePoint: 4.0 },
            { courseCode: "ICT102", courseTitle: "Educational Technology", credits: 3, assessmentScore: 15, examScore: 50, score: 65, grade: "C+", gradePoint: 2.5 },
            { courseCode: "GNS102", courseTitle: "Environmental Science", credits: 3, assessmentScore: 25, examScore: 53, score: 78, grade: "B+", gradePoint: 3.5 },
        ]
    }
];

const mockFinancials: FeeRecord[] = [
    { id: 'TXN-001', date: '2024-09-01', description: 'Academic Facility User Fee (Year 1)', amount: 2500, type: 'DEBIT', balance: 2500, paymentMethod: 'System', referenceNumber: 'SYS-BILL-001' },
    { id: 'TXN-002', date: '2024-09-05', description: 'Tuition Payment', amount: 1500, type: 'CREDIT', balance: 1000, paymentMethod: 'Mobile Money', referenceNumber: 'MM-240905-X82' },
    { id: 'TXN-003', date: '2024-09-10', description: 'SRC Dues', amount: 200, type: 'DEBIT', balance: 1200, paymentMethod: 'System', referenceNumber: 'SYS-BILL-003' },
    { id: 'TXN-004', date: '2024-09-15', description: 'Tuition Payment', amount: 1000, type: 'CREDIT', balance: 200, paymentMethod: 'Bank Draft', referenceNumber: 'BD-2024-9988' },
];

export const MOCK_STUDENTS: Student[] = [
  { 
      id: 'OLA-2024-001', 
      firstName: 'Kwame', 
      lastName: 'Mensah', 
      email: 'k.mensah@ola.edu.gh', 
      program: 'B.Ed. Primary Education', 
      year: 2, // Changed to Year 2 to demonstrate prerequisites
      enrollmentDate: '2024-09-01', 
      status: 'Active', 
      gpa: 3.5,
      academicHistory: mockAcademicHistory,
      financialHistory: mockFinancials,
      attendance: 92,
      registeredCourses: ['EDU201', 'PSY201', 'ICT201'] // Example registered courses for current semester
  },
  { 
      id: 'OLA-2023-045', 
      firstName: 'Ama', 
      lastName: 'Osei', 
      email: 'a.osei@ola.edu.gh', 
      program: 'B.Ed. JHS Education', 
      year: 2, 
      enrollmentDate: '2023-09-01', 
      status: 'Active', 
      gpa: 3.8,
      academicHistory: mockAcademicHistory,
      financialHistory: mockFinancials,
      attendance: 88,
      registeredCourses: ['EDU201', 'ICT201']
  },
  { 
      id: 'OLA-2022-112', 
      firstName: 'John', 
      lastName: 'Doe', 
      email: 'j.doe@ola.edu.gh', 
      program: 'B.Ed. Early Childhood', 
      year: 3, 
      enrollmentDate: '2022-09-01', 
      status: 'Active', 
      gpa: 2.9,
      academicHistory: [],
      financialHistory: [],
      attendance: 75,
      registeredCourses: []
  },
  { 
      id: 'OLA-2021-089', 
      firstName: 'Sarah', 
      lastName: 'Appiah', 
      email: 's.appiah@ola.edu.gh', 
      program: 'B.Ed. Primary Education', 
      year: 4, 
      enrollmentDate: '2021-09-01', 
      status: 'Active', 
      gpa: 3.9,
      academicHistory: mockAcademicHistory,
      financialHistory: mockFinancials,
      attendance: 98,
      registeredCourses: []
  },
  { 
      id: 'OLA-2024-022', 
      firstName: 'Emmanuel', 
      lastName: 'Boateng', 
      email: 'e.boateng@ola.edu.gh', 
      program: 'B.Ed. Mathematics', 
      year: 1, 
      enrollmentDate: '2024-09-01', 
      status: 'Active', 
      gpa: 3.2,
      academicHistory: [],
      financialHistory: [],
      attendance: 85,
      registeredCourses: ['EDU101', 'MAT101']
  },
];

export const MOCK_PROGRAMS: Program[] = [
    { id: 'PROG-001', name: 'B.Ed. Primary Education', code: 'BED-PRI', durationYears: 4 },
    { id: 'PROG-002', name: 'B.Ed. JHS Education', code: 'BED-JHS', durationYears: 4 },
    { id: 'PROG-003', name: 'B.Ed. Early Childhood', code: 'BED-ECE', durationYears: 4 },
    { id: 'PROG-004', name: 'B.Ed. Mathematics', code: 'BED-MAT', durationYears: 4 },
    { id: 'PROG-005', name: 'B.Ed. Science', code: 'BED-SCI', durationYears: 4 },
];

export const MOCK_AVAILABLE_COURSES: AvailableCourse[] = [
    // Year 1 Courses (No Prerequisites)
    { 
        code: 'EDU101', 
        title: 'Foundations of Education', 
        credits: 3, 
        level: 100, 
        semester: 1, 
        department: 'Education', 
        programIds: ['PROG-001', 'PROG-002', 'PROG-003'], 
        assignedLecturerId: 'EMP-001',
        schedule: [{ day: 'Monday', startTime: '08:00', endTime: '10:00', venue: 'Lecture Hall 1' }]
    },
    { 
        code: 'PSY101', 
        title: 'Intro to Psychology', 
        credits: 3, 
        level: 100, 
        semester: 1, 
        department: 'Education', 
        programIds: ['PROG-001', 'PROG-002'], 
        assignedLecturerId: 'EMP-002',
        schedule: [{ day: 'Monday', startTime: '09:00', endTime: '11:00', venue: 'Lecture Hall 2' }] // INTENTIONAL CONFLICT with EDU101
    },
    { 
        code: 'ENG101', 
        title: 'Academic Writing', 
        credits: 3, 
        level: 100, 
        semester: 1, 
        department: 'Languages', 
        programIds: ['PROG-001', 'PROG-002', 'PROG-003', 'PROG-004', 'PROG-005'],
        schedule: [{ day: 'Tuesday', startTime: '13:00', endTime: '15:00', venue: 'Hall 3' }]
    },
    
    // Year 2 Courses (With Prerequisites)
    { 
        code: 'EDU201', 
        title: 'Assessment in Schools', 
        credits: 3, 
        level: 200, 
        semester: 1, 
        prerequisites: ['EDU101'], 
        department: 'Education', 
        programIds: ['PROG-001', 'PROG-002'], 
        assignedLecturerId: 'EMP-002',
        schedule: [{ day: 'Wednesday', startTime: '10:00', endTime: '12:00', venue: 'Room 404' }]
    },
    { 
        code: 'PSY201', 
        title: 'Educational Psychology', 
        credits: 3, 
        level: 200, 
        semester: 1, 
        prerequisites: ['PSY101'], 
        department: 'Education', 
        programIds: ['PROG-001'], 
        assignedLecturerId: 'EMP-001',
        schedule: [{ day: 'Wednesday', startTime: '11:00', endTime: '13:00', venue: 'Room 202' }] // INTENTIONAL CONFLICT with EDU201
    },
    { code: 'MTH201', title: 'Calculus I', credits: 3, level: 200, semester: 1, prerequisites: ['MAT101'], department: 'Mathematics', programIds: ['PROG-004'], assignedLecturerId: 'EMP-003' },
    { code: 'STS201', title: 'Statistics for Educators', credits: 3, level: 200, semester: 1, prerequisites: ['MAT101'], department: 'Mathematics', programIds: ['PROG-004', 'PROG-005'], assignedLecturerId: 'EMP-003' },
    { code: 'ICT201', title: 'Multimedia in Education', credits: 3, level: 200, semester: 1, prerequisites: ['ICT101'], department: 'ICT', programIds: ['PROG-001', 'PROG-002', 'PROG-003'] },
    { code: 'GNS201', title: 'African Studies', credits: 2, level: 200, semester: 1, department: 'General', programIds: ['PROG-001', 'PROG-002', 'PROG-003', 'PROG-004', 'PROG-005'] },
    { code: 'PED201', title: 'Physical Education', credits: 1, level: 200, semester: 1, department: 'General', programIds: ['PROG-001'] },
    { code: 'LIT201', title: 'African Literature', credits: 3, level: 200, semester: 1, prerequisites: ['ENG102'], department: 'Languages', programIds: ['PROG-002'] },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', firstName: 'Dr. Samuel', lastName: 'Adjei', department: 'Administration', role: 'Principal', email: 'principal@ola.edu.gh', phone: '0244123456', joinDate: '2015-01-10' },
  { id: 'EMP-002', firstName: 'Grace', lastName: 'Ansah', department: 'Academic Affairs', role: 'Registrar', email: 'registrar@ola.edu.gh', phone: '0200987654', joinDate: '2018-05-15' },
  { id: 'EMP-003', firstName: 'Peter', lastName: 'Ofori', department: 'Mathematics', role: 'Lecturer', email: 'p.ofori@ola.edu.gh', phone: '0501239876', joinDate: '2020-09-01' },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'LR-101', employeeId: 'EMP-003', employeeName: 'Peter Ofori', type: LeaveType.SICK, startDate: '2024-05-10', endDate: '2024-05-12', reason: 'Severe malaria diagnosis', status: LeaveStatus.APPROVED, requestDate: '2024-05-09' },
  { id: 'LR-102', employeeId: 'EMP-002', employeeName: 'Grace Ansah', type: LeaveType.ANNUAL, startDate: '2024-12-20', endDate: '2025-01-05', reason: 'End of year family vacation', status: LeaveStatus.PENDING, requestDate: '2024-10-15' },
  { id: 'LR-103', employeeId: 'EMP-001', employeeName: 'Dr. Samuel Adjei', type: LeaveType.CASUAL, startDate: '2024-06-01', endDate: '2024-06-02', reason: 'Personal errands', status: LeaveStatus.REJECTED, requestDate: '2024-05-28' },
];

export const MOCK_MEMOS: Memo[] = [
    { 
        id: 'MEMO-001', 
        senderId: 'EMP-002', 
        senderName: 'Grace Ansah', 
        senderDept: 'Academic Affairs', 
        receiverId: 'EMP-003', 
        receiverName: 'Peter Ofori', 
        approverId: 'EMP-001', 
        subject: 'Upcoming Exam Schedule', 
        body: 'Please find attached the draft schedule for the end-of-semester examinations. Kindly review and provide feedback by Friday.', 
        date: '2024-05-20', 
        status: MemoStatus.APPROVED, 
        isRead: true 
    },
    { 
        id: 'MEMO-002', 
        senderId: 'EMP-003', 
        senderName: 'Peter Ofori', 
        senderDept: 'Mathematics', 
        receiverId: 'EMP-002', 
        receiverName: 'Grace Ansah', 
        approverId: 'EMP-003', // Self-approved for HODs or routed to Principal (simplified)
        subject: 'Math Department Budget', 
        body: 'Submitting the proposed budget for new teaching aids for the next semester.', 
        date: '2024-05-22', 
        status: MemoStatus.PENDING_APPROVAL, 
        isRead: false 
    }
];

// --- Mock Data for Settings ---

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'DEPT-001', name: 'Administration', headOfDept: 'Dr. Samuel Adjei', description: 'General college management' },
  { id: 'DEPT-002', name: 'Academic Affairs', headOfDept: 'Grace Ansah', description: 'Student records and admissions' },
  { id: 'DEPT-003', name: 'Mathematics', headOfDept: 'Peter Ofori', description: 'Mathematics education department' },
  { id: 'DEPT-004', name: 'Science', headOfDept: 'TBD', description: 'Science education department' },
  { id: 'DEPT-005', name: 'ICT', headOfDept: 'TBD', description: 'Information and Communication Technology' },
];

export const MOCK_ROLES: Role[] = [
  { id: 'ROLE-ADMIN', name: 'Super Administrator', description: 'Full access to all system modules', permissions: ['all'] },
  { id: 'ROLE-LECTURER', name: 'Lecturer', description: 'Access to student assessments and academic management', permissions: ['read:students', 'write:assessment', 'read:academics'] },
  { id: 'ROLE-STAFF', name: 'Academic Staff', description: 'Access to student records and leave application', permissions: ['read:students', 'write:leave'] },
  { id: 'ROLE-HR', name: 'Human Resources', description: 'Access to staff directory and leave approvals', permissions: ['read:staff', 'write:staff', 'approve:leave'] },
  { id: 'ROLE-IT', name: 'IT Support', description: 'Technical support and system settings management', permissions: ['read:settings', 'write:settings', 'read:ticket', 'write:ticket'] },
  { id: 'ROLE-NON-TEACHING', name: 'Non-Teaching Staff', description: 'Support staff with leave application access', permissions: ['write:leave'] },
];

export const MOCK_USERS: SystemUser[] = [
  { id: 'USR-001', username: 'admin', password: 'password123', employeeId: 'EMP-001', roleIds: ['ROLE-ADMIN'], isActive: true },
  { id: 'USR-002', username: 'p.ofori', password: 'password123', employeeId: 'EMP-003', roleIds: ['ROLE-LECTURER'], isActive: true },
  { id: 'USR-003', username: 'student', password: 'password123', employeeId: 'OLA-2024-001', roleIds: ['ROLE-STUDENT'], isActive: true },
];

export const MOCK_TICKETS: Ticket[] = [
  { id: 'TKT-001', title: 'Printer in Staff Room not working', description: 'The HP LaserJet is showing a paper jam error but there is no paper jammed.', requesterId: 'EMP-003', requesterName: 'Peter Ofori', status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, createdAt: '2024-05-20' },
  { id: 'TKT-002', title: 'Cannot access Student Portal', description: 'I get a 403 error when trying to view student grades.', requesterId: 'EMP-002', requesterName: 'Grace Ansah', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, createdAt: '2024-05-21' },
];

export const MOCK_TASKS: Task[] = [
    { id: '1', text: 'Review Fall Semester schedule', completed: false, priority: 'high', createdAt: '2024-06-01', category: 'Work' },
    { id: '2', text: 'Submit budget report to Principal', completed: true, priority: 'medium', createdAt: '2024-05-28', category: 'Finance' },
    { id: '3', text: 'Update staff directory photos', completed: false, priority: 'low', createdAt: '2024-06-02', category: 'Admin' },
];

export const MOCK_APPRAISAL_TEMPLATES: AppraisalTemplate[] = [
    {
        id: 'APP-TEMP-001',
        title: 'Annual Performance Review - Administrative Staff',
        description: 'Standard performance evaluation for non-teaching administrative personnel.',
        targetGroup: 'non-teaching',
        status: 'active',
        assignedDepartments: ['Administration', 'Academic Affairs'],
        assignedEmployeeIds: [],
        createdBy: 'EMP-001',
        createdAt: '2024-01-15',
        questions: [
            { id: 'q1', text: 'Demonstrates ability to complete tasks on time.', type: 'rating', description: 'Rate from 1 (Poor) to 5 (Excellent)' },
            { id: 'q2', text: 'Communicates effectively with colleagues and students.', type: 'rating', description: 'Rate from 1 (Poor) to 5 (Excellent)' },
            { id: 'q3', text: 'Adheres to college policies and procedures.', type: 'yes_no' },
            { id: 'q4', text: 'Describe your major achievements this year.', type: 'text' },
            { id: 'q5', text: 'What areas do you believe you need improvement in?', type: 'text' }
        ]
    }
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
    'en': {
        'Dashboard': 'Dashboard',
        'Student Portal': 'Student Portal',
        'Student Records': 'Student Records',
        'Academic Manager': 'Academic Manager',
        'Timetable': 'Timetable',
        'Staff Directory': 'Staff Directory',
        'Leave Management': 'Leave Management',
        'Internal Memos': 'Internal Memos',
        'Help Desk': 'Help Desk',
        'AI Assistant': 'AI Assistant',
        'Settings': 'Settings',
        'To-Do List': 'To-Do List',
        'Self-Appraisal': 'Self-Appraisal',
        'Sign Out': 'Sign Out'
    },
    'fr': {
        'Dashboard': 'Tableau de bord',
        'Student Records': 'Dossiers Étudiants',
        'Academic Manager': 'Gestion Académique',
        'Timetable': 'Emploi du temps',
        'Staff Directory': 'Annuaire du Personnel',
        'Leave Management': 'Gestion des Congés',
        'Internal Memos': 'Notes Internes',
        'Help Desk': 'Support Technique',
        'AI Assistant': 'Assistant IA',
        'Settings': 'Paramètres',
        'To-Do List': 'Liste de Tâches',
        'Self-Appraisal': 'Auto-évaluation',
        'Sign Out': 'Déconnexion'
    }
};