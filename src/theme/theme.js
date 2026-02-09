/**
 * Theme - Combined theme object
 * 
 * Exports both light and dark themes with semantic color mappings.
 * The app currently uses dark theme by default (YouTube-style).
 * 
 * TODO Phase 3: Add ThemeContext for runtime theme switching
 * TODO Phase 3: Add system theme preference detection
 */
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

// Light theme (default from design system)
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  
  // Semantic colors for quick access
  semantic: {
    background: colors.gray[50],
    surface: colors.white,
    text: colors.gray[800],
    textSecondary: colors.gray[500],
    border: colors.gray[200],
    primary: colors.primary[500],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
  },
};

// Dark theme (YouTube-style)
export const darkTheme = {
  ...theme,
  semantic: {
    // Backgrounds
    background: colors.youtube.background,
    surface: colors.youtube.surface,
    surfaceElevated: colors.youtube.surfaceElevated,
    
    // Text
    text: colors.youtube.textPrimary,
    textSecondary: colors.youtube.textSecondary,
    textTertiary: colors.youtube.textTertiary,
    
    // Borders
    border: colors.youtube.border,
    divider: colors.youtube.divider,
    
    // Brand
    primary: colors.youtube.blue,
    accent: colors.youtube.red,
    
    // Status
    success: colors.youtube.green,
    warning: colors.warning[500],
    error: colors.youtube.red,
    
    // Special
    live: colors.youtube.live,
    members: colors.youtube.membersBadge,
    boosted: colors.youtube.boostedBadge,
  },
  
  // YouTube-specific tokens
  youtube: colors.youtube,
};

// Export dark theme as the default active theme
export const activeTheme = darkTheme;