// Text Component - Typography with variants
import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

const Text = ({ 
  children, 
  variant = 'body', 
  color,
  style, 
  ...props 
}) => {
  return (
    <RNText 
      style={[styles.base, styles[variant], color && { color }, style]} 
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: '#1F2937',
  },
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default Text;

