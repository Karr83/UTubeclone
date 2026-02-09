/**
 * SidebarMenu Component
 * 
 * Main sidebar / drawer menu container component.
 * Composes SidebarMenuTitle and TopMenuItem to create a structured menu.
 * 
 * Features:
 * - Vertical stack layout
 * - Section-based organization
 * - Scrollable when content exceeds screen
 * - Optional dividers between sections
 * - YouTube-style dark theme
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { darkTheme, spacing } from '../../theme';
import { SidebarMenuTitle } from './SidebarMenuTitle';
import { TopMenuItem } from './TopMenuItem';

// =============================================================================
// TYPES
// =============================================================================

export interface SidebarMenuItem {
  /** Menu item label */
  label: string;
  /** Optional leading icon (ReactNode or string/emoji) */
  icon?: React.ReactNode | string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Called when item is pressed */
  onPress: () => void;
  /** Destructive action (shows in red) */
  destructive?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface SidebarMenuSection {
  /** Optional section title */
  title?: string;
  /** Menu items in this section */
  items: SidebarMenuItem[];
  /** Show divider above this section */
  showDivider?: boolean;
}

export interface SidebarMenuProps {
  /** Array of menu sections */
  sections: SidebarMenuSection[];
  /** Additional container style */
  style?: ViewStyle;
  /** Whether the menu is scrollable (default: true) */
  scrollable?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SidebarMenu({
  sections,
  style,
  scrollable = true,
}: SidebarMenuProps): JSX.Element {
  const content = (
    <View style={styles.container}>
      {sections.map((section, sectionIndex) => {
        const isFirstSection = sectionIndex === 0;
        const showDivider = section.showDivider || (!isFirstSection && section.title);

        return (
          <View key={sectionIndex} style={styles.section}>
            {/* Section Title */}
            {section.title && (
              <SidebarMenuTitle
                title={section.title}
                showDivider={showDivider}
              />
            )}

            {/* Section Items */}
            {section.items.map((item, itemIndex) => {
              const isLastItem = itemIndex === section.items.length - 1;
              const isLastSection = sectionIndex === sections.length - 1;
              
              // Show divider after item if:
              // - It's the last item in a section AND
              // - There's another section after this one AND
              // - The next section doesn't have a title (to avoid double dividers)
              const showItemDivider =
                isLastItem &&
                !isLastSection &&
                !sections[sectionIndex + 1]?.title;

              return (
                <TopMenuItem
                  key={itemIndex}
                  label={item.label}
                  icon={item.icon}
                  subtitle={item.subtitle}
                  onPress={item.onPress}
                  destructive={item.destructive}
                  disabled={item.disabled}
                  showDivider={showItemDivider}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scrollView, style]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: darkTheme.semantic.background,
  },
  scrollContent: {
    paddingBottom: spacing[4], // 16px bottom padding
  },
  container: {
    flex: 1,
    backgroundColor: darkTheme.semantic.background,
  },
  section: {
    // Section container - spacing handled by child components
  },
});
