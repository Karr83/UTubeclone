// ExploreScreen - Discover new creators and content
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text } from '../../components/common';
import { SearchBar } from '../../components/forms';
import { CreatorCard } from '../../components/cards';

const ExploreScreen = ({ navigation }) => {
  // PHASE 2: Mock creators data for UI display
  const creators = [
    {
      id: 'creator-1',
      name: 'TechMaster Pro',
      avatar: 'https://i.pravatar.cc/150?u=creator1',
      bio: '🚀 Full-stack developer | React Native expert',
      subscribers: 125000,
      videos: 234,
      verified: true,
    },
    {
      id: 'creator-2',
      name: 'CodeWithSarah',
      avatar: 'https://i.pravatar.cc/150?u=creator2',
      bio: '💻 Teaching web development | JavaScript enthusiast',
      subscribers: 89000,
      videos: 156,
      verified: true,
    },
    {
      id: 'creator-3',
      name: 'DevLife Gaming',
      avatar: 'https://i.pravatar.cc/150?u=creator3',
      bio: '🎮 Game dev tutorials | Unity & Unreal Engine',
      subscribers: 67000,
      videos: 198,
      verified: false,
    },
    {
      id: 'creator-4',
      name: 'DesignGuru',
      avatar: 'https://i.pravatar.cc/150?u=creator4',
      bio: '🎨 UI/UX designer | Figma master',
      subscribers: 45000,
      videos: 89,
      verified: true,
    },
    {
      id: 'creator-5',
      name: 'DataScience101',
      avatar: 'https://i.pravatar.cc/150?u=creator5',
      bio: '📊 Data science tutorials | Python & ML',
      subscribers: 112000,
      videos: 267,
      verified: true,
    },
    {
      id: 'creator-6',
      name: 'MobileDevDaily',
      avatar: 'https://i.pravatar.cc/150?u=creator6',
      bio: '📱 Mobile development tips | iOS & Android',
      subscribers: 34000,
      videos: 145,
      verified: false,
    },
  ];

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

