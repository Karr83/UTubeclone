/**
 * User Profile Screen
 * 
 * YouTube-style dark theme profile page.
 * Displays user info, membership tier, features, and settings.
 * 
 * SECTIONS:
 * - Profile header (avatar, email, role)
 * - Membership tier info
 * - Feature access list
 * - Settings section
 * - Sign out
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../../contexts/AuthContext';
import { useMembership } from '../../contexts/MembershipContext';
import { TierBadge, FeatureGate } from '../../components/gates';
import { UserAvatar } from '../../components/user';
import { auth, firestore } from '../../config/firebase';

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProfileScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const { profile, signOut, loading } = useAuth();
  const { tier, tierConfig, canAccess } = useMembership();
  
  // Local state for dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(profile?.displayName || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  React.useEffect(() => {
    AsyncStorage.getItem('app_dark_mode')
      .then((value) => {
        if (value !== null) {
          setIsDarkMode(value === 'true');
        }
      })
      .catch(() => {
        // ignore persisted setting errors
      });
  }, []);

  /**
   * Handle sign out with confirmation.
   */
  const handleSignOut = (): void => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  /**
   * Handle notifications settings.
   */
  const handleNotifications = (): void => {
    Alert.alert(
      'Notifications',
      'Push notifications are enabled. You can manage notification preferences in your device settings.',
      [
        { text: 'OK' },
        {
          text: 'Open Settings',
          onPress: () => {
            // On iOS, this opens app settings
            Linking.openSettings();
          },
        },
      ]
    );
  };

  /**
   * Handle privacy settings.
   */
  const handlePrivacy = (): void => {
    Alert.alert(
      'Privacy Settings',
      'Choose a privacy option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Privacy Policy',
          onPress: () => handlePrivacyPolicy(),
        },
        {
          text: 'Manage Data',
          onPress: () => {
            Alert.alert(
              'Data Management',
              'Your data is stored securely in Firebase. To delete your account or export your data, please contact support.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  /**
   * Handle dark mode toggle.
   */
  const handleDarkMode = (): void => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    AsyncStorage.setItem('app_dark_mode', String(newMode)).catch(() => {});
    Alert.alert(
      'Theme Changed',
      `Dark mode preference saved: ${newMode ? 'On' : 'Off'}.`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle language settings.
   */
  const handleLanguage = (): void => {
    Alert.alert(
      'Language Settings',
      'Select your preferred language:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'English',
          onPress: async () => {
            await AsyncStorage.setItem('app_language', 'en');
            Alert.alert('Success', 'Language set to English.');
          },
        },
        {
          text: 'Spanish',
          onPress: async () => {
            await AsyncStorage.setItem('app_language', 'es');
            Alert.alert('Success', 'Idioma establecido en español.');
          },
        },
        {
          text: 'French',
          onPress: async () => {
            await AsyncStorage.setItem('app_language', 'fr');
            Alert.alert('Success', 'Langue définie sur le français.');
          },
        },
      ]
    );
  };

  /**
   * Handle help & support.
   */
  const handleHelpSupport = (): void => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact our support team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => {
            Linking.openURL('mailto:support@vibetube.com?subject=Help Request');
          },
        },
      ]
    );
  };

  /**
   * Handle terms of service.
   */
  const handleTermsOfService = (): void => {
    Alert.alert(
      'Terms of Service',
      'View our terms of service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Online',
          onPress: () => {
            Linking.openURL('https://www.termsfeed.com/live/terms-of-service').catch(() => {
              Alert.alert('Error', 'Could not open Terms of Service. Please check your internet connection.');
            });
          },
        },
      ]
    );
  };

  /**
   * Handle privacy policy.
   */
  const handlePrivacyPolicy = (): void => {
    Alert.alert(
      'Privacy Policy',
      'View our privacy policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Online',
          onPress: () => {
            Linking.openURL('https://www.termsfeed.com/live/privacy-policy').catch(() => {
              Alert.alert('Error', 'Could not open Privacy Policy. Please check your internet connection.');
            });
          },
        },
      ]
    );
  };

  /**
   * Handle edit profile.
   */
  const handleEditProfile = (): void => {
    setDisplayNameInput(profile?.displayName || '');
    setShowEditProfileModal(true);
  };

  const submitEditProfile = async (): Promise<void> => {
    if (!displayNameInput.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }
    if (!auth?.currentUser || !firestore) {
      Alert.alert('Error', 'Firebase not initialized.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile(auth.currentUser, {
        displayName: displayNameInput.trim(),
      });

      if (profile?.uid) {
        await updateDoc(doc(firestore, 'users', profile.uid), {
          displayName: displayNameInput.trim(),
          updatedAt: new Date(),
        });
      }

      setShowEditProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  /**
   * Handle change password.
   */
  const handleChangePassword = (): void => {
    if (!auth?.currentUser) {
      Alert.alert('Error', 'You must be logged in to change your password.');
      return;
    }

    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setShowPasswordModal(true);
  };

  const submitChangePassword = async (): Promise<void> => {
    if (!auth?.currentUser) {
      Alert.alert('Error', 'You must be logged in to change your password.');
      return;
    }
    if (!auth.currentUser.email) {
      Alert.alert('Error', 'This account does not use email/password login.');
      return;
    }
    if (!currentPasswordInput.trim()) {
      Alert.alert('Error', 'Current password is required.');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPasswordInput
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPasswordInput);

      setShowPasswordModal(false);
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <UserAvatar
              name={profile?.displayName || profile?.email}
              size={72}
              variant="large"
              showBorder={true}
            />
            {/* Online indicator */}
            <View style={styles.onlineIndicator} />
          </View>

          <Text style={styles.email}>{profile?.email || 'No email'}</Text>

          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile?.role?.toUpperCase() || 'USER'}
            </Text>
          </View>

          <Text style={styles.memberSince}>
            Member since {profile?.createdAt?.toLocaleDateString() || 'N/A'}
          </Text>
        </View>

        {/* Membership Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Membership</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Membership')}>
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.membershipCard}
            onPress={() => navigation.navigate('Membership')}
            activeOpacity={0.8}
          >
            <View style={styles.tierRow}>
              <TierBadge tier={tier} size="large" />
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>{tierConfig.name}</Text>
                <Text style={styles.tierDesc}>
                  {tier === 'free' ? 'Upgrade for more features' : 'Active subscription'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Features</Text>
          <View style={styles.featuresCard}>
            <FeatureRow 
              icon="⬇️"
              label="Download Content" 
              enabled={canAccess('content_download')} 
            />
            <FeatureRow 
              icon="💬"
              label="Direct Messages" 
              enabled={canAccess('social_direct_messages')} 
            />
            <FeatureRow 
              icon="🚫"
              label="Ad-Free Experience" 
              enabled={canAccess('premium_no_ads')} 
            />
            <FeatureRow 
              icon="⭐"
              label="Premium Content" 
              enabled={canAccess('content_view_premium')} 
            />
          </View>

          {/* Upgrade prompt */}
          {tier === 'free' && (
            <TouchableOpacity 
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('Upgrade')}
            >
              <Text style={styles.upgradeBtnText}>⭐ Upgrade to unlock more</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingsRow icon="🔔" label="Notifications" onPress={handleNotifications} />
            <SettingsRow icon="🔒" label="Privacy" onPress={handlePrivacy} />
            <SettingsRow 
              icon="🌙" 
              label="Dark Mode" 
              value={isDarkMode ? 'On' : 'Off'} 
              onPress={handleDarkMode} 
            />
            <SettingsRow icon="🌐" label="Language" value="English" onPress={handleLanguage} />
            <SettingsRow icon="❓" label="Help & Support" onPress={handleHelpSupport} />
            <SettingsRow icon="📜" label="Terms of Service" onPress={handleTermsOfService} />
            <SettingsRow icon="🛡️" label="Privacy Policy" onPress={handlePrivacyPolicy} />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <SettingsRow 
              icon="✏️" 
              label="Edit Profile" 
              onPress={handleEditProfile} 
            />
            <SettingsRow 
              icon="🔑" 
              label="Change Password" 
              onPress={handleChangePassword} 
            />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={loading}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={showEditProfileModal}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
              placeholder="Enter display name"
              placeholderTextColor="#8A8A8A"
              editable={!isSavingProfile}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setShowEditProfileModal(false)}
                disabled={isSavingProfile}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={submitEditProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={showPasswordModal}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              value={currentPasswordInput}
              onChangeText={setCurrentPasswordInput}
              placeholder="Current password"
              placeholderTextColor="#8A8A8A"
              secureTextEntry
              editable={!isChangingPassword}
            />
            <TextInput
              style={styles.modalInput}
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
              placeholder="New password"
              placeholderTextColor="#8A8A8A"
              secureTextEntry
              editable={!isChangingPassword}
            />
            <TextInput
              style={styles.modalInput}
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              placeholder="Confirm new password"
              placeholderTextColor="#8A8A8A"
              secureTextEntry
              editable={!isChangingPassword}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setShowPasswordModal(false)}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={submitChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FeatureRowProps {
  icon: string;
  label: string;
  enabled: boolean;
}

function FeatureRow({ icon, label, enabled }: FeatureRowProps): JSX.Element {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureLabel, !enabled && styles.featureLabelDisabled]}>
        {label}
      </Text>
      <View style={[styles.featureStatus, enabled ? styles.featureOn : styles.featureOff]}>
        <Text style={styles.featureStatusText}>{enabled ? '✓' : '✗'}</Text>
      </View>
    </View>
  );
}

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
}

