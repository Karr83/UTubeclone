/**
 * NavigationIcon Components
 * 
 * Navigation icons for bottom tabs and top navigation bars.
 * Supports active (focused) and inactive states.
 * 
 * Features:
 * - Vector-based icons using React Native components
 * - Active/inactive state support
 * - Compatible with React Navigation tabBarIcon
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

export type NavigationIconName =
  | 'home'
  | 'live'
  | 'library'
  | 'profile'
  | 'search'
  | 'notifications'
  | 'menu'
  | 'add'
  | 'microphone'
  | 'camera'
  | 'grid'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'chevron-right'
  | 'chevron-left';

export interface NavigationIconProps {
  /** Icon name */
  name: NavigationIconName;
  /** Whether icon is in focused/active state */
  focused?: boolean;
  /** Icon size (default: 24) */
  size?: number;
  /** Icon color (overrides default focused/inactive colors) */
  color?: string;
  /** Additional style */
  style?: ViewStyle;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SIZE = 24;
const STROKE_WIDTH = 2;
const ACTIVE_COLOR = darkTheme.semantic.text; // White
const INACTIVE_COLOR = darkTheme.semantic.textSecondary; // Gray

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function NavigationIcon({
  name,
  focused = false,
  size = DEFAULT_SIZE,
  color,
  style,
}: NavigationIconProps): JSX.Element {
  const iconColor = color || (focused ? ACTIVE_COLOR : INACTIVE_COLOR);

  switch (name) {
    case 'home':
      return <HomeIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'live':
      return <LiveIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'library':
      return <LibraryIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'profile':
      return <ProfileIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'search':
      return <SearchIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'notifications':
      return <NotificationsIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'menu':
      return <MenuIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'add':
      return <AddIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'microphone':
      return <MicrophoneIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'camera':
      return <CameraIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'grid':
      return <GridIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'arrow-right':
      return <ArrowRightIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'arrow-left':
      return <ArrowLeftIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'arrow-up':
      return <ArrowUpIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'arrow-down':
      return <ArrowDownIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'chevron-right':
      return <ChevronRightIcon size={size} color={iconColor} focused={focused} style={style} />;
    case 'chevron-left':
      return <ChevronLeftIcon size={size} color={iconColor} focused={focused} style={style} />;
    default:
      return null;
  }
}

// =============================================================================
// INDIVIDUAL ICON COMPONENTS
// =============================================================================

interface IconProps {
  size: number;
  color: string;
  focused: boolean;
  style?: ViewStyle;
}

/**
 * Home Icon
 */
function HomeIcon({ size, color, focused, style }: IconProps): JSX.Element {
  const roofHeight = size * 0.4;
  const baseHeight = size * 0.5;

  if (focused) {
    // Filled version
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
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
          <View
            style={[
              styles.door,
              {
                width: size * 0.3,
                height: size * 0.35,
                backgroundColor: darkTheme.semantic.background,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  // Outline version
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
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
 * Live Icon (Broadcast)
 */
function LiveIcon({ size, color, focused, style }: IconProps): JSX.Element {
  if (focused) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
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
            },
          ]}
        />
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
              position: 'absolute',
              top: size * 0.15,
              left: size * 0.15,
            },
          ]}
        />
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

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
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
 * Library Icon (Multiple videos)
 */
function LibraryIcon({ size, color, focused, style }: IconProps): JSX.Element {
  const offset = size * 0.15;

  if (focused) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
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
        />
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
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
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
      />
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
      />
    </View>
  );
}

/**
 * Profile Icon (User/Account)
 */
