/**
 * CreatorInfo Component
 * 
 * Creator avatar, name, subscriber count, and subscribe button.
 * YouTube-style layout with tappable creator row.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { darkTheme } from '../../theme';

// =============================================================================
// TYPES
// =============================================================================

interface CreatorInfoProps {
  /** Creator avatar URL */
  avatarUrl?: string;
  /** Creator/channel name */
  name: string;
  /** Subscriber count (number or formatted string) */
  subscriberCount: number | string;
  /** Is user subscribed to this creator */
  isSubscribed?: boolean;
  /** Callback when avatar/name tapped */
  onCreatorPress?: () => void;
  /** Callback when subscribe button tapped */
  onSubscribe?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatSubscribers = (count: number | string): string => {
  if (typeof count === 'string') return count;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M subscribers`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K subscribers`;
  return `${count} subscribers`;
};

// =============================================================================
// COMPONENT
// =============================================================================

export function CreatorInfo({
  avatarUrl,
  name,
  subscriberCount,
  isSubscribed = false,
  onCreatorPress,
  onSubscribe,
}: CreatorInfoProps): JSX.Element {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.creatorRow} onPress={onCreatorPress}>
        {/* Avatar */}
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        {/* Name & Subscribers */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.subscribers}>{formatSubscribers(subscriberCount)}</Text>
        </View>
      </TouchableOpacity>

      {/* Subscribe Button */}
      <TouchableOpacity
        style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
        onPress={onSubscribe}
      >
        <Text style={[styles.subscribeText, isSubscribed && styles.subscribedText]}>
          {isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.semantic.divider,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkTheme.youtube.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.semantic.text,
  },
  subscribers: {
    fontSize: 12,
    color: darkTheme.semantic.textSecondary,
    marginTop: 1,
  },
  subscribeButton: {
    backgroundColor: darkTheme.youtube.red,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 12,
  },
  subscribedButton: {
    backgroundColor: darkTheme.youtube.chipBackground,
  },
  subscribeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  subscribedText: {
    color: darkTheme.semantic.text,
  },
});
