import { useTheme as useThemeContext } from '../context/ThemeProvider';

export function useTheme() {
  return useThemeContext();
} 