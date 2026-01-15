/**
 * Creator Navigator
 * 
 * Navigation stack for authenticated users with 'creator' role.
 * Provides bottom tab navigation with nested stacks for each tab.
 * 
 * STRUCTURE:
 * - Dashboard Tab → Overview, quick actions
 * - Content Tab → Upload, manage content, boost
 * - Stream Tab → Live streaming, recordings management
 * - Profile Tab → Profile settings, earnings
 * 
 * NESTED NAVIGATION:
 * Each tab has its own stack navigator to support screen-to-screen navigation
 * while maintaining tab bar visibility.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

// =============================================================================
// SCREEN IMPORTS
// =============================================================================

// Creator screens
import {
  DashboardScreen,
  UploadScreen,
  ContentManageScreen,
  StreamDashboardScreen,
  RecordingsManageScreen,
  ProfileScreen,
  AnalyticsScreen,
  EarningsScreen,
} from '../../screens/creator';

// Shared screens (for upgrade, etc.)
import {
  UpgradeScreen,
  LiveStreamScreen,
  ReplayScreen,
} from '../../screens/shared';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Dashboard Stack
export type DashboardStackParamList = {
  DashboardMain: undefined;
  Analytics: undefined;
  Earnings: undefined;
};

// Content Stack
export type ContentStackParamList = {
  ContentList: undefined;
  Upload: undefined;
  ContentDetail: { contentId: string };
  ContentEdit: { contentId: string };
};

// Stream Stack
export type StreamStackParamList = {
  StreamDashboard: undefined;
  GoLive: undefined;
  LivePreview: { streamId: string };
  RecordingsManage: undefined;
  ReplayPreview: { recordingId: string };
};

// Profile Stack
export type CreatorProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Upgrade: undefined;
};

// Tab Navigator
export type CreatorTabParamList = {
  DashboardTab: undefined;
  ContentTab: undefined;
  StreamTab: undefined;
  ProfileTab: undefined;
};

// =============================================================================
// STACK NAVIGATORS
// =============================================================================

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const ContentStack = createNativeStackNavigator<ContentStackParamList>();
const StreamStack = createNativeStackNavigator<StreamStackParamList>();
const ProfileStack = createNativeStackNavigator<CreatorProfileStackParamList>();

/**
 * Dashboard Stack Navigator
 * Overview and analytics
 */
function DashboardStackNavigator(): JSX.Element {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} />
      <DashboardStack.Screen name="Analytics" component={AnalyticsScreen} />
      <DashboardStack.Screen name="Earnings" component={EarningsScreen} />
    </DashboardStack.Navigator>
  );
}

/**
 * Content Stack Navigator
 * Upload and manage content
 */
function ContentStackNavigator(): JSX.Element {
  return (
    <ContentStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ContentStack.Screen name="ContentList" component={ContentManageScreen} />
      <ContentStack.Screen name="Upload" component={UploadScreen} />
    </ContentStack.Navigator>
  );
}

/**
 * Stream Stack Navigator
 * Live streaming and VOD management
 */
function StreamStackNavigator(): JSX.Element {
  return (
    <StreamStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <StreamStack.Screen name="StreamDashboard" component={StreamDashboardScreen} />
      <StreamStack.Screen name="RecordingsManage" component={RecordingsManageScreen} />
      <StreamStack.Screen name="LivePreview" component={LiveStreamScreen} />
      <StreamStack.Screen name="ReplayPreview" component={ReplayScreen} />
    </StreamStack.Navigator>
  );
}

/**
 * Profile Stack Navigator
 * Creator profile and settings
 */
function ProfileStackNavigator(): JSX.Element {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Upgrade" component={UpgradeScreen} />
    </ProfileStack.Navigator>
  );
}

// =============================================================================
// TAB NAVIGATOR
// =============================================================================

const Tab = createBottomTabNavigator<CreatorTabParamList>();

/**
 * Main Creator Navigator with bottom tabs.
 * Each tab contains a nested stack navigator.
 */
export default function CreatorNavigator(): JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
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
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ContentTab"
        component={ContentStackNavigator}
        options={{
          tabBarLabel: 'Content',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📝</Text>
          ),
        }}
      />
      <Tab.Screen
        name="StreamTab"
        component={StreamStackNavigator}
        options={{
          tabBarLabel: 'Stream',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📺</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
