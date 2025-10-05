import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Label, Subtask, Comment, Priority, RecurrenceConfig, FilterOptions } from '../types';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notifications';

// Custom ID generation function
const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

interface TaskContextType {
  tasks: Task[];
  labels: Label[];
  filterOptions: FilterOptions;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  addSubtask: (taskId: string, text: string) => Promise<void>;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  addLabel: (name: string, color: string) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  getFilteredTasks: () => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [filterOptions, setFilterState] = useState<FilterOptions>({
    showCompleted: true,
  });

  useEffect(() => {
    loadData();
    NotificationService.requestPermissions();
  }, []);

  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    StorageService.saveLabels(labels);
  }, [labels]);

  const loadData = async () => {
    const [loadedTasks, loadedLabels] = await Promise.all([
      StorageService.getTasks(),
      StorageService.getLabels(),
    ]);
    setTasks(loadedTasks);
    setLabels(loadedLabels);
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (newTask.reminderEnabled && newTask.reminderDate) {
      await NotificationService.scheduleNotification(
        newTask.id,
        'Task Reminder',
        newTask.title,
        newTask.reminderDate
      );
    }

    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const updated = { ...task, ...updates, updatedAt: new Date() };
        
        if (updates.reminderEnabled !== undefined || updates.reminderDate !== undefined) {
          if (updated.reminderEnabled && updated.reminderDate) {
            NotificationService.scheduleNotification(
              updated.id,
              'Task Reminder',
              updated.title,
              updated.reminderDate
            );
          }
        }
        
        return updated;
      }
      return task;
    }));
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const toggleTaskComplete = async (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        
        if (completed && task.recurrence && task.recurrence.type !== 'none') {
          const nextDueDate = calculateNextDueDate(task.dueDate || new Date(), task.recurrence);
          return {
            ...task,
            completed: false,
            dueDate: nextDueDate,
            updatedAt: new Date(),
          };
        }
        
        return { ...task, completed, updatedAt: new Date() };
      }
      return task;
    }));
  };

  const calculateNextDueDate = (currentDate: Date, recurrence: RecurrenceConfig): Date => {
    const next = new Date(currentDate);
    
    switch (recurrence.type) {
      case 'daily':
        next.setDate(next.getDate() + recurrence.interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 * recurrence.interval));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + recurrence.interval);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + recurrence.interval);
        break;
    }
    
    return next;
  };

  const addSubtask = async (taskId: string, text: string) => {
    const subtask: Subtask = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date(),
    };

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, subtasks: [...task.subtasks, subtask], updatedAt: new Date() }
        : task
    ));
  };

  const toggleSubtaskComplete = async (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
          updatedAt: new Date(),
        };
      }
      return task;
    }));
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            subtasks: task.subtasks.filter(st => st.id !== subtaskId),
            updatedAt: new Date() 
          }
        : task
    ));
  };

  const addComment = async (taskId: string, text: string) => {
    const comment: Comment = {
      id: generateId(),
      text,
      createdAt: new Date(),
    };

    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, comments: [...task.comments, comment], updatedAt: new Date() }
        : task
    ));
  };

  const addLabel = async (name: string, color: string) => {
    const label: Label = {
      id: generateId(),
      name,
      color,
    };
    setLabels(prev => [...prev, label]);
  };

  const deleteLabel = async (id: string) => {
    setLabels(prev => prev.filter(label => label.id !== id));
    setTasks(prev => prev.map(task => ({
      ...task,
      labels: task.labels.filter(label => label.id !== id),
    })));
  };

  const setFilterOptions = (options: Partial<FilterOptions>) => {
    setFilterState(prev => ({ ...prev, ...options }));
  };

  const getFilteredTasks = (): Task[] => {
    return tasks.filter(task => {
      if (!filterOptions.showCompleted && task.completed) return false;
      
      if (filterOptions.priority && task.priority !== filterOptions.priority) return false;
      
      if (filterOptions.labelIds && filterOptions.labelIds.length > 0) {
        const hasMatchingLabel = task.labels.some(label => 
          filterOptions.labelIds!.includes(label.id)
        );
        if (!hasMatchingLabel) return false;
      }
      
      if (filterOptions.search) {
        const searchLower = filterOptions.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        labels,
        filterOptions,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addSubtask,
        toggleSubtaskComplete,
        deleteSubtask,
        addComment,
        addLabel,
        deleteLabel,
        setFilterOptions,
        getFilteredTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
