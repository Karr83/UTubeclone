// Admin SettingsScreen - Platform configuration
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Button, Divider } from '../../components/common';

const SettingsScreen = () => {
  return (
    <ScreenContainer>
      <Text variant="h2">Admin Settings</Text>
      
      <View style={styles.section}>
        <Text variant="h3">Platform Settings</Text>
        <Button
          title="Commission Rate"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to commission settings
          }}
          style={styles.menuItem}
        />
        <Button
          title="Payout Settings"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to payout settings
          }}
          style={styles.menuItem}
        />
        <Button
          title="Content Policies"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to content policies
          }}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Notifications</Text>
        <Button
          title="Email Templates"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to email templates
          }}
          style={styles.menuItem}
        />
        <Button
          title="Push Notifications"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to push settings
          }}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Account</Text>
        <Button
          title="Logout"
          onPress={() => {
            // TODO: Implement logout
          }}
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

