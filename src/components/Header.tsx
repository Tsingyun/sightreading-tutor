/**
 * Header 组件
 * ============================================
 * 应用顶部栏：标题、副标题、帮助按钮、主题切换按钮。
 */

import type { ThemeMode } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onShowGuide: () => void;
}

export function Header({ theme, onToggleTheme, onShowGuide }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo">♪</div>
        <div>
          <h1 className="app-header__title">识谱大师</h1>
          <p className="app-header__subtitle">五线谱识谱训练 · MIDI 交互式教学</p>
        </div>
      </div>
      <div className="app-header__actions">
        <button
          className="header-btn"
          onClick={onShowGuide}
          title="新手引导"
          aria-label="新手引导"
        >
          <span>📖</span>
        </button>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          aria-label="切换主题"
        >
          <span className="theme-toggle__icon">{theme === 'light' ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </header>
  );
}
