export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export type Priority = 'low' | 'medium' | 'high';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number;
  endDate?: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: Date;
  recurrence?: RecurrenceConfig;
  labels: Label[];
  subtasks: Subtask[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  reminderEnabled: boolean;
  reminderDate?: Date;
}

export interface FilterOptions {
  priority?: Priority;
  labelIds?: string[];
  showCompleted: boolean;
  search?: string;
}
