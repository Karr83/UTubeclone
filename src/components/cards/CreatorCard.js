// CreatorCard Component - Display creator profile preview
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../common/Text';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

const CreatorCard = ({
  name,
  avatar,
  bio,
  subscriberCount,
  isVerified = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      <Avatar source={avatar ? { uri: avatar } : null} name={name} size="large" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="h3" numberOfLines={1}>{name}</Text>
          {isVerified && <Badge label="✓" variant="primary" size="small" />}
        </View>
        {bio && (
          <Text variant="caption" numberOfLines={2} style={styles.bio}>
            {bio}
          </Text>
        )}
        <Text variant="small" style={styles.subscribers}>
          {subscriberCount?.toLocaleString() || 0} subscribers
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bio: {
    marginTop: 4,
  },
  subscribers: {
    marginTop: 8,
    color: '#6B7280',
  },
});

export default CreatorCard;

