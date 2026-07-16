/**
 * useTheme Hook
 * ============================================
 * Newsprint 设计系统：永久浅色模式，无暗色主题。
 * 保留接口兼容性，但始终返回 'light'。
 */

import { useCallback } from 'react';
import type { ThemeMode } from '../types';

export function useTheme() {
  const theme: ThemeMode = 'light';

  const toggleTheme = useCallback(() => {
    // Newsprint 风格：无暗色模式，此函数为空操作
  }, []);

  return { theme, toggleTheme };
}
