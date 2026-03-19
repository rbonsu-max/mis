import express from 'express';
import { getDatabase } from './db';
import bcrypt from 'bcryptjs';

const router = express.Router();

// --- Students ---
router.get('/students', (req, res) => {
    const db = getDatabase();
    const students = db.prepare('SELECT * FROM students').all();
    
    // Hydrate complex objects
    const hydratedStudents = students.map((s: any) => {
        const student = { ...s };
        student.registeredCourses = JSON.parse(s.registeredCourses || '[]');
        
        // Fetch academic history
        const history = db.prepare('SELECT * FROM academic_records WHERE studentId = ?').all(s.id);
        student.academicHistory = history.map((h: any) => {
            const grades = db.prepare('SELECT * FROM grades WHERE academicRecordId = ?').all(h.id);
            return { ...h, grades };
        });

        // Fetch financial history
        student.financialHistory = db.prepare('SELECT * FROM fee_records WHERE studentId = ?').all(s.id);
        
        return student;
    });

    res.json(hydratedStudents);
});

router.get('/students/:id', (req, res) => {
    const db = getDatabase();
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id) as any;
    
    if (student) {
        student.registeredCourses = JSON.parse(student.registeredCourses || '[]');
        
        const history = db.prepare('SELECT * FROM academic_records WHERE studentId = ?').all(student.id);
        student.academicHistory = history.map((h: any) => {
            const grades = db.prepare('SELECT * FROM grades WHERE academicRecordId = ?').all(h.id);
            return { ...h, grades };
        });

        student.financialHistory = db.prepare('SELECT * FROM fee_records WHERE studentId = ?').all(student.id);
        res.json(student);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

router.post('/students/:id/grades', (req, res) => {
    const db = getDatabase();
    const { id } = req.params;
    const { academicYear, semesterNumber, grades } = req.body; // grades is array of Grade objects

    try {
        const updateGrades = db.transaction(() => {
            // 1. Calculate Semester GPA and Credits
            const semesterCredits = grades.reduce((acc: number, g: any) => acc + g.credits, 0);
            const semesterPoints = grades.reduce((acc: number, g: any) => acc + (g.gradePoint * g.credits), 0);
            const semesterGpa = semesterCredits > 0 ? semesterPoints / semesterCredits : 0;

            // 2. Check if record exists for this semester
            let record = db.prepare('SELECT * FROM academic_records WHERE studentId = ? AND academicYear = ? AND semesterNumber = ?').get(id, academicYear, semesterNumber) as any;
            let recordId;

            if (record) {
                // Update existing record
                recordId = record.id;
                db.prepare('UPDATE academic_records SET gpa = ?, creditsEarned = ? WHERE id = ?').run(semesterGpa, semesterCredits, recordId);
                // Delete existing grades to replace them (simplest approach)
                db.prepare('DELETE FROM grades WHERE academicRecordId = ?').run(recordId);
            } else {
                // Create new record
                const semesterName = req.body.semester || `Sem ${semesterNumber}`;
                
                const info = db.prepare('INSERT INTO academic_records (studentId, academicYear, semesterNumber, semester, gpa, creditsEarned) VALUES (?, ?, ?, ?, ?, ?)').run(id, academicYear, semesterNumber, semesterName, semesterGpa, semesterCredits);
                recordId = info.lastInsertRowid;
            }

            // 3. Insert Grades
            const insertGrade = db.prepare('INSERT INTO grades (academicRecordId, courseCode, courseTitle, credits, score, grade, gradePoint) VALUES (?, ?, ?, ?, ?, ?, ?)');
            grades.forEach((g: any) => {
                insertGrade.run(recordId, g.courseCode, g.courseTitle, g.credits, g.score, g.grade, g.gradePoint);
            });

            // 4. Recalculate CGPA for ALL semesters
            const allRecords = db.prepare('SELECT * FROM academic_records WHERE studentId = ? ORDER BY academicYear, semesterNumber').all(id) as any[];
            
            let cumulativePoints = 0;
            let cumulativeCredits = 0;

            allRecords.forEach(rec => {
                // We assume the record we just updated has the correct gpa/credits.
                // For other records, we use stored values.
                // Note: rec is from DB, so it has the updated values for the current semester because we updated it before fetching allRecords.
                // Wait, inside transaction, reads see writes? Yes, in SQLite default isolation.
                
                cumulativePoints += (rec.gpa * rec.creditsEarned);
                cumulativeCredits += rec.creditsEarned;
                
                const cgpa = cumulativeCredits > 0 ? cumulativePoints / cumulativeCredits : 0;
                
                // Update CGPA on the record
                db.prepare('UPDATE academic_records SET cgpa = ? WHERE id = ?').run(cgpa, rec.id);
            });

            // 5. Update Student's current GPA (CGPA)
            const finalCGPA = cumulativeCredits > 0 ? cumulativePoints / cumulativeCredits : 0;
            db.prepare('UPDATE students SET gpa = ? WHERE id = ?').run(finalCGPA, id);
        });
        
        updateGrades();

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error updating grades:', error);
        res.status(500).json({ error: 'Failed to update grades' });
    }
});

// --- Employees ---
router.get('/employees', (req, res) => {
    const db = getDatabase();
    const employees = db.prepare('SELECT * FROM employees').all();
    const hydratedEmployees = employees.map((e: any) => ({
        ...e,
        education: JSON.parse(e.education || '[]'),
        emergencyContact: JSON.parse(e.emergencyContact || '{}'),
        nextOfKin: JSON.parse(e.nextOfKin || '{}')
    }));
    res.json(hydratedEmployees);
});

// --- Courses ---
router.get('/courses', (req, res) => {
    const db = getDatabase();
    const courses = db.prepare('SELECT * FROM courses').all();
    const hydratedCourses = courses.map((c: any) => ({
        ...c,
        prerequisites: JSON.parse(c.prerequisites || '[]'),
        programIds: JSON.parse(c.programIds || '[]'),
        schedule: JSON.parse(c.schedule || '[]')
    }));
    res.json(hydratedCourses);
});

// --- Leave Requests ---
router.get('/leaves', (req, res) => {
    const db = getDatabase();
    const leaves = db.prepare('SELECT * FROM leave_requests').all();
    res.json(leaves);
});

router.post('/leaves', (req, res) => {
    const db = getDatabase();
    const { id, employeeId, employeeName, type, startDate, endDate, reason, status, requestDate } = req.body;
    try {
        const stmt = db.prepare(`
            INSERT INTO leave_requests (id, employeeId, employeeName, type, startDate, endDate, reason, status, requestDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, employeeId, employeeName, type, startDate, endDate, reason, status, requestDate);
        res.status(201).json({ message: 'Leave request created' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Memos ---
router.get('/memos', (req, res) => {
    const db = getDatabase();
    try {
        const memos = db.prepare('SELECT * FROM memos ORDER BY createdAt DESC').all();
        const hydratedMemos = memos.map((memo: any) => ({
            ...memo,
            readBy: JSON.parse(memo.readBy || '[]'),
            attachments: JSON.parse(memo.attachments || '[]')
        }));
        res.json(hydratedMemos);
    } catch (error) {
        console.error('Error fetching memos:', error);
        res.status(500).json({ error: 'Failed to fetch memos' });
    }
});

router.post('/memos', (req, res) => {
    const db = getDatabase();
    try {
        const { title, content, senderId, senderName, senderRole, recipientType, recipientGroup, status, priority, category } = req.body;
        const id = `MEMO-${Date.now()}`;
        const createdAt = new Date().toISOString();
        
        const stmt = db.prepare(`
            INSERT INTO memos (id, title, content, senderId, senderName, senderRole, recipientType, recipientGroup, status, priority, category, createdAt, readBy, attachments, isArchived)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(id, title, content, senderId, senderName, senderRole, recipientType, recipientGroup, status, priority, category, createdAt, '[]', '[]', 0);
        
        const newMemo = db.prepare('SELECT * FROM memos WHERE id = ?').get(id);
        res.status(201).json(newMemo);
    } catch (error) {
        console.error('Error creating memo:', error);
        res.status(500).json({ error: 'Failed to create memo' });
    }
});

router.put('/memos/:id', (req, res) => {
    const db = getDatabase();
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const fields = Object.keys(updates).filter(key => key !== 'id');
        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => {
            const val = updates[field];
            return (typeof val === 'object') ? JSON.stringify(val) : val;
        });
        
        const stmt = db.prepare(`UPDATE memos SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
        
        const updatedMemo = db.prepare('SELECT * FROM memos WHERE id = ?').get(id);
        res.json(updatedMemo);
    } catch (error) {
        console.error('Error updating memo:', error);
        res.status(500).json({ error: 'Failed to update memo' });
    }
});

// --- Tickets ---
router.get('/tickets', (req, res) => {
    const db = getDatabase();
    try {
        const tickets = db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();
        const hydratedTickets = tickets.map((ticket: any) => ({
            ...ticket,
            updates: JSON.parse(ticket.updates || '[]')
        }));
        res.json(hydratedTickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

router.post('/tickets', (req, res) => {
    const db = getDatabase();
    try {
        const { title, description, category, priority, status, createdBy, assigneeId } = req.body;
        const id = `TICKET-${Date.now()}`;
        const createdAt = new Date().toISOString();
        
        const stmt = db.prepare(`
            INSERT INTO tickets (id, title, description, category, priority, status, createdBy, assigneeId, createdAt, updates)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(id, title, description, category, priority, status, createdBy, assigneeId, createdAt, '[]');
        
        const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

router.put('/tickets/:id', (req, res) => {
    const db = getDatabase();
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const fields = Object.keys(updates).filter(key => key !== 'id');
        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => {
            const val = updates[field];
            return (typeof val === 'object') ? JSON.stringify(val) : val;
        });
        
        const stmt = db.prepare(`UPDATE tickets SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
        
        const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
        const hydratedTicket = {
            ...(updatedTicket as any),
            updates: JSON.parse((updatedTicket as any).updates || '[]')
        };
        res.json(hydratedTicket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

// --- Tasks ---
router.get('/tasks', (req, res) => {
    const db = getDatabase();
    try {
        const tasks = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();
        const hydratedTasks = tasks.map((task: any) => ({
            ...task,
            assignedTo: JSON.parse(task.assignedTo || '[]'),
            tags: JSON.parse(task.tags || '[]'),
            subtasks: JSON.parse(task.subtasks || '[]'),
            comments: JSON.parse(task.comments || '[]'),
            attachments: JSON.parse(task.attachments || '[]'),
            completed: Boolean(task.completed)
        }));
        res.json(hydratedTasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

router.post('/tasks', (req, res) => {
    const db = getDatabase();
    try {
        const { title, description, priority, dueDate, category, assignedTo, createdBy } = req.body;
        const id = `TASK-${Date.now()}`;
        const createdAt = new Date().toISOString();
        
        const stmt = db.prepare(`
            INSERT INTO tasks (id, title, description, priority, dueDate, category, assignedTo, createdBy, createdAt, completed, tags, subtasks, comments, attachments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(id, title, description, priority, dueDate, category, JSON.stringify(assignedTo || []), createdBy, createdAt, 0, '[]', '[]', '[]', '[]');
        
        const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

router.put('/tasks/:id', (req, res) => {
    const db = getDatabase();
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const fields = Object.keys(updates).filter(key => key !== 'id');
        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => {
            const val = updates[field];
            if (field === 'completed') return val ? 1 : 0;
            return (typeof val === 'object') ? JSON.stringify(val) : val;
        });
        
        const stmt = db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
        
        const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        const hydratedTask = {
            ...(updatedTask as any),
            assignedTo: JSON.parse((updatedTask as any).assignedTo || '[]'),
            tags: JSON.parse((updatedTask as any).tags || '[]'),
            subtasks: JSON.parse((updatedTask as any).subtasks || '[]'),
            comments: JSON.parse((updatedTask as any).comments || '[]'),
            attachments: JSON.parse((updatedTask as any).attachments || '[]'),
            completed: Boolean((updatedTask as any).completed)
        };
        res.json(hydratedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

router.delete('/tasks/:id', (req, res) => {
    const db = getDatabase();
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// --- Programs ---

router.get('/programs', (req, res) => {
    const db = getDatabase();
    try {
        const programs = db.prepare('SELECT * FROM programs').all();
        res.json(programs);
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ error: 'Failed to fetch programs' });
    }
});

router.post('/programs', (req, res) => {
    const db = getDatabase();
    try {
        const { name, code, durationYears, description } = req.body;
        const id = `PROG-${Date.now()}`;
        
        const stmt = db.prepare('INSERT INTO programs (id, name, code, durationYears, description) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, name, code, durationYears, description);
        
        const newProgram = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
        res.status(201).json(newProgram);
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ error: 'Failed to create program' });
    }
});

router.put('/programs/:id', (req, res) => {
    const db = getDatabase();
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const fields = Object.keys(updates).filter(key => key !== 'id');
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updates[field]);
        
        const stmt = db.prepare(`UPDATE programs SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
        
        const updatedProgram = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
        res.json(updatedProgram);
    } catch (error) {
        console.error('Error updating program:', error);
        res.status(500).json({ error: 'Failed to update program' });
    }
});

router.delete('/programs/:id', (req, res) => {
    const db = getDatabase();
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM programs WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({ error: 'Failed to delete program' });
    }
});

// --- Appraisal Templates ---

router.get('/appraisal-templates', (req, res) => {
    const db = getDatabase();
    try {
        const templates = db.prepare('SELECT * FROM appraisal_templates').all();
        const hydratedTemplates = templates.map((t: any) => ({
            ...t,
            questions: JSON.parse(t.questions || '[]'),
            assignedDepartments: JSON.parse(t.assignedDepartments || '[]'),
            assignedEmployeeIds: JSON.parse(t.assignedEmployeeIds || '[]')
        }));
        res.json(hydratedTemplates);
    } catch (error) {
        console.error('Error fetching appraisal templates:', error);
        res.status(500).json({ error: 'Failed to fetch appraisal templates' });
    }
});

router.post('/appraisal-templates', (req, res) => {
    const db = getDatabase();
    try {
        const { title, description, questions, assignedDepartments, assignedEmployeeIds, status, targetGroup, createdBy } = req.body;
        const id = `APP-TEMP-${Date.now()}`;
        const createdAt = new Date().toISOString();
        
        const stmt = db.prepare(`
            INSERT INTO appraisal_templates (id, title, description, questions, assignedDepartments, assignedEmployeeIds, status, targetGroup, createdAt, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(id, title, description, JSON.stringify(questions), JSON.stringify(assignedDepartments), JSON.stringify(assignedEmployeeIds), status, targetGroup, createdAt, createdBy);
        
        const newTemplate = db.prepare('SELECT * FROM appraisal_templates WHERE id = ?').get(id);
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error('Error creating appraisal template:', error);
        res.status(500).json({ error: 'Failed to create appraisal template' });
    }
});

router.put('/appraisal-templates/:id', (req, res) => {
    const db = getDatabase();
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const fields = Object.keys(updates).filter(key => key !== 'id');
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => {
            const val = updates[field];
            return (typeof val === 'object') ? JSON.stringify(val) : val;
        });
        
        const stmt = db.prepare(`UPDATE appraisal_templates SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);
        
        const updatedTemplate = db.prepare('SELECT * FROM appraisal_templates WHERE id = ?').get(id);
        res.json(updatedTemplate);
    } catch (error) {
        console.error('Error updating appraisal template:', error);
        res.status(500).json({ error: 'Failed to update appraisal template' });
    }
});

// --- Appraisal Submissions ---

router.get('/appraisal-submissions', (req, res) => {
    const db = getDatabase();
    try {
        const submissions = db.prepare('SELECT * FROM appraisal_submissions').all();
        const hydratedSubmissions = submissions.map((s: any) => ({
            ...s,
            answers: JSON.parse(s.answers || '{}')
        }));
        res.json(hydratedSubmissions);
    } catch (error) {
        console.error('Error fetching appraisal submissions:', error);
        res.status(500).json({ error: 'Failed to fetch appraisal submissions' });
    }
});

router.post('/appraisal-submissions', (req, res) => {
    const db = getDatabase();
    try {
        const { templateId, employeeId, employeeName, answers, status } = req.body;
        const id = `SUB-${Date.now()}`;
        const submittedAt = new Date().toISOString().split('T')[0];
        
        const stmt = db.prepare(`
            INSERT INTO appraisal_submissions (id, templateId, employeeId, employeeName, answers, submittedAt, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(id, templateId, employeeId, employeeName, JSON.stringify(answers), submittedAt, status);
        
        const newSubmission = db.prepare('SELECT * FROM appraisal_submissions WHERE id = ?').get(id);
        res.status(201).json(newSubmission);
    } catch (error) {
        console.error('Error creating appraisal submission:', error);
        res.status(500).json({ error: 'Failed to create appraisal submission' });
    }
});

// --- Users ---
router.post('/login', (req, res) => {
    const db = getDatabase();
    const { username, password } = req.body;
    console.log(`Login attempt for username/email: ${username}`);
    
    // Check if it's a username or an email
    let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    
    if (!user) {
        // Try looking up by employee email
        const employee = db.prepare('SELECT id FROM employees WHERE email = ?').get(username) as any;
        if (employee) {
            user = db.prepare('SELECT * FROM users WHERE employeeId = ?').get(employee.id) as any;
        }
    }
    
    if (user) {
        const passwordMatch = bcrypt.compareSync(password, user.password);
        console.log(`User found. Password match: ${passwordMatch}`);
        if (passwordMatch) {
            user.roleIds = JSON.parse(user.roleIds || '[]');
            res.json(user);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } else {
        console.log(`User not found: ${username}`);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

router.post('/register', (req, res) => {
    const db = getDatabase();
    const { id, username, password, employeeId, roleIds, isActive } = req.body;
    
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const stmt = db.prepare(`
            INSERT INTO users (id, username, password, employeeId, roleIds, isActive, lastLogin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const lastLogin = new Date().toISOString();
        stmt.run(id, username, hashedPassword, employeeId, JSON.stringify(roleIds || ['ROLE-ADMIN']), isActive ? 1 : 0, lastLogin);
        
        const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
        newUser.roleIds = JSON.parse(newUser.roleIds || '[]');
        res.status(201).json(newUser);
    } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
