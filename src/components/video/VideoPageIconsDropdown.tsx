/**
 * VideoPageIconsDropdown Component
 * 
 * Reusable dropdown menu for video watch pages.
 * Used for "more actions" (three-dot menu) functionality.
 * 
 * Features:
 * - Animated fade + slide entrance
 * - Dark theme styling (YouTube-style)
 * - Closes on outside tap or item press
 * - Supports icons and labels
 * - Works on iOS and Android
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { darkTheme, spacing, typography } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface DropdownMenuItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon (emoji or component) */
  icon?: React.ReactNode | string;
  /** Action when pressed */
  onPress: () => void;
  /** Optional: show divider after this item */
  showDivider?: boolean;
  /** Optional: destructive action (shows in red) */
  isDestructive?: boolean;
  /** Optional: disabled state */
  disabled?: boolean;
}

export interface VideoPageIconsDropdownProps {
  /** Menu items to display */
  items: DropdownMenuItem[];
  /** Controls visibility */
  visible: boolean;
  /** Called when menu should close */
  onClose: () => void;
  /** Optional: anchor position (for positioning) */
  anchorPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Optional: title for the menu */
  title?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ANIMATION_DURATION = 150;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// COMPONENT
// =============================================================================

export function VideoPageIconsDropdown({
  items,
  visible,
  onClose,
  anchorPosition = 'top-right',
  title,
}: VideoPageIconsDropdownProps): JSX.Element | null {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  
  // Handle open/close animations
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for next open
      fadeAnim.setValue(0);
      slideAnim.setValue(-10);
    }
  }, [visible, fadeAnim, slideAnim]);
  
  // Handle item press
  const handleItemPress = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    onClose();
    // Small delay to allow close animation
    setTimeout(() => {
      item.onPress();
    }, 50);
  };
  
  // Get position styles
  const getPositionStyles = () => {
    switch (anchorPosition) {
      case 'top-left':
        return { top: spacing[12], left: spacing[4] };
      case 'bottom-right':
        return { bottom: spacing[12], right: spacing[4] };
      case 'bottom-left':
        return { bottom: spacing[12], left: spacing[4] };
      case 'top-right':
      default:
        return { top: spacing[12], right: spacing[4] };
    }
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          {/* Menu Container */}
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.menuContainer,
                getPositionStyles(),
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Title (optional) */}
              {title && (
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>{title}</Text>
                </View>
              )}
              
              {/* Menu Items */}
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      item.disabled && styles.menuItemDisabled,
                    ]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                    disabled={item.disabled}
                  >
                    {/* Icon */}
                    {item.icon && (
                      <View style={styles.iconContainer}>
                        {typeof item.icon === 'string' ? (
                          <Text style={styles.iconEmoji}>{item.icon}</Text>
                        ) : (
                          item.icon
                        )}
                      </View>
                    )}
                    
                    {/* Label */}
                    <Text
                      style={[
                        styles.menuItemLabel,
                        item.isDestructive && styles.menuItemLabelDestructive,
                        item.disabled && styles.menuItemLabelDisabled,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Divider */}
                  {item.showDivider && index < items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </React.Fragment>
              ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// =============================================================================
// PRESET MENU ITEMS (Common actions)
// =============================================================================

export const createVideoMenuItems = (handlers: {
  onSaveToPlaylist?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onNotInterested?: () => void;
  onDontRecommend?: () => void;
  onReport?: () => void;
  onAddToQueue?: () => void;
  onCaptions?: () => void;
}): DropdownMenuItem[] => {
  const items: DropdownMenuItem[] = [];
  
  if (handlers.onSaveToPlaylist) {
    items.push({
      id: 'save',
      label: 'Save to playlist',
      icon: '📑',
      onPress: handlers.onSaveToPlaylist,
    });
  }
  
  if (handlers.onDownload) {
    items.push({
      id: 'download',
      label: 'Download',
      icon: '⬇️',
      onPress: handlers.onDownload,
    });
  }
  
  if (handlers.onShare) {
    items.push({
      id: 'share',
      label: 'Share',
      icon: '↗️',
      onPress: handlers.onShare,
    });
  }
  
  if (handlers.onAddToQueue) {
    items.push({
      id: 'queue',
      label: 'Add to queue',
      icon: '📋',
      onPress: handlers.onAddToQueue,
    });
  }
  
  if (handlers.onCaptions) {
    items.push({
      id: 'captions',
      label: 'Captions',
      icon: 'CC',
      onPress: handlers.onCaptions,
      showDivider: true,
    });
  }
  
  if (handlers.onNotInterested) {
    items.push({
      id: 'not-interested',
      label: 'Not interested',
      icon: '🚫',
      onPress: handlers.onNotInterested,
    });
  }
  
  if (handlers.onDontRecommend) {
    items.push({
      id: 'dont-recommend',
      label: "Don't recommend channel",
      icon: '⊘',
      onPress: handlers.onDontRecommend,
    });
  }
  
  if (handlers.onReport) {
    items.push({
      id: 'report',
      label: 'Report',
      icon: '⚠️',
      onPress: handlers.onReport,
      isDestructive: true,
    });
  }
  
  return items;
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: darkTheme.youtube.overlay,
  },
  menuContainer: {
    position: 'absolute',
    minWidth: 200,
    maxWidth: 280,
    backgroundColor: darkTheme.youtube.menuBackground,
    borderRadius: 12,
    paddingVertical: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.youtube.menuDivider,
    marginBottom: spacing[1],
  },
  titleText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold as any,
    color: darkTheme.semantic.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  iconEmoji: {
    fontSize: 18,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: darkTheme.semantic.text,
  },
  menuItemLabelDestructive: {
    color: darkTheme.youtube.red,
  },
  menuItemLabelDisabled: {
    color: darkTheme.semantic.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.youtube.menuDivider,
    marginVertical: spacing[1],
    marginHorizontal: spacing[4],
  },
});
