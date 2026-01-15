/**
 * Admin Navigator
 * 
 * Navigation stack for authenticated users with 'admin' role.
 * Provides access to moderation and management screens.
 * 
 * SCREENS:
 * - Dashboard: Overview stats and quick actions
 * - ContentModeration: Review and moderate content
 * - UserManagement: Manage users (suspend/unsuspend)
 * 
 * ACCESS CONTROL:
 * - Only accessible to users with role='admin'
 * - Role verified at RootNavigator level
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';

// Import admin screens
import {
  DashboardScreen,
  ContentModerationScreen,
  UserManagementScreen,
} from '../../screens/admin';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type AdminStackParamList = {
  AdminTabs: undefined;
  ContentDetail: { contentId: string };
  UserDetail: { userId: string };
};

export type AdminTabParamList = {
  Dashboard: undefined;
  ContentModeration: undefined;
  UserManagement: undefined;
  Settings: undefined;
};

// =============================================================================
// SETTINGS SCREEN (Placeholder with Sign Out)
// =============================================================================

function AdminSettingsScreen(): JSX.Element {
  const { signOut, profile } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Settings</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Logged in as</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ADMIN</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
// TAB NAVIGATOR
// =============================================================================

const Tab = createBottomTabNavigator<AdminTabParamList>();

function AdminTabs(): JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ContentModeration"
        component={ContentModerationScreen}
        options={{
          tabBarLabel: 'Content',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// =============================================================================
// STACK NAVIGATOR
// =============================================================================

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator(): JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      {/* Add detail screens here when implemented:
      <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      */}
    </Stack.Navigator>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#DC2626',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    width: '100%',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
