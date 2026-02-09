/**
 * TopMenu Component
 * 
 * Horizontal scrollable filter menu with selectable chips.
 * Used to filter related videos (e.g., "All", "From Creator Name").
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TopMenuItem } from './TopMenuItem';
import { colors } from './styles';

// =============================================================================
// TYPES
// =============================================================================

interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label */
  label: string;
}

interface TopMenuProps {
  /** Array of menu items to display */
  items: MenuItem[];
  /** Currently selected item ID */
  selectedId?: string;
  /** Callback when an item is selected */
  onSelect?: (id: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TopMenu({
  items,
  selectedId,
  onSelect,
}: TopMenuProps): JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TopMenuItem
            key={item.id}
            label={item.label}
            isActive={selectedId === item.id}
            onPress={() => onSelect?.(item.id)}
            testID={`top-menu-item-${item.id}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
});