function SettingsRow({ icon, label, value, onPress }: SettingsRowProps): JSX.Element {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={styles.settingsLabel}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      <Text style={styles.settingsChevron}>›</Text>
    </TouchableOpacity>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 24,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#272727',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  memberSince: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Section
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 14,
    color: '#3ea6ff',
    fontWeight: '500',
  },

  // Membership Card
  membershipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tierDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#6B7280',
  },

  // Features Card
  featuresCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  featureLabelDisabled: {
    color: '#6B7280',
  },
  featureStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureOn: {
    backgroundColor: '#166534',
  },
  featureOff: {
    backgroundColor: '#7f1d1d',
  },
  featureStatusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  // Upgrade Button
  upgradeBtn: {
    backgroundColor: '#272727',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fbbf24',
  },

  // Settings Card
  settingsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
  },
  settingsIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  settingsValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  settingsChevron: {
    fontSize: 20,
    color: '#6B7280',
  },

  // Sign Out
  signOutBtn: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fca5a5',
  },

  // Version
  versionText: {
    textAlign: 'center',
    color: '#4B5563',
    fontSize: 12,
    marginTop: 20,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  modalBtn: {
    minWidth: 92,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: '#ef4444',
  },
  modalBtnSecondary: {
    backgroundColor: '#272727',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
