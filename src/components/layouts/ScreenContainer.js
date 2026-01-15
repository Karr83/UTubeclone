// ScreenContainer Component - Safe area wrapper for screens
import React from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet, StatusBar } from 'react-native';

const ScreenContainer = ({
  children,
  scrollable = true,
  padded = true,
  backgroundColor = '#F9FAFB',
  style,
  contentStyle,
}) => {
  const Container = scrollable ? ScrollView : View;
  
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <Container
        style={[styles.container, style]}
        contentContainerStyle={[
          scrollable && styles.scrollContent,
          padded && styles.padded,
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    padding: 16,
  },
});

export default ScreenContainer;

