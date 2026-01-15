// ThemeContext - Theme/appearance state management
import React, { createContext, useContext, useState } from 'react';
import { theme as defaultTheme } from '../theme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(defaultTheme);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // TODO: Update theme colors based on mode
  };

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

