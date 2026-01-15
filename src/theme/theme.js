// Theme - Combined theme object
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

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

// Dark theme (for future use)
export const darkTheme = {
  ...theme,
  semantic: {
    background: colors.gray[900],
    surface: colors.gray[800],
    text: colors.gray[100],
    textSecondary: colors.gray[400],
    border: colors.gray[700],
    primary: colors.primary[400],
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
  },
};

