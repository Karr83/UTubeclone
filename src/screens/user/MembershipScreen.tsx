/**
 * Membership Screen
 * 
 * YouTube-style dark theme membership management page.
 * Shows current tier, feature access, and all available plans.
 * 
 * SECTIONS:
 * - Current tier display
 * - Feature access list
 * - All plans comparison
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useMembership } from '../../contexts/MembershipContext';
import { TierBadge } from '../../components/gates';
import { getAllTiers, getYearlySavingsPercent } from '../../constants/membership';
import { MembershipTier, TierConfig } from '../../types/membership';
import { AppButton } from '../../components/ui';

// =============================================================================
// COMPONENT
// =============================================================================

export default function MembershipScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const { tier, tierConfig, canAccess, hasMinTier, upgradeTier } = useMembership();

  /**
   * Handle upgrade button press.
   */
  const handleUpgrade = (targetTier: MembershipTier) => {
    navigation.navigate('Upgrade');
  };

  /**
   * Render a single tier card.
   */
  const renderTierCard = (config: TierConfig) => {
    const isCurrentTier = config.id === tier;
    const isLowerTier = config.level < tierConfig.level;
    const yearlySavings = getYearlySavingsPercent(config.id);

    return (
      <View 
        key={config.id}
        style={[
          styles.tierCard,
          isCurrentTier && styles.tierCardCurrent,
        ]}
      >
        {/* Current Badge */}
        {isCurrentTier && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
        )}

        {/* Tier Header */}
        <View style={styles.tierHeader}>
          <Text style={[styles.tierName, { color: config.badgeColor }]}>
            {config.name}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.tierDescription}>{config.description}</Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>
            {config.priceMonthly === 0 ? 'Free' : `$${config.priceMonthly}`}
          </Text>
          {config.priceMonthly > 0 && (
            <Text style={styles.pricePeriod}>/month</Text>
          )}
        </View>

        {config.priceYearly > 0 && yearlySavings > 0 && (
          <Text style={styles.yearlyPrice}>
            ${config.priceYearly}/year • Save {yearlySavings}%
          </Text>
        )}

        {/* Feature Highlights */}
        <View style={styles.features}>
          {config.highlights.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Action Button */}
        {isCurrentTier ? (
          <View style={styles.currentPlanBtn}>
            <Text style={styles.currentPlanText}>Your Current Plan</Text>
          </View>
        ) : isLowerTier ? (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>Lower Tier</Text>
          </View>
        ) : (
          <AppButton
            label={`Upgrade to ${config.name}`}
            onPress={() => handleUpgrade(config.id)}
            variant="primary"
            backgroundColor={config.badgeColor}
            textColor="#FFFFFF"
            fullWidth
            style={styles.upgradeBtnContainer}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Membership</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Current Tier Card */}
        <View style={styles.currentTierCard}>
          <Text style={styles.currentLabel}>Your Plan</Text>
          <View style={styles.currentTierRow}>
            <TierBadge tier={tier} size="large" />
            <View style={styles.currentTierInfo}>
              <Text style={styles.currentTierName}>{tierConfig.name}</Text>
              <Text style={styles.currentTierPrice}>
                {tierConfig.priceMonthly === 0 ? 'Free forever' : `$${tierConfig.priceMonthly}/month`}
              </Text>
            </View>
          </View>
        </View>

        {/* Feature Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          <View style={styles.featuresCard}>
            <FeatureAccessRow 
              feature="Content Download" 
              hasAccess={canAccess('content_download')} 
            />
            <FeatureAccessRow 
              feature="Direct Messages" 
              hasAccess={canAccess('social_direct_messages')} 
            />
            <FeatureAccessRow 
              feature="Ad-Free Experience" 
              hasAccess={canAccess('premium_no_ads')} 
            />
            <FeatureAccessRow 
              feature="Premium Content" 
              hasAccess={canAccess('content_view_premium')} 
            />
            <FeatureAccessRow 
              feature="Priority Support" 
              hasAccess={canAccess('premium_priority_support')} 
            />
          </View>
        </View>

        {/* All Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Plans</Text>
          {getAllTiers().map(renderTierCard)}
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Secure payments powered by Stripe
          </Text>
          <Text style={styles.footerSubtext}>
            Cancel anytime • No hidden fees
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface FeatureAccessRowProps {
  feature: string;
  hasAccess: boolean;
}

function FeatureAccessRow({ feature, hasAccess }: FeatureAccessRowProps): JSX.Element {
  return (
    <View style={styles.accessRow}>
      <View style={[styles.accessIndicator, hasAccess ? styles.accessYes : styles.accessNo]}>
        <Text style={styles.accessIcon}>{hasAccess ? '✓' : '✗'}</Text>
      </View>
      <Text style={[styles.accessLabel, !hasAccess && styles.accessLabelDisabled]}>
        {feature}
      </Text>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    fontSize: 24,
    color: '#fff',
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // Current Tier Card
  currentTierCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  currentTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTierInfo: {
    marginLeft: 16,
  },
  currentTierName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  currentTierPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },

  // Features Card
  featuresCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#272727',
  },
  accessIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accessYes: {
    backgroundColor: '#166534',
  },
  accessNo: {
    backgroundColor: '#7f1d1d',
  },
  accessIcon: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  accessLabel: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
  },
  accessLabelDisabled: {
    color: '#6B7280',
  },

  // Tier Cards
  tierCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#272727',
  },
  tierCardCurrent: {
    borderColor: '#3ea6ff',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#3ea6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tierHeader: {
    marginBottom: 8,
  },
  tierName: {
    fontSize: 22,
    fontWeight: '800',
  },
  tierDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  yearlyPrice: {
    fontSize: 13,
    color: '#22c55e',
    marginTop: 4,
  },
  features: {
    marginTop: 20,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureCheck: {
    fontSize: 14,
    color: '#22c55e',
    marginRight: 10,
    width: 18,
  },
  featureText: {
    fontSize: 14,
    color: '#E5E7EB',
    flex: 1,
  },

  // Buttons
  upgradeBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  upgradeBtnContainer: {
    marginTop: 12,
  },
  currentPlanBtn: {
    backgroundColor: '#272727',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  currentPlanText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#1f1f1f',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledBtnText: {
    color: '#4B5563',
    fontSize: 15,
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },
});
