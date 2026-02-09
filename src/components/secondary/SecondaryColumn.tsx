/**
 * SecondaryColumn Component
 * 
 * Container for "Up Next" / related videos section.
 * Combines TopMenu filter and scrollable video list.
 * 
 * Mobile-first design (vertical scroll, no sidebar).
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { TopMenu } from './TopMenu';
import { SecondaryVideoItem } from './SecondaryVideoItem';
import { colors } from './styles';

// =============================================================================
// TYPES
// =============================================================================

interface MenuItem {
  id: string;
  label: string;
}

interface VideoItem {
  id: string;
  thumbnailUrl?: string;
  title: string;
  creatorName: string;
  viewCount: number | string;
  timeAgo: string;
  duration: string;
}

interface SecondaryColumnProps {
  /** Filter menu items */
  menuItems?: MenuItem[];
  /** Currently selected menu item ID */
  selectedMenuId?: string;
  /** Callback when menu item selected */
  onMenuSelect?: (id: string) => void;
  /** Video items to display */
  videos: VideoItem[];
  /** Callback when a video is pressed */
  onVideoPress?: (id: string) => void;
  /** Callback when video options pressed */
  onVideoMorePress?: (id: string) => void;
  /** Is content refreshing */
  isRefreshing?: boolean;
  /** Callback for pull-to-refresh */
  onRefresh?: () => void;
  /** Optional header component (e.g., "Up Next" label) */
  HeaderComponent?: React.ReactNode;
  /** Whether to show the top menu */
  showMenu?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SecondaryColumn({
  menuItems = [],
  selectedMenuId,
  onMenuSelect,
  videos,
  onVideoPress,
  onVideoMorePress,
  isRefreshing = false,
  onRefresh,
  HeaderComponent,
  showMenu = true,
}: SecondaryColumnProps): JSX.Element {
  return (
    <View style={styles.container}>
      {/* Top Filter Menu */}
      {showMenu && menuItems.length > 0 && (
        <TopMenu
          items={menuItems}
          selectedId={selectedMenuId}
          onSelect={onMenuSelect}
        />
      )}

      {/* Video List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          ) : undefined
        }
      >
        {/* Optional Header */}
        {HeaderComponent}

        {/* Video Items */}
        {videos.map((video) => (
          <SecondaryVideoItem
            key={video.id}
            thumbnailUrl={video.thumbnailUrl}
            title={video.title}
            creatorName={video.creatorName}
            viewCount={video.viewCount}
            timeAgo={video.timeAgo}
            duration={video.duration}
            onPress={() => onVideoPress?.(video.id)}
            onMorePress={() => onVideoMorePress?.(video.id)}
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
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
