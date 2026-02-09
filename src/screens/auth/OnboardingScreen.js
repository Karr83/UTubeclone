// OnboardingScreen - Welcome/intro slides for new users
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Button } from '../../components/common';

const OnboardingScreen = ({ navigation }) => {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text variant="h1" style={styles.title}>VibeTube</Text>
          <Text variant="body" style={styles.description}>
            Discover exclusive content from your favorite creators
          </Text>
        </View>
        
        <View style={styles.buttons}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Register')}
          />
          <Button
            title="I have an account"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  buttons: {
    paddingBottom: 32,
  },
  secondaryButton: {
    marginTop: 12,
  },
});

export default OnboardingScreen;

