/**
 * SidebarIcon Components
 * 
 * Outline/inactive state icons for sidebar navigation items.
 * These icons represent the default/inactive state with stroke outlines.
 * 
 * Features:
 * - Vector-based icons using React Native components
 * - Outline/stroke style for inactive state
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

export interface SidebarIconProps {
  /** Icon size (default: 24) */
  size?: number;
  /** Icon color (default: theme text secondary) */
  color?: string;
  /** Additional style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIZE = 24;
const DEFAULT_COLOR = darkTheme.semantic.textSecondary;
const STROKE_WIDTH = 2;

// =============================================================================
// ICON COMPONENTS
// =============================================================================

/**
 * Home Icon (Outline)
 * House shape with outline
 */
export function HomeIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  const roofHeight = size * 0.4;
  const baseHeight = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Roof (triangle outline) */}
      <View
        style={[
          styles.roof,
          {
            width: size,
            height: roofHeight,
            borderBottomWidth: STROKE_WIDTH,
            borderLeftWidth: STROKE_WIDTH,
            borderRightWidth: STROKE_WIDTH,
            borderBottomColor: color,
            borderLeftColor: color,
            borderRightColor: color,
            borderTopColor: 'transparent',
          },
        ]}
      />
      {/* Base (rectangle outline) */}
      <View
        style={[
          styles.base,
          {
            width: size,
            height: baseHeight,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Door outline */}
        <View
          style={[
            styles.door,
            {
              width: size * 0.3,
              height: size * 0.35,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              backgroundColor: 'transparent',
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Explore Icon (Outline)
 * Compass rose with outline
 */
export function ExploreIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
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
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Compass cross lines */}
        <View
          style={[
            styles.compassLine,
            {
              width: size * 0.6,
              height: STROKE_WIDTH,
              backgroundColor: color,
              position: 'absolute',
              top: radius - STROKE_WIDTH / 2,
              left: size * 0.2,
            },
          ]}
        />
        <View
          style={[
            styles.compassLine,
            {
              width: STROKE_WIDTH,
              height: size * 0.6,
              backgroundColor: color,
              position: 'absolute',
              left: radius - STROKE_WIDTH / 2,
              top: size * 0.2,
            },
          ]}
        />
        {/* North indicator */}
        <View
          style={[
            styles.compassNeedle,
            {
              width: 0,
              height: 0,
              borderLeftWidth: radius * 0.25,
              borderRightWidth: radius * 0.25,
              borderBottomWidth: radius * 0.4,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
              position: 'absolute',
              top: size * 0.15,
              left: radius - radius * 0.25,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Subscriptions Icon (Outline)
 * Folder with play button overlay
 */
export function SubscriptionsIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  const playSize = size * 0.3;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Folder base outline */}
      <View
        style={[
          styles.folderBase,
          {
            width: size * 0.8,
            height: size * 0.7,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: 2,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Folder tab outline */}
        <View
          style={[
            styles.folderTab,
            {
              width: size * 0.35,
              height: size * 0.15,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              borderBottomWidth: 0,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              backgroundColor: 'transparent',
              position: 'absolute',
              top: -STROKE_WIDTH,
              left: 0,
            },
          ]}
        />
        {/* Play button outline */}
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
                borderLeftWidth: playSize * 0.35,
                borderTopWidth: playSize * 0.25,
                borderBottomWidth: playSize * 0.25,
                borderLeftColor: color,
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
 * Library Icon (Outline)
 * Two overlapping rectangles (videos)
 */
export function LibraryIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  const offset = size * 0.15;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Back rectangle outline */}
      <View
        style={[
          styles.videoRect,
          {
            width: size * 0.7,
            height: size * 0.5,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: 2,
            backgroundColor: 'transparent',
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
              borderLeftWidth: size * 0.12,
              borderTopWidth: size * 0.08,
              borderBottomWidth: size * 0.08,
              borderLeftColor: color,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
            },
          ]}
        />
      </View>
      {/* Front rectangle outline */}
      <View
        style={[
          styles.videoRect,
          {
            width: size * 0.7,
            height: size * 0.5,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: 2,
            backgroundColor: 'transparent',
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
              borderLeftWidth: size * 0.12,
              borderTopWidth: size * 0.08,
              borderBottomWidth: size * 0.08,
              borderLeftColor: color,
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
 * History Icon (Outline)
 * Clock with circular arrow
 */
export function HistoryIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Clock circle outline */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Clock hands */}
        <View
          style={[
            styles.clockHand,
            {
              width: STROKE_WIDTH,
              height: radius * 0.4,
              backgroundColor: color,
              position: 'absolute',
              top: radius * 0.2,
              left: radius - STROKE_WIDTH / 2,
            },
          ]}
        />
        <View
          style={[
            styles.clockHand,
            {
              width: STROKE_WIDTH,
              height: radius * 0.3,
              backgroundColor: color,
              position: 'absolute',
              top: radius * 0.3,
              left: radius - STROKE_WIDTH / 2,
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
            borderWidth: STROKE_WIDTH,
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
 * Watch Later Icon (Outline)
 * Simple clock face
 */
export function WatchLaterIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
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
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Hour hand */}
        <View
          style={[
            styles.clockHand,
            {
              width: STROKE_WIDTH,
              height: radius * 0.35,
              backgroundColor: color,
              position: 'absolute',
              top: radius * 0.15,
              left: radius - STROKE_WIDTH / 2,
            },
          ]}
        />
        {/* Minute hand */}
        <View
          style={[
            styles.clockHand,
            {
              width: STROKE_WIDTH,
              height: radius * 0.45,
              backgroundColor: color,
              position: 'absolute',
              top: radius * 0.05,
              left: radius - STROKE_WIDTH / 2,
              transform: [{ rotate: '30deg' }],
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Liked Videos Icon (Outline)
 * Thumbs up hand outline
 */
export function LikedVideosIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Thumb outline */}
      <View
        style={[
          styles.thumb,
          {
            width: size * 0.35,
            height: size * 0.5,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: size * 0.1,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: size * 0.15,
            left: size * 0.15,
          },
        ]}
      />
      {/* Hand base outline */}
      <View
        style={[
          styles.handBase,
          {
            width: size * 0.5,
            height: size * 0.6,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: size * 0.15,
            backgroundColor: 'transparent',
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
 * Your Videos Icon (Outline)
 * Play button in square outline
 */
export function YourVideosIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  const playSize = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Square outline */}
      <View
        style={[
          styles.square,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: 2,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Play triangle outline */}
        <View
          style={[
            styles.playTriangle,
            {
              width: 0,
              height: 0,
              borderLeftWidth: playSize * 0.35,
              borderTopWidth: playSize * 0.3,
              borderBottomWidth: playSize * 0.3,
              borderLeftColor: color,
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
 * Gaming Icon (Outline)
 * Game controller outline
 */
export function GamingIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Controller body outline */}
      <View
        style={[
          styles.controllerBody,
          {
            width: size * 0.8,
            height: size * 0.5,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: size * 0.1,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Left joystick outline */}
        <View
          style={[
            styles.joystick,
            {
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: size * 0.1,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              backgroundColor: 'transparent',
              position: 'absolute',
              top: size * 0.15,
              left: size * 0.1,
            },
          ]}
        />
        {/* Right buttons outline */}
        <View
          style={[
            styles.button,
            {
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              backgroundColor: 'transparent',
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
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              backgroundColor: 'transparent',
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
 * Live Icon (Outline)
 * Broadcast signal outline
 */
export function LiveIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Outer arc outline */}
      <View
        style={[
          styles.arc,
          {
            width: size,
            height: size,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRadius: size / 2,
            backgroundColor: 'transparent',
          },
        ]}
      />
      {/* Middle arc outline */}
      <View
        style={[
          styles.arc,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderRadius: size * 0.35,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: size * 0.15,
            left: size * 0.15,
          },
        ]}
      />
      {/* Center dot outline */}
      <View
        style={[
          styles.dot,
          {
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
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
 * Sports Icon (Outline)
 * Trophy cup outline
 */
export function SportsIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Trophy cup outline */}
      <View
        style={[
          styles.trophyCup,
          {
            width: size * 0.5,
            height: size * 0.7,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: size * 0.05,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: size * 0.15,
            left: size * 0.25,
          },
        ]}
      >
        {/* Cup rim outline */}
        <View
          style={[
            styles.trophyRim,
            {
              width: size * 0.6,
              height: size * 0.1,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              borderBottomWidth: 0,
              borderRadius: size * 0.05,
              backgroundColor: 'transparent',
              position: 'absolute',
              top: -STROKE_WIDTH,
              left: -size * 0.05,
            },
          ]}
        />
        {/* Cup handles outline */}
        <View
          style={[
            styles.trophyHandle,
            {
              width: size * 0.15,
              height: size * 0.3,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              borderRightColor: 'transparent',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRadius: size * 0.075,
              backgroundColor: 'transparent',
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
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              borderLeftColor: 'transparent',
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRadius: size * 0.075,
              backgroundColor: 'transparent',
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
 * Report Icon (Outline)
 * Flag outline
 */
export function ReportIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Flag pole outline */}
      <View
        style={[
          styles.flagPole,
          {
            width: STROKE_WIDTH,
            height: size * 0.8,
            backgroundColor: color,
            position: 'absolute',
            left: size * 0.1,
            top: size * 0.1,
          },
        ]}
      />
      {/* Flag outline */}
      <View
        style={[
          styles.flag,
          {
            width: size * 0.5,
            height: size * 0.4,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderLeftWidth: 0,
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
            backgroundColor: 'transparent',
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
 * Show More Icon (Outline)
 * Down arrow outline
 */
export function ShowMoreIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.arrowDown,
          {
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.3,
            borderRightWidth: size * 0.3,
            borderTopWidth: size * 0.5,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: color,
          },
        ]}
      />
    </View>
  );
}

/**
 * Settings Icon (Outline)
 * Gear/cogwheel outline
 */
export function SettingsIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Outer circle */}
      <View
        style={[
          styles.circle,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: size * 0.1,
            left: size * 0.1,
          },
        ]}
      />
      {/* Inner circle */}
      <View
        style={[
          styles.circle,
          {
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: size * 0.2,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: size * 0.3,
            left: size * 0.3,
          },
        ]}
      />
      {/* Gear teeth (simplified) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
        <View
          key={index}
          style={[
            styles.gearTooth,
            {
              width: STROKE_WIDTH,
              height: size * 0.15,
              backgroundColor: color,
              position: 'absolute',
              top: size * 0.1,
              left: size * 0.425,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * Help Icon (Outline)
 * Question mark in circle
 */
export function HelpIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Circle outline */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Question mark (simplified) */}
        <View
          style={[
            styles.questionMark,
            {
              width: size * 0.3,
              height: size * 0.5,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              borderTopWidth: 0,
              borderRightWidth: 0,
              borderLeftWidth: 0,
              borderRadius: size * 0.15,
              backgroundColor: 'transparent',
              position: 'absolute',
              top: size * 0.2,
              left: size * 0.35,
            },
          ]}
        />
        {/* Dot */}
        <View
          style={[
            styles.dot,
            {
              width: size * 0.1,
              height: size * 0.1,
              borderRadius: size * 0.05,
              backgroundColor: color,
              position: 'absolute',
              bottom: size * 0.25,
              left: size * 0.45,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Feedback Icon (Outline)
 * Speech bubble with exclamation
 */
export function FeedbackIcon({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  style,
}: SidebarIconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Speech bubble outline */}
      <View
        style={[
          styles.speechBubble,
          {
            width: size * 0.7,
            height: size * 0.6,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: size * 0.1,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: 0,
            left: size * 0.15,
          },
        ]}
      >
        {/* Exclamation mark */}
        <View
          style={[
            styles.exclamation,
            {
              width: STROKE_WIDTH,
              height: size * 0.3,
              backgroundColor: color,
              position: 'absolute',
              top: size * 0.15,
              left: size * 0.325,
            },
          ]}
        />
        <View
          style={[
            styles.dot,
            {
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04,
              backgroundColor: color,
              position: 'absolute',
              bottom: size * 0.15,
              left: size * 0.31,
            },
          ]}
        />
      </View>
      {/* Speech bubble tail */}
      <View
        style={[
          styles.bubbleTail,
          {
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.1,
            borderRightWidth: size * 0.1,
            borderTopWidth: size * 0.15,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: color,
            position: 'absolute',
            bottom: size * 0.1,
            left: size * 0.25,
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
  compassLine: {
    position: 'absolute',
  },
  compassNeedle: {
    position: 'absolute',
  },
  // Folder/Subscriptions
  folderBase: {
    position: 'relative',
  },
  folderTab: {
    position: 'absolute',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -6,
    marginLeft: -6,
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
  arrowDown: {},
  // Settings
  gearTooth: {
    position: 'absolute',
  },
  // Help
  questionMark: {},
  // Feedback
  speechBubble: {
    position: 'relative',
  },
  exclamation: {},
  bubbleTail: {
    position: 'absolute',
  },
});
