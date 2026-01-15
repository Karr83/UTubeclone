// SettingsScreen - User/Creator settings
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Button, Divider } from '../../components/common';

const SettingsScreen = ({ navigation }) => {
  return (
    <ScreenContainer>
      <Header
        title="Settings"
        leftAction="←"
        onLeftPress={() => navigation.goBack()}
      />
      
      <View style={styles.section}>
        <Text variant="h3">Account</Text>
        <Button
          title="Edit Profile"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to edit profile
          }}
          style={styles.menuItem}
        />
        <Button
          title="Change Password"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to change password
          }}
          style={styles.menuItem}
        />
        <Button
          title="Email Preferences"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to email settings
          }}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Privacy</Text>
        <Button
          title="Privacy Settings"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to privacy settings
          }}
          style={styles.menuItem}
        />
        <Button
          title="Blocked Users"
          variant="secondary"
          onPress={() => {
            // TODO: Navigate to blocked users
          }}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Support</Text>
        <Button
          title="Help Center"
          variant="secondary"
          onPress={() => {
            // TODO: Open help center
          }}
          style={styles.menuItem}
        />
        <Button
          title="Contact Support"
          variant="secondary"
          onPress={() => {
            // TODO: Open support contact
          }}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <Button
        title="Log Out"
        onPress={() => {
          // TODO: Implement logout
        }}
        style={styles.logoutButton}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  menuItem: {
    marginTop: 12,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#DC2626',
  },
});

export default SettingsScreen;

