// ContentCard Component - Display content item preview
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Text from '../common/Text';
import Badge from '../common/Badge';

const ContentCard = ({
  title,
  description,
  thumbnail,
  creatorName,
  isPremium = false,
  isLocked = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      <View style={styles.thumbnailContainer}>
        {thumbnail && (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        )}
        {isPremium && (
          <Badge label="Premium" variant="premium" style={styles.badge} />
        )}
        {isLocked && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text variant="h3" numberOfLines={2}>{title}</Text>
        {description && (
          <Text variant="caption" numberOfLines={2} style={styles.description}>
            {description}
          </Text>
        )}
        {creatorName && (
          <Text variant="small" style={styles.creator}>
            by {creatorName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#E5E7EB',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 32,
  },
  content: {
    padding: 12,
  },
  description: {
    marginTop: 4,
  },
  creator: {
    marginTop: 8,
    color: '#6366F1',
  },
});

export default ContentCard;

