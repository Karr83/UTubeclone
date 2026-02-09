// NotificationsScreen - User notifications
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Avatar } from '../../components/common';

const NotificationsScreen = ({ navigation }) => {
  // PHASE 2: Mock notifications data for UI display
  const notifications = [
    {
      id: '1',
      title: 'New subscriber',
      message: 'TechLover99 subscribed to your channel',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'New comment',
      message: 'Sarah Chen commented: "Great content! Keep it up! 🔥"',
      time: '5 hours ago',
      read: false,
    },
    {
      id: '3',
      title: 'Stream reminder',
      message: 'CodeMaster is going live in 30 minutes',
      time: '8 hours ago',
      read: true,
    },
    {
      id: '4',
      title: 'New like',
      message: 'Your video "React Native Tutorial" got 50 new likes',
      time: '1 day ago',
      read: true,
    },
    {
      id: '5',
      title: 'Milestone reached',
      message: '🎉 Congratulations! You reached 1,000 subscribers',
      time: '2 days ago',
      read: true,
    },
    {
      id: '6',
      title: 'Payment received',
      message: 'Your monthly earnings of $125.50 have been processed',
      time: '3 days ago',
      read: true,
    },
    {
      id: '7',
      title: 'New follower',
      message: 'DevGuru started following you',
      time: '4 days ago',
      read: true,
    },
  ];

  const renderNotification = ({ item }) => (
    <View style={[styles.notification, !item.read && styles.unread]}>
      <Avatar name={item.title} size="small" />
      <View style={styles.notificationContent}>
        <Text variant="body">{item.title}</Text>
        <Text variant="caption">{item.message}</Text>
        <Text variant="small" style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <Header
        title="Notifications"
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No notifications</Text>
            <Text variant="caption">You're all caught up!</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  notification: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  unread: {
    backgroundColor: '#EEF2FF',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  time: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default NotificationsScreen;

