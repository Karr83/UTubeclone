// TabBar Component - Custom bottom tab bar (placeholder)
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../common/Text';

const TabBar = ({
  tabs = [],
  activeIndex = 0,
  onTabPress,
  style,
}) => {
  return (
    <View style={[styles.tabBar, style]}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tab}
          onPress={() => onTabPress?.(index)}
        >
          <Text style={[styles.label, index === activeIndex && styles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  activeLabel: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default TabBar;