function ProfileIcon({ size, color, focused, style }: IconProps): JSX.Element {
  const radius = size / 2;

  if (focused) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: color,
            },
          ]}
        >
          {/* Head */}
          <View
            style={[
              styles.profileHead,
              {
                width: size * 0.4,
                height: size * 0.4,
                borderRadius: size * 0.2,
                backgroundColor: darkTheme.semantic.background,
                position: 'absolute',
                top: size * 0.2,
                left: size * 0.3,
              },
            ]}
          />
          {/* Body */}
          <View
            style={[
              styles.profileBody,
              {
                width: size * 0.5,
                height: size * 0.3,
                borderRadius: size * 0.25,
                backgroundColor: darkTheme.semantic.background,
                position: 'absolute',
                bottom: size * 0.1,
                left: size * 0.25,
              },
            ]}
          />
        </View>
      </View>
    );
  }

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
        {/* Head */}
        <View
          style={[
            styles.profileHead,
            {
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              backgroundColor: 'transparent',
              position: 'absolute',
              top: size * 0.2,
              left: size * 0.3,
            },
          ]}
        />
        {/* Body */}
        <View
          style={[
            styles.profileBody,
            {
              width: size * 0.5,
              height: size * 0.3,
              borderRadius: size * 0.25,
              borderWidth: STROKE_WIDTH,
              borderColor: color,
              backgroundColor: 'transparent',
              position: 'absolute',
              bottom: size * 0.1,
              left: size * 0.25,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Search Icon (Magnifying glass)
 */
function SearchIcon({ size, color, focused, style }: IconProps): JSX.Element {
  const radius = size * 0.35;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Glass circle */}
      <View
        style={[
          styles.circle,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderWidth: focused ? 0 : STROKE_WIDTH,
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
            position: 'absolute',
            top: 0,
            left: 0,
          },
        ]}
      />
      {/* Handle */}
      <View
        style={[
          styles.searchHandle,
          {
            width: size * 0.25,
            height: STROKE_WIDTH,
            backgroundColor: color,
            position: 'absolute',
            bottom: size * 0.15,
            right: size * 0.1,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Notifications Icon (Bell)
 */
function NotificationsIcon({ size, color, focused, style }: IconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Bell body */}
      <View
        style={[
          styles.bellBody,
          {
            width: size * 0.7,
            height: size * 0.6,
            borderWidth: focused ? 0 : STROKE_WIDTH,
            borderColor: color,
            borderRadius: size * 0.1,
            backgroundColor: focused ? color : 'transparent',
            position: 'absolute',
            top: size * 0.1,
            left: size * 0.15,
          },
        ]}
      >
        {/* Clapper */}
        <View
          style={[
            styles.bellClapper,
            {
              width: size * 0.15,
              height: size * 0.2,
              borderRadius: size * 0.075,
              backgroundColor: focused ? darkTheme.semantic.background : color,
              position: 'absolute',
              bottom: -size * 0.1,
              left: size * 0.275,
            },
          ]}
        />
      </View>
      {/* Bell handle */}
      <View
        style={[
          styles.bellHandle,
          {
            width: size * 0.2,
            height: size * 0.15,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderBottomWidth: 0,
            borderTopLeftRadius: size * 0.1,
            borderTopRightRadius: size * 0.1,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: 0,
            left: size * 0.4,
          },
        ]}
      />
    </View>
  );
}

/**
 * Menu Icon (Hamburger menu)
 */
function MenuIcon({ size, color, focused, style }: IconProps): JSX.Element {
  const lineHeight = STROKE_WIDTH;
  const spacing = size * 0.25;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.menuLine,
          {
            width: size * 0.7,
            height: lineHeight,
            backgroundColor: color,
            position: 'absolute',
            top: spacing,
            left: size * 0.15,
          },
        ]}
      />
      <View
        style={[
          styles.menuLine,
          {
            width: size * 0.7,
            height: lineHeight,
            backgroundColor: color,
            position: 'absolute',
            top: size / 2 - lineHeight / 2,
            left: size * 0.15,
          },
        ]}
      />
      <View
        style={[
          styles.menuLine,
          {
            width: size * 0.7,
            height: lineHeight,
            backgroundColor: color,
            position: 'absolute',
            bottom: spacing,
            left: size * 0.15,
          },
        ]}
      />
    </View>
  );
}

/**
 * Add Icon (Plus in circle/square)
 */
function AddIcon({ size, color, focused, style }: IconProps): JSX.Element {
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
            borderWidth: focused ? 0 : STROKE_WIDTH,
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
          },
        ]}
      >
        {/* Plus sign */}
        <View
          style={[
            styles.plusLine,
            {
              width: size * 0.5,
              height: STROKE_WIDTH,
              backgroundColor: focused ? darkTheme.semantic.background : color,
              position: 'absolute',
              top: size / 2 - STROKE_WIDTH / 2,
              left: size * 0.25,
            },
          ]}
        />
        <View
          style={[
            styles.plusLine,
            {
              width: STROKE_WIDTH,
              height: size * 0.5,
              backgroundColor: focused ? darkTheme.semantic.background : color,
              position: 'absolute',
              left: size / 2 - STROKE_WIDTH / 2,
              top: size * 0.25,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Microphone Icon
 */
function MicrophoneIcon({ size, color, focused, style }: IconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Mic body */}
      <View
        style={[
          styles.micBody,
          {
            width: size * 0.4,
            height: size * 0.5,
            borderWidth: focused ? 0 : STROKE_WIDTH,
            borderColor: color,
            borderRadius: size * 0.2,
            backgroundColor: focused ? color : 'transparent',
            position: 'absolute',
            top: size * 0.1,
            left: size * 0.3,
          },
        ]}
      />
      {/* Mic stand */}
      <View
        style={[
          styles.micStand,
          {
            width: size * 0.6,
            height: STROKE_WIDTH,
            backgroundColor: color,
            position: 'absolute',
            bottom: size * 0.2,
            left: size * 0.2,
          },
        ]}
      />
      {/* Mic base */}
      <View
        style={[
          styles.micBase,
          {
            width: size * 0.3,
            height: size * 0.15,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderTopWidth: 0,
            borderBottomLeftRadius: size * 0.075,
            borderBottomRightRadius: size * 0.075,
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: 0,
            left: size * 0.35,
          },
        ]}
      />
    </View>
  );
}

/**
 * Camera Icon (Video camera with plus)
 */
function CameraIcon({ size, color, focused, style }: IconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Camera body */}
      <View
        style={[
          styles.cameraBody,
          {
            width: size * 0.7,
            height: size * 0.5,
            borderWidth: focused ? 0 : STROKE_WIDTH,
            borderColor: color,
            borderRadius: 2,
            backgroundColor: focused ? color : 'transparent',
            position: 'absolute',
            top: size * 0.2,
            left: size * 0.15,
          },
        ]}
      >
        {/* Lens */}
        <View
          style={[
            styles.cameraLens,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              borderWidth: STROKE_WIDTH,
              borderColor: focused ? darkTheme.semantic.background : color,
              backgroundColor: 'transparent',
              position: 'absolute',
              right: size * 0.1,
              top: size * 0.1,
            },
          ]}
        />
      </View>
      {/* Plus sign overlay */}
      <View
        style={[
          styles.plusOverlay,
          {
            width: size * 0.25,
            height: size * 0.25,
            borderWidth: STROKE_WIDTH,
            borderColor: color,
            borderRadius: 2,
            backgroundColor: 'transparent',
            position: 'absolute',
            top: size * 0.1,
            left: size * 0.1,
          },
        ]}
      >
        <View
          style={[
            styles.plusLine,
            {
              width: size * 0.15,
              height: STROKE_WIDTH,
              backgroundColor: color,
              position: 'absolute',
              top: size * 0.1,
              left: size * 0.05,
            },
          ]}
        />
        <View
          style={[
            styles.plusLine,
            {
              width: STROKE_WIDTH,
              height: size * 0.15,
              backgroundColor: color,
              position: 'absolute',
              left: size * 0.1,
              top: size * 0.05,
            },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Grid Icon (3x3 grid)
 */
function GridIcon({ size, color, focused, style }: IconProps): JSX.Element {
  const cellSize = size / 3;
  const gap = size * 0.05;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <View
            key={`${row}-${col}`}
            style={[
              styles.gridCell,
              {
                width: cellSize - gap,
                height: cellSize - gap,
                borderWidth: focused ? 0 : STROKE_WIDTH,
                borderColor: color,
                backgroundColor: focused ? color : 'transparent',
                position: 'absolute',
                top: row * cellSize + gap / 2,
                left: col * cellSize + gap / 2,
              },
            ]}
          />
        ))
      )}
    </View>
  );
}

