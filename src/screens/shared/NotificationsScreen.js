// NotificationsScreen - User notifications
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Avatar } from '../../components/common';

const NotificationsScreen = ({ navigation }) => {
  // TODO: Fetch notifications from API
  const notifications = [];

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

