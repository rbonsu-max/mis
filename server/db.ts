import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'database.sqlite');

let db: Database.Database;

export function getDatabase() {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
    }
    return db;
}

export function initializeDatabase() {
    const db = getDatabase();

    // Create Tables based on types.ts
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            employeeId TEXT,
            roleIds TEXT, -- JSON array of role IDs
            isActive INTEGER,
            lastLogin TEXT
        );

        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            permissions TEXT -- JSON array of permissions
        );

        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT,
            headOfDept TEXT,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            firstName TEXT,
            lastName TEXT,
            department TEXT,
            role TEXT,
            email TEXT,
            phone TEXT,
            joinDate TEXT,
            photo TEXT,
            personalEmail TEXT,
            houseAddress TEXT,
            boxAddress TEXT,
            education TEXT, -- JSON array
            emergencyContact TEXT, -- JSON object
            nextOfKin TEXT -- JSON object
        );

        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            firstName TEXT,
            lastName TEXT,
            email TEXT,
            program TEXT,
            year INTEGER,
            enrollmentDate TEXT,
            status TEXT,
            gpa REAL,
            photo TEXT,
            attendance REAL,
            registeredCourses TEXT -- JSON array of course codes
        );

        CREATE TABLE IF NOT EXISTS academic_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId TEXT,
            academicYear TEXT,
            semesterNumber INTEGER,
            semester TEXT,
            gpa REAL,
            cgpa REAL,
            creditsEarned INTEGER,
            FOREIGN KEY(studentId) REFERENCES students(id)
        );

        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            academicRecordId INTEGER,
            courseCode TEXT,
            courseTitle TEXT,
            credits INTEGER,
            score REAL,
            grade TEXT,
            gradePoint REAL,
            FOREIGN KEY(academicRecordId) REFERENCES academic_records(id)
        );

        CREATE TABLE IF NOT EXISTS fee_records (
            id TEXT PRIMARY KEY,
            studentId TEXT,
            date TEXT,
            description TEXT,
            amount REAL,
            type TEXT, -- 'DEBIT' or 'CREDIT'
            balance REAL,
            paymentMethod TEXT,
            referenceNumber TEXT,
            FOREIGN KEY(studentId) REFERENCES students(id)
        );

        CREATE TABLE IF NOT EXISTS courses (
            code TEXT PRIMARY KEY,
            title TEXT,
            credits INTEGER,
            level INTEGER,
            semester INTEGER,
            department TEXT,
            prerequisites TEXT, -- JSON array
            programIds TEXT, -- JSON array
            assignedLecturerId TEXT,
            schedule TEXT -- JSON array
        );

        CREATE TABLE IF NOT EXISTS programs (
            id TEXT PRIMARY KEY,
            name TEXT,
            code TEXT,
            description TEXT,
            durationYears INTEGER
        );

        CREATE TABLE IF NOT EXISTS leave_requests (
            id TEXT PRIMARY KEY,
            employeeId TEXT,
            employeeName TEXT,
            type TEXT,
            startDate TEXT,
            endDate TEXT,
            reason TEXT,
            status TEXT,
            requestDate TEXT,
            rejectionReason TEXT
        );

        CREATE TABLE IF NOT EXISTS memos (
            id TEXT PRIMARY KEY,
            senderId TEXT,
            senderName TEXT,
            senderDept TEXT,
            receiverId TEXT,
            receiverName TEXT,
            approverId TEXT,
            subject TEXT,
            body TEXT,
            date TEXT,
            status TEXT,
            isRead INTEGER,
            rejectionReason TEXT
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            requesterId TEXT,
            requesterName TEXT,
            assignedTo TEXT,
            status TEXT,
            priority TEXT,
            createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            text TEXT,
            completed INTEGER,
            priority TEXT,
            createdAt TEXT,
            category TEXT,
            dueDate TEXT
        );

        CREATE TABLE IF NOT EXISTS appraisal_templates (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            questions TEXT, -- JSON array
            assignedDepartments TEXT, -- JSON array
            assignedEmployeeIds TEXT, -- JSON array
            createdBy TEXT,
            createdAt TEXT,
            status TEXT,
            targetGroup TEXT
        );

        CREATE TABLE IF NOT EXISTS appraisal_submissions (
            id TEXT PRIMARY KEY,
            templateId TEXT,
            employeeId TEXT,
            employeeName TEXT,
            answers TEXT, -- JSON object
            submittedAt TEXT,
            status TEXT
        );
    `);

    console.log('Database initialized successfully.');
    
    // Migrate plain-text passwords if any
    migratePasswords(db);

    // Seed Data if empty
    seedDatabase(db);
}

function migratePasswords(db: Database.Database) {
    const users = db.prepare('SELECT id, password FROM users').all() as any[];
    const updatePassword = db.prepare('UPDATE users SET password = ? WHERE id = ?');

    users.forEach(user => {
        // Bcrypt hashes start with $2a$, $2b$, or $2y$
        const isHashed = user.password && (
            user.password.startsWith('$2a$') || 
            user.password.startsWith('$2b$') || 
            user.password.startsWith('$2y$')
        );

        if (!isHashed && user.password) {
            console.log(`Migrating plain-text password for user ${user.id}...`);
            const hashedPassword = bcrypt.hashSync(user.password, 10);
            updatePassword.run(hashedPassword, user.id);
        }
    });
}

import { MOCK_USERS, MOCK_ROLES, MOCK_DEPARTMENTS, MOCK_EMPLOYEES, MOCK_STUDENTS, MOCK_AVAILABLE_COURSES, MOCK_PROGRAMS, MOCK_LEAVE_REQUESTS, MOCK_MEMOS, MOCK_TICKETS, MOCK_TASKS, MOCK_APPRAISAL_TEMPLATES } from '../constants';

function seedDatabase(db: Database.Database) {
    const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
        console.log('Seeding database with mock data...');
        
        const insertUser = db.prepare('INSERT INTO users (id, username, password, employeeId, roleIds, isActive) VALUES (?, ?, ?, ?, ?, ?)');
        MOCK_USERS.forEach(u => {
            const hashedPassword = bcrypt.hashSync(u.password, 10);
            insertUser.run(u.id, u.username, hashedPassword, u.employeeId, JSON.stringify(u.roleIds), u.isActive ? 1 : 0);
        });

        const insertRole = db.prepare('INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)');
        MOCK_ROLES.forEach(r => insertRole.run(r.id, r.name, r.description, JSON.stringify(r.permissions)));

        const insertDept = db.prepare('INSERT INTO departments (id, name, headOfDept, description) VALUES (?, ?, ?, ?)');
        MOCK_DEPARTMENTS.forEach(d => insertDept.run(d.id, d.name, d.headOfDept, d.description));

        const insertEmp = db.prepare('INSERT INTO employees (id, firstName, lastName, department, role, email, phone, joinDate, photo, education, emergencyContact, nextOfKin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        MOCK_EMPLOYEES.forEach(e => insertEmp.run(e.id, e.firstName, e.lastName, e.department, e.role, e.email, e.phone, e.joinDate, e.photo || null, JSON.stringify(e.education || []), JSON.stringify(e.emergencyContact || {}), JSON.stringify(e.nextOfKin || {})));

        const insertStudent = db.prepare('INSERT INTO students (id, firstName, lastName, email, program, year, enrollmentDate, status, gpa, photo, attendance, registeredCourses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const insertAcademicRecord = db.prepare('INSERT INTO academic_records (studentId, academicYear, semesterNumber, semester, gpa, cgpa, creditsEarned) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const insertGrade = db.prepare('INSERT INTO grades (academicRecordId, courseCode, courseTitle, credits, score, grade, gradePoint) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const insertFee = db.prepare('INSERT INTO fee_records (id, studentId, date, description, amount, type, balance, paymentMethod, referenceNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

        MOCK_STUDENTS.forEach(s => {
            insertStudent.run(s.id, s.firstName, s.lastName, s.email, s.program, s.year, s.enrollmentDate, s.status, s.gpa, s.photo || null, s.attendance, JSON.stringify(s.registeredCourses || []));
            
            s.academicHistory?.forEach(h => {
                const info = insertAcademicRecord.run(s.id, h.academicYear, h.semesterNumber, h.semester, h.gpa, h.cgpa || null, h.creditsEarned);
                const recordId = info.lastInsertRowid;
                h.grades.forEach(g => {
                    insertGrade.run(recordId, g.courseCode, g.courseTitle, g.credits, g.score, g.grade, g.gradePoint);
                });
            });

            s.financialHistory?.forEach(f => {
                insertFee.run(f.id, s.id, f.date, f.description, f.amount, f.type, f.balance, f.paymentMethod || null, f.referenceNumber || null);
            });
        });

        const insertCourse = db.prepare('INSERT INTO courses (code, title, credits, level, semester, department, prerequisites, programIds, assignedLecturerId, schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        MOCK_AVAILABLE_COURSES.forEach(c => insertCourse.run(c.code, c.title, c.credits, c.level, c.semester, c.department, JSON.stringify(c.prerequisites || []), JSON.stringify(c.programIds || []), c.assignedLecturerId || null, JSON.stringify(c.schedule || [])));

        const insertProgram = db.prepare('INSERT INTO programs (id, name, code, department, description, durationYears) VALUES (?, ?, ?, ?, ?, ?)');
        MOCK_PROGRAMS.forEach(p => insertProgram.run(p.id, p.name, p.code, p.department, p.description || null, p.durationYears));

        const insertLeave = db.prepare('INSERT INTO leave_requests (id, employeeId, employeeName, type, startDate, endDate, reason, status, requestDate, rejectionReason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        MOCK_LEAVE_REQUESTS.forEach(l => insertLeave.run(l.id, l.employeeId, l.employeeName, l.type, l.startDate, l.endDate, l.reason, l.status, l.requestDate, l.rejectionReason || null));

        const insertMemo = db.prepare('INSERT INTO memos (id, senderId, senderName, senderDept, receiverId, receiverName, approverId, subject, body, date, status, isRead, rejectionReason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        MOCK_MEMOS.forEach(m => insertMemo.run(m.id, m.senderId, m.senderName, m.senderDept, m.receiverId, m.receiverName, m.approverId, m.subject, m.body, m.date, m.status, m.isRead ? 1 : 0, m.rejectionReason || null));

        const insertTicket = db.prepare('INSERT INTO tickets (id, title, description, requesterId, requesterName, assignedTo, status, priority, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        MOCK_TICKETS.forEach(t => insertTicket.run(t.id, t.title, t.description, t.requesterId, t.requesterName, t.assignedTo || null, t.status, t.priority, t.createdAt));

        const insertTask = db.prepare('INSERT INTO tasks (id, text, completed, priority, createdAt, category, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)');
        MOCK_TASKS.forEach(t => insertTask.run(t.id, t.text, t.completed ? 1 : 0, t.priority, t.createdAt, t.category || null, t.dueDate || null));

        const insertTemplate = db.prepare('INSERT INTO appraisal_templates (id, title, description, questions, assignedDepartments, assignedEmployeeIds, createdBy, createdAt, status, targetGroup) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        MOCK_APPRAISAL_TEMPLATES.forEach(t => insertTemplate.run(t.id, t.title, t.description, JSON.stringify(t.questions), JSON.stringify(t.assignedDepartments), JSON.stringify(t.assignedEmployeeIds), t.createdBy, t.createdAt, t.status, t.targetGroup));

        console.log('Database seeded successfully.');
    }
}
