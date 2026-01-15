// Select Component - Dropdown picker placeholder
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../common/Text';

const Select = ({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Select an option',
  error,
  style,
}) => {
  // TODO: Implement with a proper picker/modal
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.select, error && styles.selectError]}
        onPress={() => {
          // TODO: Open picker modal
        }}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  select: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectError: {
    borderColor: '#EF4444',
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default Select;