/**
 * Arrow Right Icon
 */
function ArrowRightIcon({ size, color, focused, style }: IconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.arrowRight,
          {
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.4,
            borderTopWidth: size * 0.3,
            borderBottomWidth: size * 0.3,
            borderLeftColor: color,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
          },
        ]}
      />
    </View>
  );
}

/**
 * Arrow Left Icon
 */
function ArrowLeftIcon({ size, color, focused, style }: IconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.arrowLeft,
          {
            width: 0,
            height: 0,
            borderRightWidth: size * 0.4,
            borderTopWidth: size * 0.3,
            borderBottomWidth: size * 0.3,
            borderRightColor: color,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
          },
        ]}
      />
    </View>
  );
}

/**
 * Arrow Up Icon
 */
function ArrowUpIcon({ size, color, focused, style }: IconProps): JSX.Element {
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
            borderBottomWidth: size * 0.4,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          },
        ]}
      />
    </View>
  );
}

/**
 * Arrow Down Icon
 */
function ArrowDownIcon({ size, color, focused, style }: IconProps): JSX.Element {
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
            borderTopWidth: size * 0.4,
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
 * Chevron Right Icon
 */
function ChevronRightIcon({ size, color, focused, style }: IconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.chevronRight,
          {
            width: size * 0.4,
            height: size * 0.4,
            borderRightWidth: STROKE_WIDTH,
            borderTopWidth: STROKE_WIDTH,
            borderRightColor: color,
            borderTopColor: color,
            transform: [{ rotate: '45deg' }],
            position: 'absolute',
            top: size * 0.25,
            left: size * 0.2,
          },
        ]}
      />
    </View>
  );
}

/**
 * Chevron Left Icon
 */
function ChevronLeftIcon({ size, color, focused, style }: IconProps): JSX.Element {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <View
        style={[
          styles.chevronLeft,
          {
            width: size * 0.4,
            height: size * 0.4,
            borderLeftWidth: STROKE_WIDTH,
            borderTopWidth: STROKE_WIDTH,
            borderLeftColor: color,
            borderTopColor: color,
            transform: [{ rotate: '-45deg' }],
            position: 'absolute',
            top: size * 0.25,
            left: size * 0.2,
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
  // Home
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
  // Live
  arc: {},
  dot: {},
  // Library
  videoRect: {},
  // Profile
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHead: {},
  profileBody: {},
  // Search
  searchHandle: {},
  // Notifications
  bellBody: {},
  bellClapper: {},
  bellHandle: {},
  // Menu
  menuLine: {},
  // Add
  plusLine: {},
  plusOverlay: {},
  // Microphone
  micBody: {},
  micStand: {},
  micBase: {},
  // Camera
  cameraBody: {},
  cameraLens: {},
  // Grid
  gridCell: {},
  // Arrows
  arrowRight: {},
  arrowLeft: {},
  arrowUp: {},
  arrowDown: {},
  // Chevrons
  chevronRight: {},
  chevronLeft: {},
});
