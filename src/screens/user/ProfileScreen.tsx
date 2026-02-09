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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { useMembership } from '../../contexts/MembershipContext';
import { TierBadge, FeatureGate } from '../../components/gates';
import { UserAvatar } from '../../components/user';

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProfileScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const { profile, signOut, loading } = useAuth();
  const { tier, tierConfig, canAccess } = useMembership();
  
  // Local state for dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(true);

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
      'Notification settings will be available soon.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle privacy settings.
   */
  const handlePrivacy = (): void => {
    Alert.alert(
      'Privacy Settings',
      'Privacy settings will be available soon.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle dark mode toggle.
   */
  const handleDarkMode = (): void => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    Alert.alert(
      'Theme Changed',
      `Dark mode is now ${newMode ? 'On' : 'Off'}. Full theme switching will be available in a future update.`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle language settings.
   */
  const handleLanguage = (): void => {
    Alert.alert(
      'Language Settings',
      'Language selection will be available soon.',
      [{ text: 'OK' }]
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
          text: 'View',
          onPress: () => {
            // TODO: Navigate to terms screen or open URL
            Alert.alert('Coming Soon', 'Terms of Service page will be available soon.');
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
          text: 'View',
          onPress: () => {
            // TODO: Navigate to privacy policy screen or open URL
            Alert.alert('Coming Soon', 'Privacy Policy page will be available soon.');
          },
        },
      ]
    );
  };

  /**
   * Handle edit profile.
   */
  const handleEditProfile = (): void => {
    Alert.alert(
      'Edit Profile',
      'Profile editing will be available soon.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle change password.
   */
  const handleChangePassword = (): void => {
    Alert.alert(
      'Change Password',
      'Password change feature will be available soon.',
      [{ text: 'OK' }]
    );
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
});
