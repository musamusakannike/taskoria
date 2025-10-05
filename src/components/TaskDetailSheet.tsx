import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, Priority, RecurrenceType, Label } from '../types';
import { useTasks } from '../context/TaskContext';
import { breakDownTask } from '../services/gemini';
import { PrioritySelector } from './Priority';
import { LabelSelector } from './LabelSelector';

interface TaskDetailSheetProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskDetailSheet: React.FC<TaskDetailSheetProps> = ({ task, onClose }) => {
  const { updateTask, deleteTask, addSubtask, toggleSubtaskComplete, deleteSubtask, addComment, priorities, labels, deleteLabel } = useTasks();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);
  const [showSubtaskCountModal, setShowSubtaskCountModal] = useState(false);
  const [subtaskCountInput, setSubtaskCountInput] = useState('5');

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [task]);

  if (!task) return null;

  const handleUpdateTitle = () => {
    if (title.trim()) {
      updateTask(task.id, { title: title.trim() });
      setEditingTitle(false);
    }
  };

  const handleUpdateDescription = () => {
    updateTask(task.id, { description: description.trim() });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const handleGenerateSubtasks = () => {
    if (!task.title.trim()) return;
    setSubtaskCountInput('5');
    setShowSubtaskCountModal(true);
  };

  const confirmGenerateSubtasks = async () => {
    const subtaskCount = parseInt(subtaskCountInput);
    if (isNaN(subtaskCount) || subtaskCount < 1 || subtaskCount > 10) {
      Alert.alert('Invalid Number', 'Please enter a number between 1 and 10');
      return;
    }

    setShowSubtaskCountModal(false);
    setGeneratingSubtasks(true);
    try {
      const subtasks = await breakDownTask(task.title, subtaskCount);
      for (const subtask of subtasks) {
        await addSubtask(task.id, subtask);
      }
      Alert.alert('Success', `Generated ${subtasks.length} subtasks!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate subtasks');
    } finally {
      setGeneratingSubtasks(false);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleToggleLabel = (label: Label) => {
    const isSelected = task.labels.some(l => l.id === label.id);
    const newLabels = isSelected
      ? task.labels.filter(l => l.id !== label.id)
      : [...task.labels, label];
    updateTask(task.id, { labels: newLabels });
  };

  const recurrenceTypes: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

  return (
    <>
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
    >
      <BottomSheetScrollView style={styles.container}>
        {editingTitle ? (
          <View style={styles.titleEdit}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              autoFocus
              onBlur={handleUpdateTitle}
              onSubmitEditing={handleUpdateTitle}
            />
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingTitle(true)}>
            <Text style={styles.title}>{task.title}</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          onBlur={handleUpdateDescription}
          placeholder="Add description..."
          multiline
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <PrioritySelector
            priorities={priorities}
            selectedPriority={task.priority}
            onSelectPriority={(p) => updateTask(task.id, { priority: p })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Labels</Text>
          <LabelSelector
            allLabels={labels}
            selectedLabels={task.labels}
            onToggleLabel={handleToggleLabel}
            onDeleteLabel={deleteLabel}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="event" size={20} color="#6b7280" />
            <Text style={styles.dateButtonText}>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : 'Set due date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={task.dueDate || new Date()}
              mode="date"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) {
                  updateTask(task.id, { dueDate: date });
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurrence</Text>
          <View style={styles.recurrenceButtons}>
            {recurrenceTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.recurrenceButton,
                  task.recurrence?.type === type && styles.recurrenceButtonActive,
                ]}
                onPress={() => updateTask(task.id, {
                  recurrence: type === 'none' ? undefined : { type, interval: 1 }
                })}
              >
                <Text style={[
                  styles.recurrenceButtonText,
                  task.recurrence?.type === type && styles.recurrenceButtonTextActive,
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={styles.sectionTitle}>Reminder</Text>
            <TouchableOpacity
              onPress={() => updateTask(task.id, { reminderEnabled: !task.reminderEnabled })}
            >
              <MaterialIcons
                name={task.reminderEnabled ? 'notifications-active' : 'notifications-off'}
                size={24}
                color={task.reminderEnabled ? '#3b82f6' : '#9ca3af'}
              />
            </TouchableOpacity>
          </View>
          {task.reminderEnabled && (
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowReminderPicker(true)}
            >
              <MaterialIcons name="alarm" size={20} color="#6b7280" />
              <Text style={styles.dateButtonText}>
                {task.reminderDate
                  ? new Date(task.reminderDate).toLocaleString()
                  : 'Set reminder time'}
              </Text>
            </TouchableOpacity>
          )}
          {showReminderPicker && (
            <DateTimePicker
              value={task.reminderDate || new Date()}
              mode="datetime"
              onChange={(event, date) => {
                setShowReminderPicker(Platform.OS === 'ios');
                if (date) {
                  updateTask(task.id, { reminderDate: date });
                }
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.subtaskHeader}>
            <Text style={styles.sectionTitle}>Subtasks ({task.subtasks.length})</Text>
            <TouchableOpacity
              onPress={handleGenerateSubtasks}
              disabled={generatingSubtasks}
              style={styles.aiButton}
            >
              <MaterialIcons
                name="auto-awesome"
                size={20}
                color={generatingSubtasks ? '#9ca3af' : '#8b5cf6'}
              />
            </TouchableOpacity>
          </View>
          {task.subtasks.map(subtask => (
            <View key={subtask.id} style={styles.subtaskItem}>
              <TouchableOpacity onPress={() => toggleSubtaskComplete(task.id, subtask.id)}>
                <MaterialIcons
                  name={subtask.completed ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={subtask.completed ? '#10b981' : '#9ca3af'}
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.subtaskText,
                  subtask.completed && styles.completedText,
                ]}
              >
                {subtask.text}
              </Text>
              <TouchableOpacity onPress={() => deleteSubtask(task.id, subtask.id)}>
                <MaterialIcons name="close" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addSubtask}>
            <TextInput
              style={styles.subtaskInput}
              value={newSubtask}
              onChangeText={setNewSubtask}
              placeholder="Add subtask..."
              onSubmitEditing={handleAddSubtask}
            />
            <TouchableOpacity onPress={handleAddSubtask}>
              <MaterialIcons name="add-circle" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments ({task.comments.length})</Text>
          {task.comments.map(comment => (
            <View key={comment.id} style={styles.comment}>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentDate}>
                {new Date(comment.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.addComment}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add comment..."
              onSubmitEditing={handleAddComment}
            />
            <TouchableOpacity onPress={handleAddComment}>
              <MaterialIcons name="send" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <MaterialIcons name="delete" size={20} color="white" />
          <Text style={styles.deleteButtonText}>Delete Task</Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>

    <Modal
      visible={showSubtaskCountModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSubtaskCountModal(false)}
    >
      <View style={styles.countModalOverlay}>
        <TouchableWithoutFeedback onPress={() => setShowSubtaskCountModal(false)}>
          <View style={styles.countModalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.countModalContent}>
          <Text style={styles.countModalTitle}>Generate Subtasks</Text>
          <Text style={styles.countModalDescription}>
            How many subtasks would you like? (1-10)
          </Text>
          <TextInput
            style={styles.countInput}
            value={subtaskCountInput}
            onChangeText={setSubtaskCountInput}
            keyboardType="number-pad"
            autoFocus
            selectTextOnFocus
            maxLength={2}
          />
          <View style={styles.countModalButtons}>
            <TouchableOpacity
              style={[styles.countModalButton, styles.countModalButtonCancel]}
              onPress={() => setShowSubtaskCountModal(false)}
            >
              <Text style={styles.countModalButtonTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.countModalButton, styles.countModalButtonConfirm]}
              onPress={confirmGenerateSubtasks}
            >
              <Text style={styles.countModalButtonTextConfirm}>Generate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  titleEdit: {
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 4,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#6b7280',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  recurrenceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurrenceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recurrenceButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  recurrenceButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  recurrenceButtonTextActive: {
    color: 'white',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiButton: {
    padding: 4,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  addSubtask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  comment: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 40,
    gap: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  countModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  countModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  countModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  countModalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  countInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  countModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  countModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  countModalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  countModalButtonConfirm: {
    backgroundColor: '#3b82f6',
  },
  countModalButtonTextCancel: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  countModalButtonTextConfirm: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
