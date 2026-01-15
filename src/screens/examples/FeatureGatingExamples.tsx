/**
 * Feature Gating Examples Screen
 * 
 * This screen demonstrates all the different ways to implement
 * feature gating in the application. Use this as a reference
 * for implementing access control in other screens.
 * 
 * EXAMPLES INCLUDED:
 * 1. Using canAccess() hook directly
 * 2. Using FeatureGate component
 * 3. Using TierGate component
 * 4. Using UpgradePrompt fallback
 * 5. Using LockedOverlay for preview content
 * 6. Creator-specific features (role + tier)
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { useMembership } from '../../contexts/MembershipContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FeatureGate, 
  TierGate, 
  UpgradePrompt, 
  LockedOverlay,
  TierBadge,
} from '../../components/gates';

// =============================================================================
// COMPONENT
// =============================================================================

export default function FeatureGatingExamples(): JSX.Element {
  const { tier, canAccess, hasMinTier } = useMembership();
  const { profile } = useAuth();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Feature Gating Examples</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Your Tier:</Text>
          <TierBadge tier={tier} size="medium" />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Your Role:</Text>
          <Text style={styles.infoValue}>{profile?.role || 'Not logged in'}</Text>
        </View>
      </View>

      {/* Example 1: Using canAccess() hook directly */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Using canAccess() Hook</Text>
        <Text style={styles.sectionDescription}>
          Check feature access in component logic and conditionally render.
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`const { canAccess } = useMembership();

if (canAccess('content_download')) {
  return <DownloadButton />;
}`}
          </Text>
        </View>
        <View style={styles.demoBox}>
          {canAccess('content_download') ? (
            <TouchableOpacity style={styles.enabledButton}>
              <Text style={styles.enabledButtonText}>📥 Download Content</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>📥 Download (Upgrade Required)</Text>
            </View>
          )}
        </View>
      </View>

      {/* Example 2: Using FeatureGate component */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Using FeatureGate Component</Text>
        <Text style={styles.sectionDescription}>
          Declaratively wrap content that requires a specific feature.
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`<FeatureGate feature="social_direct_messages">
  <DMButton />
</FeatureGate>`}
          </Text>
        </View>
        <View style={styles.demoBox}>
          <FeatureGate feature="social_direct_messages">
            <TouchableOpacity style={styles.enabledButton}>
              <Text style={styles.enabledButtonText}>💬 Send Direct Message</Text>
            </TouchableOpacity>
          </FeatureGate>
          <FeatureGate 
            feature="social_direct_messages"
            fallback={
              <View style={styles.disabledButton}>
                <Text style={styles.disabledButtonText}>💬 DMs (Basic tier required)</Text>
              </View>
            }
          >
            {null}
          </FeatureGate>
        </View>
      </View>

      {/* Example 3: Using TierGate component */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Using TierGate Component</Text>
        <Text style={styles.sectionDescription}>
          Gate content by minimum tier level (not specific feature).
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`<TierGate minTier="pro">
  <ExclusiveContent />
</TierGate>`}
          </Text>
        </View>
        <View style={styles.demoBox}>
          <TierGate minTier="pro">
            <View style={styles.exclusiveContent}>
              <Text style={styles.exclusiveEmoji}>👑</Text>
              <Text style={styles.exclusiveText}>
                Pro Exclusive Content!
              </Text>
            </View>
          </TierGate>
          <TierGate 
            minTier="pro"
            fallback={
              <View style={styles.lockedContent}>
                <Text style={styles.lockedEmoji}>🔒</Text>
                <Text style={styles.lockedText}>
                  Pro tier required to view this
                </Text>
              </View>
            }
          >
            {null}
          </TierGate>
        </View>
      </View>

      {/* Example 4: Using UpgradePrompt fallback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Using UpgradePrompt Fallback</Text>
        <Text style={styles.sectionDescription}>
          Show an upgrade prompt when feature isn't available.
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`<FeatureGate 
  feature="premium_no_ads"
  fallback={
    <UpgradePrompt requiredTier="basic" />
  }
>
  <AdFreeExperience />
</FeatureGate>`}
          </Text>
        </View>
        <View style={styles.demoBox}>
          <FeatureGate 
            feature="premium_no_ads"
            fallback={
              <UpgradePrompt 
                requiredTier="basic"
                message="Go ad-free with Basic tier"
                onUpgrade={() => Alert.alert('Navigate to upgrade screen')}
              />
            }
          >
            <View style={styles.adFreeContent}>
              <Text style={styles.adFreeEmoji}>🎉</Text>
              <Text style={styles.adFreeText}>
                You're enjoying an ad-free experience!
              </Text>
            </View>
          </FeatureGate>
        </View>
      </View>

      {/* Example 5: Using LockedOverlay */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Using LockedOverlay</Text>
        <Text style={styles.sectionDescription}>
          Show a preview with a lock overlay for premium content.
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`<LockedOverlay 
  requiredTier="pro"
  onUnlock={showUpgradeModal}
>
  <PremiumVideo />
</LockedOverlay>`}
          </Text>
        </View>
        <View style={styles.demoBox}>
          <LockedOverlay 
            requiredTier="pro"
            onUnlock={() => Alert.alert('Show upgrade modal')}
          >
            <View style={styles.videoPreview}>
              <Text style={styles.videoIcon}>🎬</Text>
              <Text style={styles.videoTitle}>Premium Tutorial</Text>
              <Text style={styles.videoDuration}>45:00</Text>
            </View>
          </LockedOverlay>
        </View>
      </View>

      {/* Example 6: Creator-specific features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Creator Features (Role + Tier)</Text>
        <Text style={styles.sectionDescription}>
          Some features require both creator role AND tier level.
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>
            {`// creator_ features check both role and tier
if (canAccess('creator_boost_content')) {
  showBoostButton();
}`}
          </Text>
        </View>
        <View style={styles.demoBox}>
          {profile?.role === 'creator' ? (
            <>
              <Text style={styles.demoLabel}>Creator Features:</Text>
              <FeatureGate feature="creator_upload_content">
                <Text style={styles.featureEnabled}>✓ Upload Content</Text>
              </FeatureGate>
              <FeatureGate 
                feature="creator_upload_video"
                fallback={<Text style={styles.featureDisabled}>✗ Upload Video (Basic+)</Text>}
              >
                <Text style={styles.featureEnabled}>✓ Upload Video</Text>
              </FeatureGate>
              <FeatureGate 
                feature="creator_boost_content"
                fallback={<Text style={styles.featureDisabled}>✗ Boost Content (Basic+)</Text>}
              >
                <Text style={styles.featureEnabled}>✓ Boost Content</Text>
              </FeatureGate>
              <FeatureGate 
                feature="creator_analytics_advanced"
                fallback={<Text style={styles.featureDisabled}>✗ Advanced Analytics (Pro)</Text>}
              >
                <Text style={styles.featureEnabled}>✓ Advanced Analytics</Text>
              </FeatureGate>
            </>
          ) : (
            <Text style={styles.notCreator}>
              👤 You're logged in as a user.{'\n'}
              Creator features are only for creator accounts.
            </Text>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          These examples demonstrate the different approaches to feature gating.
          Choose the method that best fits your UI requirements.
        </Text>
      </View>
    </ScrollView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  // Section
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#E5E7EB',
    lineHeight: 18,
  },
  demoBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
  },
  demoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  // Buttons
  enabledButton: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  enabledButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },

  // Exclusive Content
  exclusiveContent: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  exclusiveEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  exclusiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  lockedContent: {
    backgroundColor: '#E5E7EB',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  lockedEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Ad-free
  adFreeContent: {
    backgroundColor: '#D1FAE5',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  adFreeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  adFreeText: {
    fontSize: 14,
    color: '#065F46',
    textAlign: 'center',
  },

  // Video Preview
  videoPreview: {
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Feature List
  featureEnabled: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 8,
  },
  featureDisabled: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  notCreator: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Footer
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

