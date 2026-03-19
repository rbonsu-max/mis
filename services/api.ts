import { Student, Employee, LeaveRequest, Memo, Ticket, Task, AvailableCourse, Program } from '../types';

const API_BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
}

export const api = {
    students: {
        getAll: () => fetchJson<Student[]>('/students'),
        getById: (id: string) => fetchJson<Student>(`/students/${id}`),
        updateGrades: (id: string, data: { academicYear: string, semesterNumber: number, semester?: string, grades: any[] }) => fetchJson(`/students/${id}/grades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
    },
    employees: {
        getAll: () => fetchJson<Employee[]>('/employees'),
    },
    courses: {
        getAll: () => fetchJson<AvailableCourse[]>('/courses'),
        create: (data: Partial<AvailableCourse>) => fetchJson<AvailableCourse>('/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Partial<AvailableCourse>) => fetchJson<AvailableCourse>(`/courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        delete: (id: string) => fetchJson(`/courses/${id}`, {
            method: 'DELETE'
        }),
    },
    leaves: {
        getAll: () => fetchJson<LeaveRequest[]>('/leaves'),
        create: (data: Partial<LeaveRequest>) => fetchJson('/leaves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
    },
    memos: {
        getAll: () => fetchJson<Memo[]>('/memos'),
        create: (data: Partial<Memo>) => fetchJson<Memo>('/memos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Partial<Memo>) => fetchJson<Memo>(`/memos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
    },
    tickets: {
        getAll: () => fetchJson<Ticket[]>('/tickets'),
        create: (data: Partial<Ticket>) => fetchJson<Ticket>('/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Partial<Ticket>) => fetchJson<Ticket>(`/tickets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
    },
    tasks: {
        getAll: () => fetchJson<Task[]>('/tasks'),
        create: (data: Partial<Task>) => fetchJson<Task>('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Partial<Task>) => fetchJson<Task>(`/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        delete: (id: string) => fetchJson(`/tasks/${id}`, {
            method: 'DELETE'
        }),
    },
    programs: {
        getAll: () => fetchJson<Program[]>('/programs'),
        create: (data: Partial<Program>) => fetchJson<Program>('/programs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Partial<Program>) => fetchJson<Program>(`/programs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        delete: (id: string) => fetchJson(`/programs/${id}`, {
            method: 'DELETE'
        }),
    },
    appraisals: {
        getTemplates: () => fetchJson<any[]>('/appraisal-templates'),
        createTemplate: (data: any) => fetchJson<any>('/appraisal-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        updateTemplate: (id: string, data: any) => fetchJson<any>(`/appraisal-templates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        getSubmissions: () => fetchJson<any[]>('/appraisal-submissions'),
        createSubmission: (data: any) => fetchJson<any>('/appraisal-submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
    },
    // Add other endpoints as needed
};
