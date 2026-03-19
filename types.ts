import React, { useState } from 'react';

export enum UserRole {
  ADMIN = 'ROLE-ADMIN',
  STAFF = 'ROLE-STAFF',
  STUDENT = 'ROLE-STUDENT',
  LECTURER = 'ROLE-LECTURER',
  HR = 'ROLE-HR',
  IT = 'ROLE-IT'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum LeaveType {
  SICK = 'SICK',
  CASUAL = 'CASUAL',
  MATERNITY = 'MATERNITY',
  STUDY = 'STUDY',
  ANNUAL = 'ANNUAL'
}

// --- Appraisal System Types ---

export type QuestionType = 'text' | 'rating' | 'yes_no';

export interface AppraisalQuestion {
  id: string;
  text: string;
  type: QuestionType;
  description?: string;
}

export interface AppraisalTemplate {
  id: string;
  title: string;
  description: string;
  questions: AppraisalQuestion[];
  assignedDepartments: string[]; // Department names
  assignedEmployeeIds: string[];
  createdBy: string;
  createdAt: string;
  status: 'active' | 'draft' | 'closed';
  targetGroup: 'teaching' | 'non-teaching' | 'all';
}

export interface AppraisalSubmission {
  id: string;
  templateId: string;
  employeeId: string;
  employeeName: string;
  answers: Record<string, string | number>; // questionId -> answer
  submittedAt: string;
  status: 'submitted' | 'reviewed';
}

// --- Memo System Types ---

export enum MemoStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Memo {
  id: string;
  senderId: string;
  senderName: string;
  senderDept: string;
  receiverId: string;
  receiverName: string;
  approverId: string; // The ID of the HOD who must approve
  subject: string;
  body: string;
  date: string;
  status: MemoStatus;
  isRead: boolean;
  rejectionReason?: string;
}

// --- Student Portal Types ---

export interface Program {
  id: string;
  name: string;
  code: string; // e.g., BED-PRI
  description?: string;
  durationYears: number;
}

export interface CourseSchedule {
  day: string;
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  venue?: string;
}

export interface AvailableCourse {
  code: string;
  title: string;
  credits: number;
  level: number; // 100, 200, 300, 400
  semester: number; // 1 or 2
  prerequisites?: string[]; // Array of course codes
  department: string;
  assignedLecturerId?: string; // ID of the lecturer
  programIds?: string[]; // IDs of programs this course belongs to
  schedule?: CourseSchedule[];
}

export interface Assessment {
  id: string;
  courseCode: string;
  studentId: string;
  lecturerId: string;
  score: number;
  maxScore: number;
  type: 'Assignment' | 'Quiz' | 'Mid-Sem' | 'Project';
  date: string;
}

export interface Grade {
  courseCode: string;
  courseTitle: string;
  credits: number;
  assessmentScore: number; // Continuous Assessment (e.g., 30%)
  examScore: number;       // Final Exam (e.g., 70%)
  score: number;           // Total (assessmentScore + examScore)
  grade: string; // A, B+, etc.
  gradePoint: number;
}

export interface SemesterRecord {
  academicYear: string; // e.g. "2023/2024"
  semesterNumber: number; // 1 or 2
  semester: string; // e.g., "Year 1 - Sem 1" (Display title)
  grades: Grade[];
  gpa: number;
  cgpa?: number; // Cumulative GPA up to this semester
  creditsEarned: number;
}

export interface FeeRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT'; // Debit = Invoice, Credit = Payment
  balance: number;
  paymentMethod?: string;
  referenceNumber?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  year: number; // 1, 2, 3, 4
  enrollmentDate: string;
  status: 'Active' | 'Graduated' | 'Suspended';
  gpa: number;
  photo?: string;
  // Extended Portal Data
  academicHistory?: SemesterRecord[];
  financialHistory?: FeeRecord[];
  attendance?: number; // percentage
  registeredCourses?: string[]; // Array of Course Codes currently registered for the ACTIVE semester
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  admissionYear: string;
  completionYear: string;
  referenceNumber: string;
  certificateUrl?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  email: string;
  phone: string;
}

export interface NextOfKin {
  name: string;
  relation: string;
  phone: string;
  address: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  joinDate: string;
  photo?: string;
  // Extended fields
  personalEmail?: string;
  houseAddress?: string;
  boxAddress?: string;
  education?: Education[];
  emergencyContact?: EmergencyContact;
  nextOfKin?: NextOfKin;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  requestDate: string;
  rejectionReason?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// --- New Settings & Auth Types ---

export interface Department {
  id: string;
  name: string;
  headOfDept?: string; // Employee Name or ID
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // e.g., ['read:leave', 'write:student']
}

export interface SystemUser {
  id: string;
  username: string;
  password?: string; // In a real app, this would be hashed. For demo, plain text or masked.
  employeeId: string; // Links to Employee record
  roleIds: string[]; // Updated to support multiple roles
  isActive: boolean;
  lastLogin?: string;
}

export interface AuthContextType {
  user: SystemUser | null;
  login: (user: SystemUser) => void;
  logout: () => void;
}

// --- Help Desk Types ---

export enum TicketStatus {
  OPEN = 'OPEN', // Used for "Pending"
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_CLIENT = 'WAITING_ON_CLIENT',
  RESOLVED = 'RESOLVED', // Used for "Completed"
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requesterId: string; // Employee ID
  requesterName: string;
  assignedTo?: string; // IT Staff ID
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
}

// --- To-Do List Types ---

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  category?: string;
  dueDate?: string;
}