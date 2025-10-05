import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Priority } from '../types';

interface PrioritySelectorProps {
  priorities: Priority[];
  selectedPriority: Priority | undefined;
  onSelectPriority: (priority: Priority) => void;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  priorities,
  selectedPriority,
  onSelectPriority,
}) => {
  return (
    <View style={styles.priorityButtons}>
      {priorities.map(p => (
        <TouchableOpacity
          key={p.id}
          style={[
            styles.priorityButton,
            { backgroundColor: p.color },
            selectedPriority?.id === p.id && styles.priorityButtonActive,
          ]}
          onPress={() => onSelectPriority(p)}
        >
          <Text style={styles.priorityButtonText}>
            {p.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  priorityButtonActive: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  priorityButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});