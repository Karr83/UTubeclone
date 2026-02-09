/**
 * SidebarIconFill Components
 * 
 * Filled-state icons for active/selected sidebar navigation items.
 * These icons represent the active state with filled shapes.
 * 
 * Features:
 * - Vector-based icons using React Native components
 * - Filled shapes for active state
 * - Consistent sizing and alignment
 * - Customizable color and size
 * - YouTube-style dark theme
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { darkTheme } from '../../../theme';

// =============================================================================
// TYPES
// =============================================================================

export interface SidebarIconFillProps {
  /** Icon size (default: 24) */
  size?: number;
  /** Icon color (default: theme text primary) */
  color?: string;
  /** Additional style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIZE = 24;
const DEFAULT_COLOR = darkTheme.semantic.text;

// =============================================================================
// ICON COMPONENTS
// =============================================================================

/**
 * Home Icon (Filled)
 * House shape with filled interior
 */
export function HomeIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  const roofHeight = size * 0.4;
  const baseHeight = size * 0.5;
  const doorWidth = size * 0.3;
  const doorHeight = size * 0.35;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Roof (triangle) */}
      <View
        style={[
          styles.roof,
          {
            width: size,
            height: roofHeight,
            borderBottomColor: color,
            borderLeftWidth: size / 2,
            borderRightWidth: size / 2,
            borderBottomWidth: roofHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
          },
        ]}
      />
      {/* Base (rectangle) */}
      <View
        style={[
          styles.base,
          {
            width: size,
            height: baseHeight,
            backgroundColor: color,
          },
        ]}
      >
        {/* Door */}
        <View
          style={[
            styles.door,
            {
              width: doorWidth,
              height: doorHeight,
              backgroundColor: darkTheme.semantic.background,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Explore Icon (Filled)
 * Compass rose with filled center
 */
export function ExploreIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Outer circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: color,
            backgroundColor: color,
          },
        ]}
      >
        {/* Compass needle (north indicator) */}
        <View
          style={[
            styles.compassNeedle,
            {
              width: 0,
              height: 0,
              borderLeftWidth: radius * 0.3,
              borderRightWidth: radius * 0.3,
              borderBottomWidth: radius * 0.5,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: darkTheme.semantic.background,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Subscriptions Icon (Filled)
 * Folder with play button overlay
 */
export function SubscriptionsIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  const playSize = size * 0.4;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Folder base */}
      <View
        style={[
          styles.folderBase,
          {
            width: size * 0.8,
            height: size * 0.7,
            backgroundColor: color,
            borderRadius: 2,
          },
        ]}
      >
        {/* Folder tab */}
        <View
          style={[
            styles.folderTab,
            {
              width: size * 0.35,
              height: size * 0.15,
              backgroundColor: color,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            },
          ]}
        />
        {/* Play button overlay */}
        <View
          style={[
            styles.playOverlay,
            {
              width: playSize,
              height: playSize,
            },
          ]}
        >
          <View
            style={[
              styles.playTriangle,
              {
                width: 0,
                height: 0,
                borderLeftWidth: playSize * 0.4,
                borderTopWidth: playSize * 0.25,
                borderBottomWidth: playSize * 0.25,
                borderLeftColor: darkTheme.semantic.background,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                marginLeft: playSize * 0.1,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * Library Icon (Filled)
 * Two overlapping rectangles (videos)
 */
export function LibraryIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  const offset = size * 0.15;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Back rectangle */}
      <View
        style={[
          styles.videoRect,
          {
            width: size * 0.7,
            height: size * 0.5,
            backgroundColor: color,
            borderRadius: 2,
            position: 'absolute',
            top: offset,
            left: 0,
          },
        ]}
      >
        {/* Play icon on back */}
        <View
          style={[
            styles.playIcon,
            {
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.15,
              borderTopWidth: size * 0.1,
              borderBottomWidth: size * 0.1,
              borderLeftColor: darkTheme.semantic.background,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
            },
          ]}
        />
      </View>
      {/* Front rectangle */}
      <View
        style={[
          styles.videoRect,
          {
            width: size * 0.7,
            height: size * 0.5,
            backgroundColor: color,
            borderRadius: 2,
            position: 'absolute',
            top: 0,
            left: offset,
          },
        ]}
      >
        {/* Play icon on front */}
        <View
          style={[
            styles.playIcon,
            {
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.15,
              borderTopWidth: size * 0.1,
              borderBottomWidth: size * 0.1,
              borderLeftColor: darkTheme.semantic.background,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * History Icon (Filled)
 * Clock with circular arrow
 */
export function HistoryIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Clock circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: color,
            backgroundColor: color,
          },
        ]}
      >
        {/* Clock hands */}
        <View
          style={[
            styles.clockHand,
            {
              width: 2,
              height: radius * 0.4,
              backgroundColor: darkTheme.semantic.background,
              position: 'absolute',
              top: radius * 0.2,
              left: radius - 1,
            },
          ]}
        />
        <View
          style={[
            styles.clockHand,
            {
              width: 2,
              height: radius * 0.3,
              backgroundColor: darkTheme.semantic.background,
              position: 'absolute',
              top: radius * 0.3,
              left: radius - 1,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />
      </View>
      {/* Circular arrow (top-right) */}
      <View
        style={[
          styles.arrowArc,
          {
            width: size * 0.4,
            height: size * 0.4,
            borderWidth: 2,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRadius: size * 0.2,
            position: 'absolute',
            top: -size * 0.1,
            right: -size * 0.1,
          },
        ]}
      />
    </View>
  );
}

/**
 * Watch Later Icon (Filled)
 * Simple clock face
 */
export function WatchLaterIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: color,
            backgroundColor: color,
          },
        ]}
      >
        {/* Hour hand */}
        <View
          style={[
            styles.clockHand,
            {
              width: 2,
              height: radius * 0.35,
              backgroundColor: darkTheme.semantic.background,
              position: 'absolute',
              top: radius * 0.15,
              left: radius - 1,
            },
          ]}
        />
        {/* Minute hand */}
        <View
          style={[
            styles.clockHand,
            {
              width: 2,
              height: radius * 0.45,
              backgroundColor: darkTheme.semantic.background,
              position: 'absolute',
              top: radius * 0.05,
              left: radius - 1,
              transform: [{ rotate: '30deg' }],
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Liked Videos Icon (Filled)
 * Thumbs up hand
 */
export function LikedVideosIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            width: size * 0.35,
            height: size * 0.5,
            backgroundColor: color,
            borderRadius: size * 0.1,
            position: 'absolute',
            top: size * 0.15,
            left: size * 0.15,
          },
        ]}
      />
      {/* Hand base */}
      <View
        style={[
          styles.handBase,
          {
            width: size * 0.5,
            height: size * 0.6,
            backgroundColor: color,
            borderRadius: size * 0.15,
            position: 'absolute',
            top: size * 0.2,
            left: size * 0.25,
          },
        ]}
      />
    </View>
  );
}

