import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onPress, onToggleComplete }) => {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <TouchableOpacity onPress={onToggleComplete} style={styles.checkbox}>
        <MaterialIcons 
          name={task.completed ? 'check-box' : 'check-box-outline-blank'} 
          size={24} 
          color={task.completed ? '#10b981' : '#9ca3af'} 
        />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text 
          style={[
            styles.title, 
            task.completed && styles.completedText
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        
        {task.description && (
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          {task.dueDate && (
            <View style={styles.badge}>
              <MaterialIcons name="event" size={14} color="#6b7280" />
              <Text style={styles.badgeText}>
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {totalSubtasks > 0 && (
            <View style={styles.badge}>
              <MaterialIcons name="checklist" size={14} color="#6b7280" />
              <Text style={styles.badgeText}>
                {completedSubtasks}/{totalSubtasks}
              </Text>
            </View>
          )}
          
          {task.labels.map(label => (
            <View 
              key={label.id} 
              style={[styles.label, { backgroundColor: label.color }]}
            >
              <Text style={styles.labelText}>{label.name}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={[styles.priorityBar, { backgroundColor: getPriorityColor() }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  label: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  priorityBar: {
    width: 4,
    borderRadius: 2,
    marginLeft: 12,
  },
});
