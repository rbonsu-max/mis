import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { api } from '../services/api';
import { Plus, Check, Trash2, Calendar, AlertCircle, CheckSquare, Tag, Loader2, Edit2, Save, X, ArrowUpDown, Clock, Flag, Filter } from 'lucide-react';

interface TodoListProps {
    onNotify?: (message: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ onNotify }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'dueDate' | 'priority'>('newest');
  
  // Category Management State
  const [categories, setCategories] = useState<string[]>(['Work', 'Personal', 'Finance', 'Admin', 'Academics']);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Add New Task State
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('Work');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Edit Task State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editCategory, setEditCategory] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    const loadTasks = async () => {
        try {
            setIsLoading(true);
            const data = await api.tasks.getAll();
            setTasks(data);
        } catch (error) {
            console.error("Failed to load tasks", error);
            if (onNotify) onNotify("Failed to load tasks");
        } finally {
            setIsLoading(false);
        }
    };
    loadTasks();
  }, [onNotify]);

  const handleAddCategory = (e: React.FormEvent | React.KeyboardEvent) => {
      e.preventDefault();
      if (newCategoryInput.trim() && !categories.includes(newCategoryInput.trim())) {
          const newCat = newCategoryInput.trim();
          setCategories([...categories, newCat]);
          setNewTaskCategory(newCat);
          setIsAddingCategory(false);
          setNewCategoryInput('');
      }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const taskData: Partial<Task> = {
      text: newTaskText,
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory || categories[0] || 'Work',
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: newTaskDueDate || undefined
    };

    try {
        const createdTask = await api.tasks.create(taskData);
        setTasks([createdTask, ...tasks]);
        setNewTaskText('');
        setNewTaskDueDate('');
        setNewTaskPriority('medium');
        if (onNotify) onNotify("Task added successfully.");
    } catch (error) {
        console.error("Failed to create task", error);
        if (onNotify) onNotify("Failed to create task");
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
        const updatedTask = await api.tasks.update(id, { completed: !task.completed });
        setTasks(tasks.map(t => t.id === id ? updatedTask : t));
    } catch (error) {
        console.error("Failed to update task", error);
        if (onNotify) onNotify("Failed to update task");
    }
  };

  const deleteTask = async (id: string) => {
    try {
        await api.tasks.delete(id);
        setTasks(tasks.filter(t => t.id !== id));
        if (onNotify) onNotify("Task deleted.");
    } catch (error) {
        console.error("Failed to delete task", error);
        if (onNotify) onNotify("Failed to delete task");
    }
  };

  const startEditing = (task: Task) => {
      setEditingTaskId(task.id);
      setEditText(task.text);
      setEditPriority(task.priority);
      setEditCategory(task.category || categories[0]);
      setEditDueDate(task.dueDate || '');
  };

  const cancelEditing = () => {
      setEditingTaskId(null);
      setEditText('');
      setEditDueDate('');
  };

  const saveTask = async () => {
      if (!editingTaskId || !editText.trim()) return;
      
      try {
          const updatedTask = await api.tasks.update(editingTaskId, {
              text: editText,
              priority: editPriority,
              category: editCategory,
              dueDate: editDueDate
          });
          
          setTasks(tasks.map(t => t.id === editingTaskId ? updatedTask : t));
          cancelEditing();
          if (onNotify) onNotify("Task updated.");
      } catch (error) {
          console.error("Failed to update task", error);
          if (onNotify) onNotify("Failed to update task");
      }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
          // Put tasks with due dates first
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      // Default: Newest first (created at)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityIconColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-500 fill-red-500';
      case 'medium': return 'text-amber-500 fill-amber-500';
      case 'low': return 'text-green-500 fill-green-500';
      default: return 'text-slate-400';
    }
  };

  const getPriorityBorderClass = (priority: string) => {
    switch(priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-amber-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Tasks</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your daily tasks and priorities.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Category Filter */}
            <div className="relative">
                <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
                >
                    <option value="All">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Filter size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                <button 
                    onClick={() => setSortBy('newest')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${sortBy === 'newest' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Newest
                </button>
                <button 
                    onClick={() => setSortBy('dueDate')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${sortBy === 'dueDate' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Due Date
                </button>
                <button 
                    onClick={() => setSortBy('priority')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${sortBy === 'priority' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Priority
                </button>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
                {['all', 'active', 'completed'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${filter === f ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Task Form */}
          <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Plus size={20} className="text-blue-600" /> Add New Task
                  </h3>
                  <form onSubmit={handleAddTask} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Task Description</label>
                          <textarea 
                              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                              rows={3}
                              placeholder="What needs to be done?"
                              value={newTaskText}
                              onChange={(e) => setNewTaskText(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Due Date</label>
                          <input 
                              type="date"
                              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={newTaskDueDate}
                              onChange={(e) => setNewTaskDueDate(e.target.value)}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Priority</label>
                              <select 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                              >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                              {isAddingCategory ? (
                                  <div className="flex gap-1">
                                      <input 
                                        className="w-full border border-blue-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newCategoryInput}
                                        onChange={(e) => setNewCategoryInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCategory(e);
                                            }
                                        }}
                                        placeholder="Name..."
                                        autoFocus
                                      />
                                      <button 
                                        type="button" 
                                        onClick={handleAddCategory} 
                                        className="bg-green-100 text-green-700 rounded p-1 hover:bg-green-200"
                                        title="Save Category"
                                      >
                                          <Check size={16} />
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => setIsAddingCategory(false)} 
                                        className="bg-red-100 text-red-700 rounded p-1 hover:bg-red-200"
                                        title="Cancel"
                                      >
                                          <X size={16} />
                                      </button>
                                  </div>
                              ) : (
                                <div className="flex gap-2">
                                    <select 
                                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                        value={newTaskCategory}
                                        onChange={(e) => setNewTaskCategory(e.target.value)}
                                    >
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAddingCategory(true)}
                                        className="bg-slate-100 border border-slate-300 text-slate-600 rounded-lg px-2 hover:bg-slate-200 hover:text-blue-600 transition-colors"
                                        title="Add New Category"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                              )}
                          </div>
                      </div>
                      <button 
                        type="submit"
                        disabled={!newTaskText.trim()}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Add Task
                      </button>
                  </form>
              </div>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2 space-y-4">
              {isLoading ? (
                   <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-slate-100">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                   </div>
              ) : (
                  <>
                    {sortedTasks.length > 0 ? (
                        sortedTasks.map(task => {
                            if (task.id === editingTaskId) {
                                return (
                                    <div key={task.id} className="bg-white p-4 rounded-xl border border-blue-300 shadow-sm ring-1 ring-blue-100 animate-in fade-in zoom-in duration-200">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-blue-600 uppercase">Editing Task</label>
                                                <span className="text-xs text-slate-400 font-mono">ID: {task.id}</span>
                                            </div>
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                rows={2}
                                            />
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <span className="text-xs font-medium text-slate-600 block mb-1">Due Date:</span>
                                                    <input 
                                                        type="date"
                                                        value={editDueDate}
                                                        onChange={(e) => setEditDueDate(e.target.value)}
                                                        className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-medium text-slate-600 block mb-1">Priority:</span>
                                                    <select
                                                        value={editPriority}
                                                        onChange={(e) => setEditPriority(e.target.value as any)}
                                                        className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="low">Low</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="high">High</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-medium text-slate-600 block mb-1">Category:</span>
                                                    <select
                                                        value={editCategory}
                                                        onChange={(e) => setEditCategory(e.target.value)}
                                                        className="w-full border border-slate-300 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-1">
                                                <button onClick={cancelEditing} className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium">
                                                    Cancel
                                                </button>
                                                <button onClick={saveTask} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                                                    <Save size={14} /> Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div 
                                    key={task.id} 
                                    className={`bg-white p-4 rounded-xl border border-l-4 transition-all hover:shadow-sm group ${getPriorityBorderClass(task.priority)} ${task.completed ? 'border-slate-100 opacity-75' : 'border-slate-200 hover:border-blue-300'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <button 
                                            onClick={() => toggleTask(task.id)}
                                            className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}
                                        >
                                            {task.completed && <Check size={12} />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`font-medium text-slate-800 break-words ${task.completed ? 'line-through text-slate-500' : ''}`}>
                                                    {task.text}
                                                </p>
                                                <Flag size={14} className={`mt-1 shrink-0 ${getPriorityIconColor(task.priority)}`} fill="currentColor" />
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                {task.dueDate && (
                                                    <span className={`text-[10px] flex items-center gap-1 font-medium ${new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-500' : 'text-slate-500'}`}>
                                                        <Clock size={12} /> 
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                                    <AlertCircle size={10} /> {task.priority}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1">
                                                    <Tag size={10} /> {task.category}
                                                </span>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Calendar size={10} /> {task.createdAt}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => startEditing(task)}
                                                className="text-slate-300 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => deleteTask(task.id)}
                                                className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                            <CheckSquare size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-slate-800 font-bold">No tasks found</h3>
                            <p className="text-slate-500 text-sm mt-1">You're all caught up or no tasks match your filter.</p>
                        </div>
                    )}
                  </>
              )}
          </div>
      </div>
    </div>
  );
};

export default TodoList;