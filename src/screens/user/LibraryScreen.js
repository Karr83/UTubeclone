// LibraryScreen - User's saved/purchased content
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text } from '../../components/common';
import { ContentCard } from '../../components/cards';

const LibraryScreen = ({ navigation }) => {
  // PHASE 2: Mock library content for UI display
  const libraryContent = [
    {
      id: 'lib-1',
      title: 'React Native Masterclass',
      creator: 'TechMaster Pro',
      thumbnail: 'https://picsum.photos/seed/lib1/400/225',
      duration: '2:45:30',
      progress: 0.65, // 65% watched
      type: 'video',
      savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'lib-2',
      title: 'Advanced TypeScript Patterns',
      creator: 'CodeWithSarah',
      thumbnail: 'https://picsum.photos/seed/lib2/400/225',
      duration: '1:32:15',
      progress: 0.3, // 30% watched
      type: 'video',
      savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'lib-3',
      title: 'Building Real-time Apps',
      creator: 'MobileDevDaily',
      thumbnail: 'https://picsum.photos/seed/lib3/400/225',
      duration: '3:12:45',
      progress: 1.0, // Completed
      type: 'video',
      savedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'lib-4',
      title: 'UI/UX Design Principles',
      creator: 'DesignGuru',
      thumbnail: 'https://picsum.photos/seed/lib4/400/225',
      duration: '1:58:20',
      progress: 0.0, // Not started
      type: 'video',
      savedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

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

