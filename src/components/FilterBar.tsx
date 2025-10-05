import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTasks } from '../context/TaskContext';
import { Priority } from '../types';

export const FilterBar: React.FC = () => {
  const { labels, filterOptions, setFilterOptions, addLabel } = useTasks();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [searchText, setSearchText] = useState(filterOptions.search || '');

  const priorities: Priority[] = ['low', 'medium', 'high'];
  const labelColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  const handleAddLabel = (color: string) => {
    if (newLabelName.trim()) {
      addLabel(newLabelName.trim(), color);
      setNewLabelName('');
      setShowLabelModal(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    setFilterOptions({ search: text || undefined });
  };

  const activeFilters = [
    filterOptions.priority ? 1 : 0,
    filterOptions.labelIds?.length || 0,
    !filterOptions.showCompleted ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
          placeholder="Search tasks..."
          placeholderTextColor="#9ca3af"
        />
        {searchText ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialIcons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#6b7280" />
          {activeFilters > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowLabelModal(true)}
        >
          <MaterialIcons name="label" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Priority</Text>
              <View style={styles.priorityOptions}>
                {priorities.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      filterOptions.priority === p && styles.priorityOptionActive,
                    ]}
                    onPress={() => setFilterOptions({
                      priority: filterOptions.priority === p ? undefined : p
                    })}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      filterOptions.priority === p && styles.priorityOptionTextActive,
                    ]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Labels</Text>
              <View style={styles.labelOptions}>
                {labels.map(label => (
                  <TouchableOpacity
                    key={label.id}
                    style={[
                      styles.labelOption,
                      { backgroundColor: label.color },
                      filterOptions.labelIds?.includes(label.id) && styles.labelOptionActive,
                    ]}
                    onPress={() => {
                      const current = filterOptions.labelIds || [];
                      const newIds = current.includes(label.id)
                        ? current.filter(id => id !== label.id)
                        : [...current, label.id];
                      setFilterOptions({
                        labelIds: newIds.length > 0 ? newIds : undefined
                      });
                    }}
                  >
                    <Text style={styles.labelOptionText}>{label.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <TouchableOpacity
                style={styles.toggleOption}
                onPress={() => setFilterOptions({ showCompleted: !filterOptions.showCompleted })}
              >
                <Text style={styles.toggleLabel}>Show Completed</Text>
                <MaterialIcons
                  name={filterOptions.showCompleted ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={filterOptions.showCompleted ? '#3b82f6' : '#9ca3af'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setFilterOptions({ 
                  priority: undefined, 
                  labelIds: undefined, 
                  showCompleted: true,
                  search: undefined,
                });
                setSearchText('');
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.clearButtonText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLabelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLabelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Label</Text>
              <TouchableOpacity onPress={() => setShowLabelModal(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.labelInput}
              value={newLabelName}
              onChangeText={setNewLabelName}
              placeholder="Label name..."
            />

            <Text style={styles.filterLabel}>Choose Color</Text>
            <View style={styles.colorOptions}>
              {labelColors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }]}
                  onPress={() => handleAddLabel(color)}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#1f2937',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  priorityOptionText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  priorityOptionTextActive: {
    color: 'white',
  },
  labelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    opacity: 0.6,
  },
  labelOptionActive: {
    opacity: 1,
  },
  labelOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  labelInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
