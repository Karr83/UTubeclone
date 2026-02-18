// Admin ReportDetailScreen - View and resolve reports
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Button, Divider, Badge } from '../../components/common';

const ReportDetailScreen = ({ navigation, route }) => {
  const reportId = route?.params?.id;
  
  const [report, setReport] = useState({
    type: 'Content Report',
    reason: 'Inappropriate content',
    description: 'Detailed description of the report...',
    reportedBy: 'User Name',
    reportedAt: '2024-01-01',
    status: route?.params?.status || 'pending',
  });

  return (
    <ScreenContainer>
      <Header
        title="Report Details"
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <View style={styles.header}>
        <Text variant="h2">{report.type}</Text>
        <Badge 
          label={report.status} 
          variant={report.status === 'resolved' ? 'success' : 'warning'}
        />
      </View>
      
      <View style={styles.section}>
        <Text variant="h3">Reason</Text>
        <Text variant="body">{report.reason}</Text>
      </View>
      
      <View style={styles.section}>
        <Text variant="h3">Description</Text>
        <Text variant="body">{report.description}</Text>
      </View>
      
      <View style={styles.section}>
        <Text variant="h3">Details</Text>
        <Text variant="body">Reported by: {report.reportedBy}</Text>
        <Text variant="body">Date: {report.reportedAt}</Text>
      </View>
      
      <Divider />
      
      <View style={styles.actions}>
        <Text variant="h3">Actions</Text>
        <Button
          title="View Reported Content"
          variant="secondary"
          onPress={() => {
            try {
              navigation.navigate('AdminTabs', { screen: 'ContentModeration' });
            } catch (e) {
              Alert.alert('Navigation', 'Open Content Moderation tab to inspect the report target.');
            }
          }}
          style={styles.actionButton}
        />
        <Button
          title="Dismiss Report"
          variant="secondary"
          onPress={() => {
            Alert.alert(
              'Dismiss Report',
              'Are you sure you want to dismiss this report?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Dismiss',
                  onPress: () => {
                    setReport((prev) => ({ ...prev, status: 'resolved' }));
                    Alert.alert('Success', 'Report dismissed.');
                  },
                },
              ]
            );
          }}
          style={styles.actionButton}
        />
        <Button
          title="Remove Content"
          onPress={() => {
            Alert.alert(
              'Remove Content',
              'Are you sure you want to remove this content? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Remove', 
                  style: 'destructive',
                  onPress: () => {
                    setReport((prev) => ({ ...prev, status: 'resolved' }));
                    Alert.alert('Success', 'Content removed and report resolved.');
                  },
                },
              ]
            );
          }}
          style={[styles.actionButton, styles.dangerButton]}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  actions: {
    paddingVertical: 16,
  },
  actionButton: {
    marginTop: 12,
  },
  dangerButton: {
    backgroundColor: '#DC2626',
  },
});

export default ReportDetailScreen;

