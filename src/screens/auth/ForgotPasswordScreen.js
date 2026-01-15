// ForgotPasswordScreen - Password recovery
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/layouts';
import { Text, Button } from '../../components/common';
import { Input } from '../../components/forms';

const ForgotPasswordScreen = ({ navigation }) => {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text variant="h1" style={styles.title}>Reset Password</Text>
        <Text variant="caption" style={styles.subtitle}>
          Enter your email to receive a reset link
        </Text>
        
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <Button
            title="Send Reset Link"
            onPress={() => {
              // TODO: Implement password reset
            }}
          />
        </View>
        
        <Button
          title="Back to Login"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
});

export default ForgotPasswordScreen;

