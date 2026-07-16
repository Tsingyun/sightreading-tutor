/**
 * Header 组件
 * ============================================
 * 报纸报头风格：刊名、副标题、出版信息、帮助按钮。
 * 遵循 Newsprint 设计系统：高对比衬线大标题、
 * 等宽元数据、4px 底部分割线。
 */

interface HeaderProps {
  onShowGuide: () => void;
}

export function Header({ onShowGuide }: HeaderProps) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <header className="app-header">
      {/* 顶部元数据条 — 报纸刊号风格 */}
      <div className="app-header__meta-bar">
        <span className="app-header__meta-item">Vol. 1</span>
        <span className="app-header__meta-divider">·</span>
        <span className="app-header__meta-item">{dateStr}</span>
        <span className="app-header__meta-divider">·</span>
        <span className="app-header__meta-item">音乐教育版</span>
        <span className="app-header__meta-spacer" />
        <button
          className="header-btn"
          onClick={onShowGuide}
          title="新手引导"
          aria-label="新手引导"
        >
          <span>帮助</span>
        </button>
      </div>

      {/* 报头刊名 */}
      <div className="app-header__masthead">
        <h1 className="app-header__title">识谱大师</h1>
        <p className="app-header__subtitle">
          The Sight-Reading Tutor — 五线谱识谱训练 · MIDI 交互式教学
        </p>
      </div>
    </header>
  );
}
