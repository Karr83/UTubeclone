// Header Component - Screen header with title and actions
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../common/Text';

const Header = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  onLeftPress,
  onRightPress,
  style,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {leftAction && (
          <TouchableOpacity onPress={onLeftPress} style={styles.action}>
            <Text>{leftAction}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.titleContainer}>
        <Text variant="h3" numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text variant="caption" numberOfLines={1}>{subtitle}</Text>
        )}
      </View>
      <View style={styles.rightContainer}>
        {rightAction && (
          <TouchableOpacity onPress={onRightPress} style={styles.action}>
            <Text>{rightAction}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leftContainer: {
    width: 60,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  action: {
    padding: 8,
  },
});

export default Header;

