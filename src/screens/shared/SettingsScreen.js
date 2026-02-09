// SettingsScreen - User/Creator settings
import React from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Button, Divider } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { signOut } = useAuth();

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleEmailPreferences = () => {
    Alert.alert(
      'Email Preferences',
      'Email preferences will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Privacy Settings',
      'Privacy settings will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleBlockedUsers = () => {
    Alert.alert(
      'Blocked Users',
      'Blocked users management will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'Help Center',
      'Help center will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@vibetube.com?subject=Support Request');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will happen automatically via RootNavigator
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

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
          onPress={handleEditProfile}
          style={styles.menuItem}
        />
        <Button
          title="Change Password"
          variant="secondary"
          onPress={handleChangePassword}
          style={styles.menuItem}
        />
        <Button
          title="Email Preferences"
          variant="secondary"
          onPress={handleEmailPreferences}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Privacy</Text>
        <Button
          title="Privacy Settings"
          variant="secondary"
          onPress={handlePrivacySettings}
          style={styles.menuItem}
        />
        <Button
          title="Blocked Users"
          variant="secondary"
          onPress={handleBlockedUsers}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <View style={styles.section}>
        <Text variant="h3">Support</Text>
        <Button
          title="Help Center"
          variant="secondary"
          onPress={handleHelpCenter}
          style={styles.menuItem}
        />
        <Button
          title="Contact Support"
          variant="secondary"
          onPress={handleContactSupport}
          style={styles.menuItem}
        />
      </View>
      
      <Divider />
      
      <Button
        title="Log Out"
        onPress={handleLogout}
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

