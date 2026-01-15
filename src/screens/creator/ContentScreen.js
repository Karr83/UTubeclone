// ContentScreen - Creator's content management
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Button } from '../../components/common';
import { ContentCard } from '../../components/cards';

const ContentScreen = ({ navigation }) => {
  // TODO: Fetch creator's content from API
  const content = [];

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h2">My Content</Text>
        <Button
          title="+ New"
          onPress={() => navigation.navigate('ContentEditor')}
        />
      </View>
      
      <FlatList
        data={content}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard
            {...item}
            onPress={() => navigation.navigate('ContentEditor', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No content yet</Text>
            <Text variant="caption">Create your first piece of content</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default ContentScreen;

