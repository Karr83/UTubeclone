// Badge Component - Status indicators and labels
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';

const Badge = ({ 
  label, 
  variant = 'default',
  size = 'medium',
  style,
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#E5E7EB',
  },
  primary: {
    backgroundColor: '#EEF2FF',
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  premium: {
    backgroundColor: '#FEF3C7',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {},
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontWeight: '600',
  },
  defaultText: {
    color: '#4B5563',
  },
  primaryText: {
    color: '#6366F1',
  },
  successText: {
    color: '#059669',
  },
  warningText: {
    color: '#D97706',
  },
  errorText: {
    color: '#DC2626',
  },
  premiumText: {
    color: '#D97706',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});

export default Badge;

