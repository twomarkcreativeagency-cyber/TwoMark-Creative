import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    logo_url: '/uploads/logos/default-logo.png',
    logo_width: 150,
    logo_height: 50,
    preserve_aspect_ratio: true,
    primary_color: '#000000',
    accent_color: '#1CFF00',
  });

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const response = await axios.get(`${API_URL}/visuals`);
      const visualsData = response.data;
      setTheme(visualsData);
      applyTheme(visualsData);
      console.log('[Theme] Fetched and applied:', visualsData);
    } catch (error) {
      console.error('[Theme] Error fetching:', error);
      applyTheme(theme); // Apply default theme
    }
  };

  const applyTheme = (themeData) => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', themeData.primary_color || '#000000');
      root.style.setProperty('--accent-color', themeData.accent_color || '#1CFF00');
      
      // Update Tailwind CSS custom properties
      root.style.setProperty('--tw-primary', themeData.primary_color || '#000000');
      root.style.setProperty('--tw-accent', themeData.accent_color || '#1CFF00');
      
      console.log('[Theme] Applied colors:', {
        primary: themeData.primary_color,
        accent: themeData.accent_color
      });
    } catch (error) {
      console.error('[Theme] Error applying theme:', error);
    }
  };

  const updateTheme = async (updates) => {
    try {
      const response = await axios.put(`${API_URL}/visuals`, updates);
      const newTheme = response.data;
      setTheme(newTheme);
      applyTheme(newTheme);
      console.log('[Theme] Updated and applied:', newTheme);
      return { success: true };
    } catch (error) {
      console.error('[Theme] Error updating:', error);
      return { success: false, error: error.response?.data?.detail || 'Update failed' };
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, fetchTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
