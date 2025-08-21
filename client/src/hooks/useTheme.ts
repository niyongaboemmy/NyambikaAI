import { useContext } from 'react';
import { useTheme as useThemeContext } from '@/components/ThemeProvider';

export const useTheme = () => {
  return useThemeContext();
};
