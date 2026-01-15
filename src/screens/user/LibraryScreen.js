// LibraryScreen - User's saved/purchased content
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text } from '../../components/common';
import { ContentCard } from '../../components/cards';

const LibraryScreen = ({ navigation }) => {
  // TODO: Fetch user's library from API
  const libraryContent = [];

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h2">My Library</Text>
      </View>
      
      <FlatList
        data={libraryContent}
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
            <Text variant="body">Your library is empty</Text>
            <Text variant="caption">Subscribe to creators to access their content</Text>
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

export default LibraryScreen;

