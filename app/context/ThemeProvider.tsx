'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkTheme: boolean;
  isThemeLoaded: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Загрузка темы из localStorage только на клиенте
  useEffect(() => {
    const saved = localStorage.getItem('isDarkTheme');
    if (saved !== null) {
      setIsDarkTheme(JSON.parse(saved));
    }
    setIsThemeLoaded(true);
  }, []);

  // Применение темы к HTML элементу
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkTheme) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  // Сохранение темы в localStorage при изменении
  useEffect(() => {
    if (isThemeLoaded && typeof window !== 'undefined') {
      localStorage.setItem('isDarkTheme', JSON.stringify(isDarkTheme));
    }
  }, [isDarkTheme, isThemeLoaded]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDarkTheme, isThemeLoaded, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 