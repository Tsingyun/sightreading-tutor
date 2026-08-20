/**
 * LanguageToggle — 顶部语言切换小按钮
 * ============================================
 * 在「中 / EN」之间切换当前界面语言。
 * 视觉上沿用 Nocturne 的玻璃质感 + 古铜金强调，融入各屏幕顶部布局。
 */

import { useLanguage } from '../i18n/LanguageContext';

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      type="button"
      className="language-toggle"
      onClick={toggleLang}
      aria-label={lang === 'zh' ? 'Switch to English' : '切换到中文'}
      title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <span className={`language-toggle__opt ${lang === 'zh' ? 'is-active' : ''}`}>中</span>
      <span className="language-toggle__sep">/</span>
      <span className={`language-toggle__opt ${lang === 'en' ? 'is-active' : ''}`}>EN</span>
    </button>
  );
}
