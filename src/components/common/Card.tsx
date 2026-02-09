/**
 * Card Component
 * 
 * Base card component for consistent surface styling across the app.
 * Supports both light and dark themes with configurable elevation.
 * 
 * Usage:
 * <Card>Content here</Card>
 * <Card elevated pressable onPress={handlePress}>Clickable card</Card>
 * 
 * TODO Phase 3: Add card variants (outlined, filled, ghost)
 * TODO Phase 3: Add animation support for press feedback
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { darkTheme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  /** Apply elevated surface style */
  elevated?: boolean;
  /** Make card pressable */
  pressable?: boolean;
  /** Press handler (requires pressable=true) */
  onPress?: () => void;
  /** Disable padding */
  noPadding?: boolean;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  pressable = false,
  onPress,
  noPadding = false,
  style,
}) => {
  const cardStyle = [
    styles.card,
    elevated && styles.elevated,
    noPadding && styles.noPadding,
    style,
  ];

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkTheme.semantic.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: darkTheme.semantic.border,
  },
  elevated: {
    backgroundColor: darkTheme.semantic.surfaceElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
