import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Label } from '../types';

interface LabelSelectorProps {
  allLabels: Label[];
  selectedLabels: Label[];
  onToggleLabel: (label: Label) => void;
  onDeleteLabel: (labelId: string) => void;
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  allLabels,
  selectedLabels,
  onToggleLabel,
  onDeleteLabel,
}) => {
  const handleDelete = (label: Label) => {
    Alert.alert(
      'Delete Label',
      `Are you sure you want to delete the "${label.name}" label? This will remove it from all tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteLabel(label.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {allLabels.map(label => {
        const isSelected = selectedLabels.some(l => l.id === label.id);
        return (
          <TouchableOpacity
            key={label.id}
            style={[
              styles.label,
              { backgroundColor: label.color },
              isSelected && styles.labelSelected,
            ]}
            onPress={() => onToggleLabel(label)}
          >
            <Text style={styles.labelText}>{label.name}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(label)}
            >
              <MaterialIcons name="close" size={14} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    opacity: 0.7,
  },
  labelSelected: {
    opacity: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  labelText: {
    color: 'white',
    fontWeight: '500',
    marginRight: 6,
  },
  deleteButton: {
    padding: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
  },
});