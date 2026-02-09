/**
 * Typography - Font styles and sizes
 * 
 * Defines the typography scale for the entire app.
 * Currently uses system fonts; can be extended with custom fonts.
 * 
 * TODO Phase 3: Add custom font loading (Roboto for YouTube-like feel)
 * TODO Phase 3: Add responsive font scaling
 * TODO Phase 3: Add accessibility text sizing support
 */
export const typography = {
  // Font families (customize when adding custom fonts)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  // Font sizes (px values for React Native)
  fontSize: {
    xs: 10,    // Small labels, timestamps
    sm: 12,    // Secondary text, captions
    base: 14,  // Body text
    md: 16,    // Large body, input text
    lg: 18,    // Subtitles
    xl: 20,    // Small headings
    '2xl': 24, // Section headings
    '3xl': 30, // Page titles
    '4xl': 36, // Hero text
  },

  // Line heights (multipliers)
  lineHeight: {
    tight: 1.2,   // Headings
    normal: 1.5,  // Body text
    relaxed: 1.75, // Long-form content
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
};

