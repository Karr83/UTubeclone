// Divider Component - Visual separator
import React from 'react';
import { View, StyleSheet } from 'react-native';

const Divider = ({ 
  color = '#E5E7EB',
  thickness = 1,
  spacing = 16,
  style,
}) => {
  return (
    <View 
      style={[
        styles.divider, 
        { 
          backgroundColor: color, 
          height: thickness,
          marginVertical: spacing,
        },
        style,
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '100%',
  },
});

export default Divider;

