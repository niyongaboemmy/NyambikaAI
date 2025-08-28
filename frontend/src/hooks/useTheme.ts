import { useContext } from 'react';
import { useTheme as useThemeContext } from '@/components/theme-provider';

export const useTheme = () => {
  return useThemeContext();
};
