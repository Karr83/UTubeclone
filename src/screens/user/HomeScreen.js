// HomeScreen - User's personalized feed
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text } from '../../components/common';
import { SearchBar } from '../../components/forms';
import { ContentCard } from '../../components/cards';

const HomeScreen = ({ navigation }) => {
  // TODO: Fetch feed data from API
  const feedData = [];

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h2">Home</Text>
        <SearchBar placeholder="Search content..." style={styles.search} />
      </View>
      
      <FlatList
        data={feedData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard
            {...item}
            onPress={() => navigation.navigate('ContentDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No content yet</Text>
            <Text variant="caption">Follow creators to see their content here</Text>
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
    gap: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default HomeScreen;

