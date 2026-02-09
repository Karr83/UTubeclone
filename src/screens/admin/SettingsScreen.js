// Admin SettingsScreen - Platform configuration
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Button, Divider } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';

const SettingsScreen = () => {
  const { signOut } = useAuth();

  const handleCommissionRate = () => {
    Alert.alert('Commission Rate', 'Commission rate settings will be available soon.', [{ text: 'OK' }]);
  };

  const handlePayoutSettings = () => {
    Alert.alert('Payout Settings', 'Payout settings will be available soon.', [{ text: 'OK' }]);
  };

  const handleContentPolicies = () => {
    Alert.alert('Content Policies', 'Content policy management will be available soon.', [{ text: 'OK' }]);
  };

  const handleEmailTemplates = () => {
    Alert.alert('Email Templates', 'Email template management will be available soon.', [{ text: 'OK' }]);
  };

  const handlePushNotifications = () => {
    Alert.alert('Push Notifications', 'Push notification settings will be available soon.', [{ text: 'OK' }]);
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

