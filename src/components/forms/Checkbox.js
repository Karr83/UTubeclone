// Checkbox Component - Toggle checkbox with label
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Text from '../common/Text';

const Checkbox = ({
  checked = false,
  onToggle,
  label,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onToggle}
      disabled={disabled}
    >
      <View style={[styles.checkbox, checked && styles.checked, disabled && styles.disabled]}>
        {checked && <View style={styles.checkmark} />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkmark: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
});

export default Checkbox;

