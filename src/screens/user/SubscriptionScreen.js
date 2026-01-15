// SubscriptionScreen - Manage user subscriptions
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text } from '../../components/common';
import { SubscriptionCard } from '../../components/cards';

const SubscriptionScreen = ({ navigation }) => {
  // TODO: Fetch user subscriptions from API
  const subscriptions = [];

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <Header
        title="My Subscriptions"
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard {...item} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No active subscriptions</Text>
            <Text variant="caption">Subscribe to creators to see them here</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default SubscriptionScreen;

