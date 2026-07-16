/**
 * 本地存储工具库
 * ============================================
 * 封装 LocalStorage 读写，用于持久化训练统计和设置。
 */

import type { TrainingStats, TrainingConfig, ThemeMode } from '../types';

const STORAGE_KEYS = {
  stats: 'sightreading_stats',
  config: 'sightreading_config',
  theme: 'sightreading_theme',
  bestStreak: 'sightreading_best_streak',
  guideSeen: 'sightreading_guide_seen',
} as const;

/** 默认训练统计 */
export const DEFAULT_STATS: TrainingStats = {
  correct: 0,
  total: 0,
  streak: 0,
  bestStreak: 0,
  totalReactionTime: 0,
  reactionCount: 0,
};

/** 默认训练配置 */
export const DEFAULT_CONFIG: TrainingConfig = {
  clef: 'treble',
  lowNote: 60,
  highNote: 67,
  includeAccidentals: false,
  autoNextOnError: false,
  mode: 'single',
  chordSize: 3,
  difficultyLevel: 1,
  showNoteLabel: true,
  keySignature: 'C',
};

/** 安全读取 JSON */
function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

/** 安全写入 JSON */
function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存储失败时静默忽略
  }
}

/** 读取训练统计 */
export function loadStats(): TrainingStats {
  return safeRead(STORAGE_KEYS.stats, DEFAULT_STATS);
}

/** 保存训练统计 */
export function saveStats(stats: TrainingStats): void {
  safeWrite(STORAGE_KEYS.stats, stats);
}

/** 读取训练配置 */
export function loadConfig(): TrainingConfig {
  return safeRead(STORAGE_KEYS.config, DEFAULT_CONFIG);
}

/** 保存训练配置 */
export function saveConfig(config: TrainingConfig): void {
  safeWrite(STORAGE_KEYS.config, config);
}

/** 读取主题 */
export function loadTheme(): ThemeMode {
  const theme = localStorage.getItem(STORAGE_KEYS.theme);
  if (theme === 'light' || theme === 'dark') return theme;
  // 默认跟随系统
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/** 保存主题 */
export function saveTheme(theme: ThemeMode): void {
  safeWrite(STORAGE_KEYS.theme, theme);
}

/** 读取历史最高连击（跨会话持久化） */
export function loadBestStreak(): number {
  const raw = localStorage.getItem(STORAGE_KEYS.bestStreak);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

/** 保存历史最高连击 */
export function saveBestStreak(streak: number): void {
  safeWrite(STORAGE_KEYS.bestStreak, streak);
}

/** 读取是否已看过新手引导 */
export function loadGuideSeen(): boolean {
  return localStorage.getItem(STORAGE_KEYS.guideSeen) === 'true';
}

/** 标记已看过新手引导 */
export function saveGuideSeen(): void {
  safeWrite(STORAGE_KEYS.guideSeen, 'true');
}
