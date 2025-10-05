import React, { useState } from 'react';
import { View, FlatList, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskProvider, useTasks } from '@/src/context/TaskContext';
import { TaskItem } from '@/src/components/TaskItem';
import { TaskDetailSheet } from '@/src/components/TaskDetailSheet';
import { QuickAddFAB } from '@/src/components/QuickAddFAB';
import { FilterBar } from '@/src/components/FilterBar';
import { Task } from '@/src/types';

const TaskList: React.FC = () => {
  const { getFilteredTasks, toggleTaskComplete } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const tasks = getFilteredTasks();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FilterBar />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onPress={() => setSelectedTask(item)}
            onToggleComplete={() => toggleTaskComplete(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      <QuickAddFAB />
      <TaskDetailSheet
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <TaskProvider>
        <TaskList />
      </TaskProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    paddingVertical: 8,
  },
});
