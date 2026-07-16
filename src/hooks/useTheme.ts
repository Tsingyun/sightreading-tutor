/**
 * useTheme Hook
 * ============================================
 * 管理深色/浅色主题切换，持久化到 LocalStorage。
 */

import { useState, useEffect, useCallback } from 'react';
import type { ThemeMode } from '../types';
import { loadTheme, saveTheme } from '../lib/storage';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());

  // 切换主题并应用到 document
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      saveTheme(next);
      return next;
    });
  }, []);

  // 应用主题到 document 属性
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, toggleTheme };
}
