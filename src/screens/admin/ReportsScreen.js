// Admin ReportsScreen - Content/user reports management
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Badge } from '../../components/common';

const ReportsScreen = ({ navigation }) => {
  // TODO: Fetch reports from API
  const reports = [];

  const renderReport = ({ item }) => (
    <View 
      style={styles.reportItem}
      onTouchEnd={() => navigation.navigate('ReportDetail', { id: item.id })}
    >
      <View style={styles.reportInfo}>
        <Text variant="body">{item.type}</Text>
        <Text variant="caption">{item.reason}</Text>
        <Text variant="small" style={styles.date}>{item.createdAt}</Text>
      </View>
      <Badge 
        label={item.status} 
        variant={
          item.status === 'resolved' ? 'success' : 
          item.status === 'pending' ? 'warning' : 'default'
        } 
      />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.header}>
        <Text variant="h2">Reports</Text>
      </View>
      
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body">No reports</Text>
            <Text variant="caption">All clear!</Text>
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
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportInfo: {
    flex: 1,
  },
  date: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 64,
  },
});

export default ReportsScreen;

