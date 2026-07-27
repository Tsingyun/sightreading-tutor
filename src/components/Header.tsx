/**
 * Header 组件
 * ============================================
 * Aurora Conservatory 风格：渐变标题、玻璃态元数据条、
 * 霓虹声音开关、帮助按钮。
 */

interface HeaderProps {
  onShowGuide: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  soundLoadStatus: 'idle' | 'loading' | 'ready' | 'error' | 'fallback';
  soundLoadProgress: number;
}

export function Header({ onShowGuide, soundEnabled, onToggleSound, soundLoadStatus, soundLoadProgress }: HeaderProps) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 声音按钮文字
  const soundLabel = (() => {
    if (!soundEnabled) return '声音 关';
    if (soundLoadStatus === 'loading') {
      const pct = Math.round(soundLoadProgress * 100);
      return `音色 ${pct}%`;
    }
    if (soundLoadStatus === 'fallback') return '声音 开';
    if (soundLoadStatus === 'ready') return '声音 开';
    return '声音 开';
  })();

  return (
    <header className="app-header">
      {/* 顶部元数据条 */}
      <div className="app-header__meta-bar">
        <span className="app-header__meta-item">Aurora v2.0</span>
        <span className="app-header__meta-divider">·</span>
        <span className="app-header__meta-item">{dateStr}</span>
        <span className="app-header__meta-divider">·</span>
        <span className="app-header__meta-item">Where Music Meets the Future</span>
        <span className="app-header__meta-spacer" />
        {/* 声音开关 */}
        <button
          className={`header-btn header-btn--sound ${soundEnabled ? 'header-btn--active' : ''} ${soundLoadStatus === 'loading' ? 'header-btn--loading' : ''}`}
          onClick={onToggleSound}
          title={
            !soundEnabled
              ? '开启键盘声音'
              : soundLoadStatus === 'loading'
                ? `音色加载中… ${Math.round(soundLoadProgress * 100)}%`
                : soundLoadStatus === 'fallback'
                  ? '音色加载失败，使用合成音'
                  : soundLoadStatus === 'ready'
                    ? '关闭键盘声音'
                    : '关闭键盘声音'
          }
          aria-label={soundEnabled ? '关闭键盘声音' : '开启键盘声音'}
          aria-pressed={soundEnabled}
        >
          <span>{soundLabel}</span>
        </button>
        {/* 帮助 */}
        <button
          className="header-btn"
          onClick={onShowGuide}
          title="新手引导"
          aria-label="新手引导"
        >
          <span>帮助</span>
        </button>
      </div>

      {/* 标题区 */}
      <div className="app-header__masthead">
        <h1 className="app-header__title">识谱大师</h1>
        <p className="app-header__subtitle">
          Aurora Conservatory — 五线谱识谱训练 · MIDI 交互式教学
        </p>
      </div>
    </header>
  );
}
