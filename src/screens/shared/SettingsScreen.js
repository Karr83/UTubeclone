// SettingsScreen - User/Creator settings
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { ScreenContainer, Header } from '../../components/layouts';
import { Text, Button, Divider } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const { signOut } = useAuth();
  const [emailPrefs, setEmailPrefs] = useState('all');

  useEffect(() => {
    AsyncStorage.getItem('legacy_email_prefs')
      .then((value) => {
        if (value) {
          setEmailPrefs(value);
        }
      })
      .catch(() => {});
  }, []);

  const handleEditProfile = () => {
    if (navigation?.navigate) {
      navigation.navigate('ProfileMain');
      return;
    }
    Alert.alert('Profile', 'Open your Profile tab to edit account details.');
  };

  const handleChangePassword = () => {
    if (navigation?.navigate) {
      navigation.navigate('ProfileMain');
      return;
    }
    Alert.alert('Password', 'Open Profile tab and tap Change Password.');
  };

  const handleEmailPreferences = () => {
    Alert.alert(
      'Email Preferences',
      'Choose what emails you want to receive:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'All',
          onPress: async () => {
            await AsyncStorage.setItem('legacy_email_prefs', 'all');
            setEmailPrefs('all');
          },
        },
        {
          text: 'Important Only',
          onPress: async () => {
            await AsyncStorage.setItem('legacy_email_prefs', 'important');
            setEmailPrefs('important');
          },
        },
        {
          text: 'None',
          onPress: async () => {
            await AsyncStorage.setItem('legacy_email_prefs', 'none');
            setEmailPrefs('none');
          },
        },
      ]
    );
  };

  const handlePrivacySettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Error', 'Could not open device settings.');
    });
  };

  const handleBlockedUsers = () => {
    Alert.alert('Blocked Users', 'You currently have no blocked users.');
  };

  const handleHelpCenter = () => {
    Linking.openURL('https://support.google.com/').catch(() => {
      Alert.alert('Error', 'Could not open help center.');
    });
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
        <Text variant="caption" style={styles.helperText}>
          Current: {emailPrefs === 'all' ? 'All emails' : emailPrefs === 'important' ? 'Important only' : 'None'}
        </Text>
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
  helperText: {
    marginTop: 8,
    opacity: 0.7,
  },
});

export default SettingsScreen;

