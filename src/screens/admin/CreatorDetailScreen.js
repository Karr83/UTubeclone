// Admin CreatorDetailScreen - View and manage individual creator
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Avatar, Button, Divider, Badge } from '../../components/common';

const CreatorDetailScreen = ({ navigation, route }) => {
  const creatorId = route?.params?.id;
  
  // TODO: Fetch creator details from API
  const creator = {
    name: 'Creator Name',
    email: 'creator@example.com',
    status: 'approved',
    subscribers: 0,
    earnings: 0,
    content: 0,
  };

  return (
    <ScreenContainer>
      <Header
        title="Creator Details"
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <View style={styles.profileSection}>
        <Avatar name={creator.name} size="xlarge" />
        <Text variant="h2" style={styles.name}>{creator.name}</Text>
        <Text variant="caption">{creator.email}</Text>
        <Badge 
          label={creator.status} 
          variant={creator.status === 'approved' ? 'success' : 'warning'}
          style={styles.badge}
        />
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text variant="h3">{creator.subscribers}</Text>
          <Text variant="caption">Subscribers</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="h3">${creator.earnings}</Text>
          <Text variant="caption">Earnings</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="h3">{creator.content}</Text>
          <Text variant="caption">Content</Text>
        </View>
      </View>
      
      <Divider />
      
      <View style={styles.actions}>
        <Text variant="h3">Actions</Text>
        {creator.status === 'pending' && (
          <Button
            title="Approve Creator"
            onPress={() => {
              Alert.alert(
                'Approve Creator',
                'Are you sure you want to approve this creator?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Approve', onPress: () => Alert.alert('Success', 'Creator approved.') },
                ]
              );
            }}
            style={styles.actionButton}
          />
        )}
        <Button
          title={creator.status === 'approved' ? 'Suspend Creator' : 'Activate Creator'}
          variant="secondary"
          onPress={() => {
            const action = creator.status === 'approved' ? 'suspend' : 'activate';
            Alert.alert(
              `${action === 'suspend' ? 'Suspend' : 'Activate'} Creator`,
              `Are you sure you want to ${action} this creator?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: action === 'suspend' ? 'Suspend' : 'Activate', 
                  onPress: () => Alert.alert('Success', `Creator ${action}d.`) 
                },
              ]
            );
          }}
          style={styles.actionButton}
        />
        <Button
          title="View Content"
          variant="secondary"
          onPress={() => {
            Alert.alert('View Content', 'Creator content viewer will be available soon.', [{ text: 'OK' }]);
          }}
          style={styles.actionButton}
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  stat: {
    alignItems: 'center',
  },
  actions: {
    paddingVertical: 16,
  },
  actionButton: {
    marginTop: 12,
  },
});

export default CreatorDetailScreen;

