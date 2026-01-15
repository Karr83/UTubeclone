// SearchBar Component - Search input with icon
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        returnKeyType="search"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
});

export default SearchBar;

