// Admin CreatorsScreen - Creator management and approval
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Avatar, Badge } from '../../components/common';
import { SearchBar } from '../../components/forms';

const CreatorsScreen = ({ navigation }) => {
  // TODO: Fetch creators from API
  const creators = [];

  const renderCreator = ({ item }) => (
    <View 
      style={styles.creatorItem}
      onTouchEnd={() => navigation.navigate('CreatorDetail', { id: item.id })}
    >
      <Avatar name={item.name} size="medium" />
      <View style={styles.creatorInfo}>
        <Text variant="body">{item.name}</Text>
        <Text variant="caption">{item.subscribers} subscribers</Text>
      </View>
      <Badge 
        label={item.status} 
        variant={
          item.status === 'approved' ? 'success' : 
          item.status === 'pending' ? 'warning' : 'error'
        } 
      />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h2">Creators</Text>
        <SearchBar placeholder="Search creators..." style={styles.search} />
      </View>
      
      <FlatList
        data={creators}
        keyExtractor={(item) => item.id}
        renderItem={renderCreator}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No creators found</Text>
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
  },
  creatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default CreatorsScreen;