/**
 * Your Videos Icon (Filled)
 * Play button in square
 */
export function YourVideosIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  const playSize = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Square background */}
      <View
        style={[
          styles.square,
          {
            width: size * 0.8,
            height: size * 0.8,
            backgroundColor: color,
            borderRadius: 2,
          },
        ]}
      >
        {/* Play triangle */}
        <View
          style={[
            styles.playTriangle,
            {
              width: 0,
              height: 0,
              borderLeftWidth: playSize * 0.4,
              borderTopWidth: playSize * 0.3,
              borderBottomWidth: playSize * 0.3,
              borderLeftColor: darkTheme.semantic.background,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              marginLeft: playSize * 0.15,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Gaming Icon (Filled)
 * Game controller
 */
export function GamingIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Controller body */}
      <View
        style={[
          styles.controllerBody,
          {
            width: size * 0.8,
            height: size * 0.5,
            backgroundColor: color,
            borderRadius: size * 0.1,
          },
        ]}
      >
        {/* Left joystick */}
        <View
          style={[
            styles.joystick,
            {
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: size * 0.1,
              backgroundColor: darkTheme.semantic.background,
              position: 'absolute',
              top: size * 0.15,
              left: size * 0.1,
            },
          ]}
        />
        {/* Right buttons */}
        <View
          style={[
            styles.button,
            {
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04,
              backgroundColor: darkTheme.semantic.background,
              position: 'absolute',
              top: size * 0.12,
              right: size * 0.15,
            },
          ]}
        />
        <View
          style={[
            styles.button,
            {
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04,
              backgroundColor: darkTheme.semantic.background,
              position: 'absolute',
              top: size * 0.25,
              right: size * 0.15,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Live Icon (Filled)
 * Broadcast signal
 */
export function LiveIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Outer arc */}
      <View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderWidth: 2,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRadius: size / 2,
          },
        ]}
      />
      {/* Middle arc */}
      <View
        style={[
          styles.arc,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderWidth: 2,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRadius: size * 0.35,
            position: 'absolute',
            top: size * 0.15,
            left: size * 0.15,
          },
        ]}
      />
      {/* Center dot */}
      <View
        style={[
          styles.dot,
          {
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            backgroundColor: color,
            position: 'absolute',
            top: size * 0.35,
            left: size * 0.35,
          },
        ]}
      />
    </View>
  );
}

