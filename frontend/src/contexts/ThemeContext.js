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
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('[Theme] No token, using defaults');
        applyTheme(theme);
        return;
      }

      const response = await axios.get(`${API_URL}/visuals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const primary = themeData.primary_color || '#000000';
      const accent = themeData.accent_color || '#1CFF00';
      
      // Apply CSS custom properties
      root.style.setProperty('--primary-color', primary);
      root.style.setProperty('--accent-color', accent);
      root.style.setProperty('--tw-primary', primary);
      root.style.setProperty('--tw-accent', accent);
      
      // Update CSS classes dynamically for better integration
      const style = document.getElementById('dynamic-theme-style') || document.createElement('style');
      style.id = 'dynamic-theme-style';
      style.innerHTML = `
        .bg-accent { background-color: ${accent} !important; }
        .text-accent { color: ${accent} !important; }
        .border-accent { border-color: ${accent} !important; }
        .hover\\:bg-accent:hover { background-color: ${accent} !important; }
        .bg-accent\\/10 { background-color: ${accent}1A !important; }
        .bg-accent\\/90 { background-color: ${accent}E6 !important; }
      `;
      if (!document.getElementById('dynamic-theme-style')) {
        document.head.appendChild(style);
      }
      
      console.log('[Theme] Applied colors:', { primary, accent });
    } catch (error) {
      console.error('[Theme] Error applying theme:', error);
    }
  };

  const updateTheme = async (updates) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await axios.put(`${API_URL}/visuals`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
