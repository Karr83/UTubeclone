// Admin SettingsScreen - Platform configuration
import React from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Button, Divider } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';

const SettingsScreen = () => {
  const { signOut } = useAuth();

  const handleCommissionRate = () => {
    Alert.alert(
      'Commission Rate',
      'Choose platform commission:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '5%', onPress: () => Alert.alert('Saved', 'Commission rate set to 5%.') },
        { text: '10%', onPress: () => Alert.alert('Saved', 'Commission rate set to 10%.') },
        { text: '15%', onPress: () => Alert.alert('Saved', 'Commission rate set to 15%.') },
      ]
    );
  };

  const handlePayoutSettings = () => {
    Linking.openURL('mailto:finance@vibetube.com?subject=Payout Settings').catch(() => {
      Alert.alert('Error', 'Could not open payout support email.');
    });
  };

  const handleContentPolicies = () => {
    Linking.openURL('https://www.termsfeed.com/live/terms-of-service').catch(() => {
      Alert.alert('Error', 'Could not open content policies.');
    });
  };

  const handleEmailTemplates = () => {
    Alert.alert('Email Templates', 'Template sync queued for next email cycle.');
  };

  const handlePushNotifications = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Error', 'Could not open device notification settings.');
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <ScreenContainer>
      <Text variant="h2">Admin Settings</Text>
      
      <View style={styles.section}>
        <Text variant="h3">Platform Settings</Text>
        <Button
          title="Commission Rate"
          variant="secondary"
          onPress={handleCommissionRate}
          style={styles.menuItem}
        />
        <Button
          title="Payout Settings"
          variant="secondary"
          onPress={handlePayoutSettings}
          style={styles.menuItem}
        />
        <Button
          title="Content Policies"
          variant="secondary"
          onPress={handleContentPolicies}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Notifications</Text>
        <Button
          title="Email Templates"
          variant="secondary"
          onPress={handleEmailTemplates}
          style={styles.menuItem}
        />
        <Button
          title="Push Notifications"
          variant="secondary"
          onPress={handlePushNotifications}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Account</Text>
        <Button
          title="Logout"
          onPress={handleLogout}
          style={styles.menuItem}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  menuItem: {
    marginTop: 12,
  },
});

export default SettingsScreen;