/**
 * Sports Icon (Filled)
 * Trophy cup
 */
export function SportsIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Trophy cup */}
      <View
        style={[
          styles.trophyCup,
          {
            width: size * 0.5,
            height: size * 0.7,
            backgroundColor: color,
            borderRadius: size * 0.05,
            position: 'absolute',
            top: size * 0.15,
            left: size * 0.25,
          },
        ]}
      >
        {/* Cup rim */}
        <View
          style={[
            styles.trophyRim,
            {
              width: size * 0.6,
              height: size * 0.1,
              backgroundColor: color,
              borderRadius: size * 0.05,
              position: 'absolute',
              top: -size * 0.05,
              left: -size * 0.05,
            },
          ]}
        />
        {/* Cup handles */}
        <View
          style={[
            styles.trophyHandle,
            {
              width: size * 0.15,
              height: size * 0.3,
              borderWidth: 2,
              borderColor: color,
              borderRightColor: 'transparent',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRadius: size * 0.075,
              position: 'absolute',
              top: size * 0.1,
              left: -size * 0.1,
            },
          ]}
        />
        <View
          style={[
            styles.trophyHandle,
            {
              width: size * 0.15,
              height: size * 0.3,
              borderWidth: 2,
              borderColor: color,
              borderLeftColor: 'transparent',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRadius: size * 0.075,
              position: 'absolute',
              top: size * 0.1,
              right: -size * 0.1,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Report Icon (Filled)
 * Flag
 */
export function ReportIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Flag pole */}
      <View
        style={[
          styles.flagPole,
          {
            width: size * 0.15,
            height: size * 0.8,
            backgroundColor: color,
            position: 'absolute',
            left: size * 0.1,
            top: size * 0.1,
          },
        ]}
      />
      {/* Flag */}
      <View
        style={[
          styles.flag,
          {
            width: size * 0.5,
            height: size * 0.4,
            backgroundColor: color,
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
            position: 'absolute',
            left: size * 0.25,
            top: size * 0.1,
          },
        ]}
      />
    </View>
  );
}

/**
 * Show More Icon (Filled)
 * Up arrow
 */
export function ShowMoreIconFill({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconFillProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.arrowUp,
          {
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.3,
            borderRightWidth: size * 0.3,
            borderBottomWidth: size * 0.5,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          },
        ]}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Home icon
  roof: {
    position: 'absolute',
    top: 0,
  },
  base: {
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  door: {
    position: 'absolute',
    bottom: 0,
  },
  // Circle (for compass, clock, etc.)
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassNeedle: {
    position: 'absolute',
    top: '20%',
  },
  // Folder/Subscriptions
  folderBase: {
    position: 'relative',
  },
  folderTab: {
    position: 'absolute',
    top: -4,
    left: 0,
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {},
  // Library
  videoRect: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {},
  // Clock
  clockHand: {
    position: 'absolute',
  },
  arrowArc: {},
  // Thumbs up
  thumb: {},
  handBase: {},
  // Square
  square: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Controller
  controllerBody: {
    position: 'relative',
  },
  joystick: {},
  button: {},
  // Live
  arc: {},
  dot: {},
  // Trophy
  trophyCup: {
    position: 'relative',
  },
  trophyRim: {},
  trophyHandle: {},
  // Flag
  flagPole: {},
  flag: {},
  // Arrow
  arrowUp: {},
});
