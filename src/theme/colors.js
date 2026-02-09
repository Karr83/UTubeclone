/**
 * Colors - App color palette
 * 
 * This file defines all colors used throughout the application.
 * Uses a YouTube-inspired dark theme as the primary palette.
 * 
 * TODO Phase 3: Add color accessibility utilities (contrast checking)
 * TODO Phase 3: Add support for system color scheme preference
 */

export const colors = {
  // Primary (Indigo)
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main primary
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Neutral/Gray
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Success
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },

  // Warning
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },

  // Error
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  // Common
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // ============================================
  // YouTube Dark Theme Colors
  // ============================================
  youtube: {
    // Backgrounds
    background: '#0B0B0B',        // Main app background
    surface: '#121212',          // Cards, elevated surfaces
    surfaceHover: '#1A1A1A',     // Hover/pressed state
    surfaceElevated: '#212121',   // Modals, dropdowns
    
    // Text
    textPrimary: '#FFFFFF',       // Main text
    textSecondary: '#AAAAAA',     // Secondary/muted text
    textTertiary: '#717171',      // Disabled/hint text
    
    // Brand
    red: '#FF0000',               // YouTube red
    redHover: '#CC0000',          // Red hover state
    redDark: '#8B0000',           // Red pressed state
    
    // Accents
    blue: '#3EA6FF',              // Links, interactive elements
    green: '#2BA640',             // Success, subscribed state
    
    // Borders
    border: '#303030',            // Default border
    borderLight: '#3F3F3F',       // Lighter border
    divider: '#272727',           // Divider lines
    
    // Special
    live: '#FF0000',              // Live badge background
    livePulse: 'rgba(255,0,0,0.3)', // Live badge pulse
    membersBadge: '#2BA640',      // Members only badge
    boostedBadge: '#FFD700',      // Boosted content badge
    
    // Overlays
    overlay: 'rgba(0,0,0,0.6)',   // Modal/sheet overlay
    overlayLight: 'rgba(0,0,0,0.4)', // Light overlay
    
    // Chips/Filters
    chipBackground: '#272727',
    chipActive: '#F1F1F1',
    chipActiveText: '#0F0F0F',
    
    // Dropdown/Menu
    menuBackground: '#282828',    // Dropdown background
    menuItemHover: '#3D3D3D',     // Item hover/pressed state
    menuDivider: '#3D3D3D',       // Menu divider line
    
    // Buttons
    buttonPrimary: '#3EA6FF',     // Primary button background
    buttonPrimaryText: '#FFFFFF',  // Primary button text
    buttonPrimaryHover: '#2B8FE6', // Primary button hover
    buttonSecondary: 'transparent', // Secondary button background
    buttonSecondaryText: '#3EA6FF', // Secondary button text
    buttonSecondaryBorder: '#3EA6FF', // Secondary button border
    buttonGhost: 'transparent',   // Ghost button background
    buttonGhostText: '#FFFFFF',    // Ghost button text
    buttonDisabled: '#272727',    // Disabled button background
    buttonDisabledText: '#717171', // Disabled button text
  },
};
