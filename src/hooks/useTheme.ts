/**
 * useTheme Hook
 * ============================================
 * Nocturne design system: permanent dark mode.
 * The entire experience is designed for darkness.
 */

import { useCallback } from 'react';
import type { ThemeMode } from '../types';

export function useTheme() {
  const theme: ThemeMode = 'dark';

  const toggleTheme = useCallback(() => {
    // Nocturne: always dark, this is a no-op
  }, []);

  return { theme, toggleTheme };
}
