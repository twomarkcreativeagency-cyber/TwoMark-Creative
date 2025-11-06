import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const VisualsContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const useVisuals = () => {
  const context = useContext(VisualsContext);
  if (!context) {
    throw new Error('useVisuals must be used within VisualsProvider');
  }
  return context;
};

export const VisualsProvider = ({ children }) => {
  const [visuals, setVisuals] = useState({
    logo_url: '/uploads/logos/default-logo.png',
    logo_width: 150,
    logo_height: 50,
    preserve_aspect_ratio: true,
    primary_color: '#1CFF00',
    secondary_color: '#0A0A0A',
    accent_color: '#1CFF00',
  });

  useEffect(() => {
    fetchVisuals();
  }, []);

  const fetchVisuals = async () => {
    try {
      const response = await axios.get(`${API_URL}/visuals`);
      setVisuals(response.data);
      applyTheme(response.data);
    } catch (error) {
      console.error('Error fetching visuals:', error);
    }
  };

  const applyTheme = (visualsData) => {
    document.documentElement.style.setProperty('--primary-color', visualsData.primary_color);
    document.documentElement.style.setProperty('--secondary-color', visualsData.secondary_color);
    document.documentElement.style.setProperty('--accent-color', visualsData.accent_color);
  };

  const updateVisuals = async (updates) => {
    try {
      const response = await axios.put(`${API_URL}/visuals`, updates);
      setVisuals(response.data);
      applyTheme(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Update failed' };
    }
  };

  return (
    <VisualsContext.Provider value={{ visuals, updateVisuals, fetchVisuals }}>
      {children}
    </VisualsContext.Provider>
  );
};
