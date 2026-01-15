/**
 * User Navigator
 * 
 * Navigation stack for authenticated users with 'user' role.
 * Provides bottom tab navigation with nested stacks for each tab.
 * 
 * STRUCTURE:
 * - Home Tab → ContentFeedScreen + detail screens
 * - Live Tab → LiveStreamsListScreen + watch screens
 * - Library Tab → RecordingsListScreen + replay screens
 * - Profile Tab → ProfileScreen + settings screens
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

// Shared screens (accessible from multiple tabs)
import { 
  ContentFeedScreen,
  ContentDetailScreen,
  LiveStreamScreen,
  LiveStreamsListScreen,
  RecordingsListScreen,
  ReplayScreen,
  UpgradeScreen,
  CreatorProfileScreen,
} from '../../screens/shared';

// User screens
import ProfileScreen from '../../screens/user/ProfileScreen';
import MembershipScreen from '../../screens/user/MembershipScreen';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// Home Stack
export type HomeStackParamList = {
  Feed: undefined;
  ContentDetail: { id: string };
  LiveStream: { streamId: string };
  Replay: { recordingId: string };
  CreatorProfile: { id: string };
  Upgrade: undefined;
};

// Live Stack
export type LiveStackParamList = {
  LiveList: undefined;
  LiveStream: { streamId: string };
  CreatorProfile: { id: string };
};

// Library Stack
export type LibraryStackParamList = {
  RecordingsList: undefined;
  Replay: { recordingId: string };
  CreatorProfile: { id: string };
};

// Profile Stack
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Membership: undefined;
  Upgrade: undefined;
  Settings: undefined;
};

// Tab Navigator
export type UserTabParamList = {
  HomeTab: undefined;
  LiveTab: undefined;
  LibraryTab: undefined;
  ProfileTab: undefined;
};

// =============================================================================
// STACK NAVIGATORS
// =============================================================================

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LiveStack = createNativeStackNavigator<LiveStackParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/**
 * Home Stack Navigator
 * Browse content feed and view details
 */
function HomeStackNavigator(): JSX.Element {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="Feed" component={ContentFeedScreen} />
      <HomeStack.Screen name="ContentDetail" component={ContentDetailScreen} />
      <HomeStack.Screen name="LiveStream" component={LiveStreamScreen} />
      <HomeStack.Screen name="Replay" component={ReplayScreen} />
      <HomeStack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
      <HomeStack.Screen name="Upgrade" component={UpgradeScreen} />
    </HomeStack.Navigator>
  );
}

/**
 * Live Stack Navigator
 * Browse and watch live streams
 */
function LiveStackNavigator(): JSX.Element {
  return (
    <LiveStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <LiveStack.Screen name="LiveList" component={LiveStreamsListScreen} />
      <LiveStack.Screen name="LiveStream" component={LiveStreamScreen} />
      <LiveStack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
    </LiveStack.Navigator>
  );
}

/**
 * Library Stack Navigator
 * Browse and watch recorded streams (VOD)
 */
function LibraryStackNavigator(): JSX.Element {
  return (
    <LibraryStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <LibraryStack.Screen name="RecordingsList" component={RecordingsListScreen} />
      <LibraryStack.Screen name="Replay" component={ReplayScreen} />
      <LibraryStack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
    </LibraryStack.Navigator>
  );
}

/**
 * Profile Stack Navigator
 * User profile, membership, and settings
 */
function ProfileStackNavigator(): JSX.Element {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Membership" component={MembershipScreen} />
      <ProfileStack.Screen name="Upgrade" component={UpgradeScreen} />
    </ProfileStack.Navigator>
  );
}

// =============================================================================
// TAB NAVIGATOR
// =============================================================================

const Tab = createBottomTabNavigator<UserTabParamList>();

/**
 * Main User Navigator with bottom tabs.
 * Each tab contains a nested stack navigator.
 */
export default function UserNavigator(): JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
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
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="LiveTab"
        component={LiveStackNavigator}
        options={{
          tabBarLabel: 'Live',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📺</Text>
          ),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20 }}>📚</Text>
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
