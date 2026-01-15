// Admin UsersScreen - User management
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Avatar, Badge } from '../../components/common';
import { SearchBar } from '../../components/forms';

const UsersScreen = ({ navigation }) => {
  // TODO: Fetch users from API
  const users = [];

  const renderUser = ({ item }) => (
    <View 
      style={styles.userItem}
      onTouchEnd={() => navigation.navigate('UserDetail', { id: item.id })}
    >
      <Avatar name={item.name} size="medium" />
      <View style={styles.userInfo}>
        <Text variant="body">{item.name}</Text>
        <Text variant="caption">{item.email}</Text>
      </View>
      <Badge 
        label={item.status} 
        variant={item.status === 'active' ? 'success' : 'error'} 
      />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h2">Users</Text>
        <SearchBar placeholder="Search users..." style={styles.search} />
      </View>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No users found</Text>
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default UsersScreen;

