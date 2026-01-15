// SubscriptionCard Component - Display subscription plan
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../common/Text';
import Badge from '../common/Badge';
import Button from '../common/Button';

const SubscriptionCard = ({
  name,
  price,
  period = 'month',
  features = [],
  isPopular = false,
  isCurrentPlan = false,
  onSubscribe,
  style,
}) => {
  return (
    <View style={[styles.card, isPopular && styles.popularCard, style]}>
      {isPopular && (
        <Badge label="Most Popular" variant="primary" style={styles.popularBadge} />
      )}
      <Text variant="h2">{name}</Text>
      <View style={styles.priceContainer}>
        <Text variant="h1" style={styles.price}>${price}</Text>
        <Text variant="caption">/{period}</Text>
      </View>
      <View style={styles.features}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text variant="body" style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <Button
        title={isCurrentPlan ? 'Current Plan' : 'Subscribe'}
        variant={isCurrentPlan ? 'secondary' : 'primary'}
        disabled={isCurrentPlan}
        onPress={onSubscribe}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularCard: {
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  price: {
    color: '#6366F1',
  },
  features: {
    marginTop: 24,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    color: '#10B981',
    fontWeight: 'bold',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  button: {
    width: '100%',
  },
});

export default SubscriptionCard;

