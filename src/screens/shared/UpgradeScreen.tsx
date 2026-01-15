/**
 * Upgrade Screen
 * 
 * YouTube-style dark theme upgrade/checkout page.
 * Displays available membership tiers with Stripe payment integration.
 * 
 * PAYMENT FLOW:
 * 1. User views available tiers
 * 2. User selects tier and billing interval
 * 3. App calls Cloud Function to create Stripe Checkout Session
 * 4. Stripe Checkout page opens in browser
 * 5. User completes payment on Stripe
 * 6. Stripe webhook updates Firestore
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { useMembership } from '../../contexts/MembershipContext';
import { MembershipTier } from '../../types/membership';
import {
  BillingInterval,
  PricingConfig,
} from '../../types/payment';
import {
  getPricingConfig,
  formatPrice,
  openCheckout,
  openCustomerPortal,
  DEFAULT_PRICING,
} from '../../services/payment.service';

// =============================================================================
// TIER DISPLAY DATA
// =============================================================================

interface TierDisplayInfo {
  name: string;
  description: string;
  features: string[];
  recommended?: boolean;
  color: string;
}

const TIER_INFO: Record<MembershipTier, TierDisplayInfo> = {
  free: {
    name: 'Free',
    description: 'Get started with basic features',
    color: '#6B7280',
    features: [
      'View public content',
      'Limited content access',
      'Basic support',
    ],
  },
  basic: {
    name: 'Basic',
    description: 'Perfect for casual users',
    color: '#3b82f6',
    features: [
      'All free features',
      'Members-only content',
      'Upload images',
      'Basic boost (1 per month)',
      'Priority support',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For serious creators',
    recommended: true,
    color: '#8b5cf6',
    features: [
      'All basic features',
      'Unlimited video uploads',
      'Advanced boost (3 per month)',
      'Higher visibility',
      'Premium support',
      'Analytics (coming soon)',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For teams and businesses',
    color: '#f59e0b',
    features: [
      'All pro features',
      'Unlimited boosts',
      'Team management',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function UpgradeScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { currentTier } = useMembership();

  // State
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load pricing configuration
  const loadPricing = useCallback(async () => {
    try {
      const config = await getPricingConfig();
      setPricing(config);
    } catch (error) {
      console.error('[UpgradeScreen] Failed to load pricing:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  // Handle tier selection / upgrade
  const handleSelectTier = async (tier: MembershipTier) => {
    if (tier === currentTier || tier === 'free') return;

    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to upgrade your membership.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await openCheckout(tier, selectedInterval);
      if (!result.success && result.error) {
        Alert.alert('Upgrade Failed', result.error);
      }
      await loadPricing();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start upgrade process.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manage subscription
  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const result = await openCustomerPortal();
      if (!result.success && result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open subscription manager.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get price for a tier
  const getTierPriceDisplay = (tier: MembershipTier): string => {
    const tierPrice = pricing.tiers[tier];
    if (!tierPrice) return 'Free';

    const price = selectedInterval === 'year'
      ? tierPrice.yearlyPriceCents
      : tierPrice.monthlyPriceCents;

    return formatPrice(price, tierPrice.currency);
  };

  // Check tier status
  const isCurrentTier = (tier: MembershipTier) => tier === currentTier;
  const isUpgrade = (tier: MembershipTier) => {
    const order: MembershipTier[] = ['free', 'basic', 'pro', 'enterprise'];
    return order.indexOf(tier) > order.indexOf(currentTier);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff0000" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPricing();
            }}
            tintColor="#ff0000"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Unlock Premium Features</Text>
          <Text style={styles.heroSubtitle}>
            Choose the plan that's right for you
          </Text>
        </View>

        {/* Current Plan Chip */}
        <View style={styles.currentPlanChip}>
          <Text style={styles.currentPlanLabel}>Current:</Text>
          <Text style={styles.currentPlanValue}>{TIER_INFO[currentTier].name}</Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[styles.toggleBtn, selectedInterval === 'month' && styles.toggleBtnActive]}
            onPress={() => setSelectedInterval('month')}
          >
            <Text style={[styles.toggleText, selectedInterval === 'month' && styles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, selectedInterval === 'year' && styles.toggleBtnActive]}
            onPress={() => setSelectedInterval('year')}
          >
            <Text style={[styles.toggleText, selectedInterval === 'year' && styles.toggleTextActive]}>
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>-17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tier Cards */}
        {(['free', 'basic', 'pro', 'enterprise'] as MembershipTier[]).map((tier) => {
          const info = TIER_INFO[tier];
          const isCurrent = isCurrentTier(tier);
          const canUpgrade = isUpgrade(tier);

          return (
            <View
              key={tier}
              style={[
                styles.tierCard,
                isCurrent && styles.tierCardCurrent,
                info.recommended && styles.tierCardRecommended,
              ]}
            >
              {/* Recommended Badge */}
              {info.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>⭐ BEST VALUE</Text>
                </View>
              )}

              {/* Header */}
              <View style={styles.tierHeader}>
                <View>
                  <Text style={[styles.tierName, { color: info.color }]}>{info.name}</Text>
                  <Text style={styles.tierDesc}>{info.description}</Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.tierPrice}>{getTierPriceDisplay(tier)}</Text>
                  {tier !== 'free' && (
                    <Text style={styles.tierInterval}>
                      /{selectedInterval === 'year' ? 'year' : 'mo'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Features */}
              <View style={styles.featuresList}>
                {info.features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              {isCurrent ? (
                <View style={styles.currentBtn}>
                  <Text style={styles.currentBtnText}>Current Plan</Text>
                </View>
              ) : canUpgrade ? (
                <TouchableOpacity
                  style={[
                    styles.upgradeBtn,
                    { backgroundColor: info.color },
                    isProcessing && styles.btnDisabled,
                  ]}
                  onPress={() => handleSelectTier(tier)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.upgradeBtnText}>
                      Upgrade to {info.name}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.downgradeBtn}>
                  <Text style={styles.downgradeBtnText}>Contact support</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Manage Subscription */}
        {currentTier !== 'free' && (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={handleManageSubscription}
            disabled={isProcessing}
          >
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
        )}

        {/* Trial Info */}
        {pricing.trialEnabled && currentTier === 'free' && (
          <View style={styles.trialBanner}>
            <Text style={styles.trialText}>
              🎉 All paid plans include a {pricing.trialDays}-day free trial!
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🔒 Secure payments by Stripe</Text>
          <Text style={styles.footerSub}>Cancel anytime • No hidden fees</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
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

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Current Plan Chip
  currentPlanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  currentPlanLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 6,
  },
  currentPlanValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3ea6ff',
  },

  // Toggle
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#272727',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  saveBadge: {
    backgroundColor: '#166534',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
  },

  // Tier Card
  tierCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#272727',
  },
  tierCardCurrent: {
    borderColor: '#3ea6ff',
  },
  tierCardRecommended: {
    borderColor: '#8b5cf6',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  tierDesc: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  tierPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  tierInterval: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Features
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    fontSize: 13,
    color: '#22c55e',
    marginRight: 10,
    width: 16,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  currentBtn: {
    backgroundColor: '#272727',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  currentBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  downgradeBtn: {
    backgroundColor: '#1f1f1f',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  downgradeBtnText: {
    fontSize: 14,
    color: '#4B5563',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Manage Button
  manageBtn: {
    borderWidth: 1,
    borderColor: '#3ea6ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  manageBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3ea6ff',
  },

  // Trial Banner
  trialBanner: {
    backgroundColor: '#422006',
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  trialText: {
    fontSize: 14,
    color: '#fbbf24',
    textAlign: 'center',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerSub: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
  },
});
