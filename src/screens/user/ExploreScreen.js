// ExploreScreen - Discover new creators and content
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text } from '../../components/common';
import { SearchBar } from '../../components/forms';
import { CreatorCard } from '../../components/cards';

const ExploreScreen = ({ navigation }) => {
  // TODO: Fetch creators from API
  const creators = [];

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h2">Explore</Text>
        <SearchBar placeholder="Search creators..." style={styles.search} />
      </View>
      
      <FlatList
        data={creators}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CreatorCard
            {...item}
            onPress={() => navigation.navigate('CreatorProfile', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">Discover creators</Text>
            <Text variant="caption">Find amazing content creators to follow</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  search: {
    marginTop: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default ExploreScreen;

