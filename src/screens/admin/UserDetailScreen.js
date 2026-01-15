// Admin UserDetailScreen - View and manage individual user
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Avatar, Button, Divider, Badge } from '../../components/common';

const UserDetailScreen = ({ navigation, route }) => {
  const userId = route?.params?.id;
  
  // TODO: Fetch user details from API
  const user = {
    name: 'User Name',
    email: 'user@example.com',
    status: 'active',
    joinedAt: '2024-01-01',
    subscriptions: 0,
  };

  return (
    <ScreenContainer>
      <Header
        title="User Details"
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <View style={styles.profileSection}>
        <Avatar name={user.name} size="xlarge" />
        <Text variant="h2" style={styles.name}>{user.name}</Text>
        <Text variant="caption">{user.email}</Text>
        <Badge 
          label={user.status} 
          variant={user.status === 'active' ? 'success' : 'error'}
          style={styles.badge}
        />
      </View>
      
      <Divider />
      
      <View style={styles.infoSection}>
        <Text variant="h3">Account Info</Text>
        <Text variant="body">Joined: {user.joinedAt}</Text>
        <Text variant="body">Active Subscriptions: {user.subscriptions}</Text>
      </View>
      
      <Divider />
      
      <View style={styles.actions}>
        <Text variant="h3">Actions</Text>
        <Button
          title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
          variant="secondary"
          onPress={() => {
            // TODO: Implement status toggle
          }}
          style={styles.actionButton}
        />
        <Button
          title="Delete User"
          onPress={() => {
            // TODO: Implement delete with confirmation
          }}
          style={[styles.actionButton, styles.dangerButton]}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  name: {
    marginTop: 16,
  },
  badge: {
    marginTop: 8,
  },
  infoSection: {
    paddingVertical: 16,
  },
  actions: {
    paddingVertical: 16,
  },
  actionButton: {
    marginTop: 12,
  },
  dangerButton: {
    backgroundColor: '#DC2626',
  },
});

export default UserDetailScreen;

