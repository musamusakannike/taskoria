import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, Label, Priority } from '../types';

const TASKS_KEY = '@tasks';
const LABELS_KEY = '@labels';
const PRIORITIES_KEY = '@priorities';

export const StorageService = {
  async getTasks(): Promise<Task[]> {
    try {
      const tasksJson = await AsyncStorage.getItem(TASKS_KEY);
      if (!tasksJson) return [];
      
      const tasks = JSON.parse(tasksJson);
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        reminderDate: task.reminderDate ? new Date(task.reminderDate) : undefined,
        recurrence: task.recurrence ? {
          ...task.recurrence,
          endDate: task.recurrence.endDate ? new Date(task.recurrence.endDate) : undefined,
        } : undefined,
        subtasks: task.subtasks.map((st: any) => ({
          ...st,
          createdAt: new Date(st.createdAt),
        })),
        comments: task.comments.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })),
      }));
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  },

  async getLabels(): Promise<Label[]> {
    try {
      const labelsJson = await AsyncStorage.getItem(LABELS_KEY);
      return labelsJson ? JSON.parse(labelsJson) : [];
    } catch (error) {
      console.error('Error loading labels:', error);
      return [];
    }
  },

  async saveLabels(labels: Label[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LABELS_KEY, JSON.stringify(labels));
    } catch (error) {
      console.error('Error saving labels:', error);
    }
  },

  async getPriorities(): Promise<Priority[]> {
    try {
      const prioritiesJson = await AsyncStorage.getItem(PRIORITIES_KEY);
      return prioritiesJson ? JSON.parse(prioritiesJson) : [];
    } catch (error) {
      console.error('Error loading priorities:', error);
      return [];
    }
  },

  async savePriorities(priorities: Priority[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities));
    } catch (error) {
      console.error('Error saving priorities:', error);
    }
  },
};
