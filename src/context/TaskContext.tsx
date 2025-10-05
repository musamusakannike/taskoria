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
  priorities: Priority[];
  filterOptions: FilterOptions;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'priority'> & { priority?: Priority }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  addSubtask: (taskId: string, text: string) => Promise<void>;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
  addLabel: (name: string, color: string) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
  addPriority: (name: string, color: string) => Promise<void>;
  deletePriority: (id: string) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  getFilteredTasks: () => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
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

  useEffect(() => {
    StorageService.savePriorities(priorities);
  }, [priorities]);

  const loadData = async () => {
    const [loadedTasks, loadedLabels, loadedPriorities] = await Promise.all([
      StorageService.getTasks(),
      StorageService.getLabels(),
      StorageService.getPriorities(),
    ]);
    setTasks(loadedTasks);
    setLabels(loadedLabels);
    if (loadedPriorities.length > 0) {
      setPriorities(loadedPriorities);
    } else {
      // Create default priorities if none exist
      const defaultPriorities: Priority[] = [
        { id: generateId(), name: 'Low', color: '#34d399' },
        { id: generateId(), name: 'Medium', color: '#f59e0b' },
        { id: generateId(), name: 'High', color: '#ef4444' },
      ];
      setPriorities(defaultPriorities);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    let notificationId: string | undefined;
    if (taskData.reminderEnabled && taskData.reminderDate) {
      const scheduledId = await NotificationService.scheduleNotification(
        generateId(),
        'Task Reminder',
        taskData.title,
        taskData.reminderDate
      );
      notificationId = scheduledId ?? undefined;
    }

    const mediumPriority = priorities.find(p => p.name === 'Medium');
    const defaultPriority = mediumPriority || priorities[0];

    const newTask: Task = {
      ...taskData,
      id: generateId(),
      priority: taskData.priority || defaultPriority,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationId,
    };

    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return;

    if (taskToUpdate.notificationId) {
      await NotificationService.cancelNotification(taskToUpdate.notificationId);
    }

    const updatedTask = { ...taskToUpdate, ...updates, updatedAt: new Date(), notificationId: undefined };

    if (updatedTask.reminderEnabled && updatedTask.reminderDate && !updatedTask.completed) {
      const newNotificationId = await NotificationService.scheduleNotification(
        id,
        'Task Reminder',
        updatedTask.title,
        updatedTask.reminderDate
      );
      updatedTask.notificationId = newNotificationId ?? undefined;
    }

    setTasks(prev => prev.map(task =>
      task.id === id ? updatedTask : task
    ));
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && taskToDelete.notificationId) {
      await NotificationService.cancelNotification(taskToDelete.notificationId);
    }
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const completed = !task.completed;

    if (completed && task.recurrence && task.recurrence.type !== 'none') {
      const nextDueDate = calculateNextDueDate(task.dueDate || new Date(), task.recurrence);
      let nextReminderDate = undefined;

      if (task.reminderEnabled && task.dueDate && task.reminderDate) {
        const timeDiff = task.dueDate.getTime() - task.reminderDate.getTime();
        nextReminderDate = new Date(nextDueDate.getTime() - timeDiff);
      }

      updateTask(id, {
        completed: false,
        dueDate: nextDueDate,
        reminderDate: nextReminderDate,
      });
    } else {
      updateTask(id, { completed });
    }
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

  const addPriority = async (name: string, color: string) => {
    const priority: Priority = {
      id: generateId(),
      name,
      color,
    };
    setPriorities(prev => [...prev, priority]);
  };

  const deletePriority = async (id: string) => {
    setPriorities(prev => prev.filter(p => p.id !== id));
    // Potentially unassign priority from tasks
    setTasks(prev => prev.map(task => task.priority?.id === id ? { ...task, priority: undefined } : task));
  };

  const setFilterOptions = (options: Partial<FilterOptions>) => {
    setFilterState(prev => ({ ...prev, ...options }));
  };

  const getFilteredTasks = (): Task[] => {
    return tasks.filter(task => {
      if (!filterOptions.showCompleted && task.completed) return false;
      
      if (filterOptions.priorityId && task.priority?.id !== filterOptions.priorityId) return false;
      
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
        priorities,
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
        addPriority,
        deletePriority,
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
