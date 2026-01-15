// SubscriberListScreen - View all subscribers
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Avatar } from '../../components/common';

const SubscriberListScreen = ({ navigation }) => {
  // TODO: Fetch subscribers from API
  const subscribers = [];

  const renderSubscriber = ({ item }) => (
    <View style={styles.subscriberItem}>
      <Avatar name={item.name} size="medium" />
      <View style={styles.subscriberInfo}>
        <Text variant="body">{item.name}</Text>
        <Text variant="caption">Since {item.subscribedAt}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <Header
        title="Subscribers"
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <FlatList
        data={subscribers}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscriber}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No subscribers yet</Text>
            <Text variant="caption">Keep creating great content!</Text>
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
  subscriberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subscriberInfo: {
    marginLeft: 12,
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default SubscriberListScreen;

