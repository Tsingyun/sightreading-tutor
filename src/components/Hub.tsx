/**
 * Hub 组件 — Nocturne 门户选择屏
 * ============================================
 * 应用入口：展示四条学习路径（识谱 / 自由弹奏 / 节奏 / 乐曲），
 * 用户点击门户卡片进入对应模式。底部展示累计统计。
 *
 * 动画策略：
 * - Masthead / 底部统计由 index.css 中的 `fade-up` 关键帧驱动（含延迟）。
 * - 门户网格用 motion 驱动逐张错峰入场（stagger），并接管 hover 抬升，
 *   避免与 CSS 内联 transform 冲突。
 * - 底部统计数值用 AnimatePresence 在数值变化时做翻牌动画。
 */

import { motion, AnimatePresence } from 'motion/react';
import type { CSSProperties } from 'react';
import type { AppMode } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

interface HubProps {
  onSelectMode: (mode: AppMode) => void;
  allTimeBestStreak: number;
  totalSessions: number;
  totalCorrect: number;
}

interface PortalConfig {
  mode: AppMode;
  number: string;
  icon: string;
  color: string;
}

/** 扩展 CSSProperties 以承载门户主题自定义属性 */
interface PortalCardStyle extends CSSProperties {
  '--portal-color': string;
  '--portal-glow': string;
}

/** 与 --ease-out-expo 一致的三次贝塞尔，供 motion 复用 */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const PORTALS: PortalConfig[] = [
  { mode: 'training', number: '01', icon: '♪', color: '#C9A961' },
  { mode: 'freeplay', number: '02', icon: '♫', color: '#6B9AC4' },
  { mode: 'rhythm', number: '03', icon: '♩', color: '#7CB069' },
  { mode: 'song', number: '04', icon: '𝄞', color: '#C76B6B' },
];

/** 将 #RRGGBB 转为 rgba 字符串 */
function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 统计数值翻牌：值变化时旧值上移淡出、新值下移淡入 */
function AnimatedStatValue({ value }: { value: number }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={value}
        className="hub-stat__value"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

export function Hub({
  onSelectMode,
  allTimeBestStreak,
  totalSessions,
  totalCorrect,
}: HubProps) {
  const { t } = useLanguage();

  return (
    <div className="screen-hub">
      {/* 语言切换：置于顶部右上角 */}
      <div className="hub-topbar">
        <LanguageToggle />
      </div>

      <header className="hub-masthead">
        <p className="hub-masthead__pretitle">NOCTURNE CONSERVATORY</p>
        <h1 className="hub-masthead__title">
          Sight Reading <em>Reimagined</em>
        </h1>
        <p className="hub-masthead__subtitle">{t('hub.subtitle')}</p>
      </header>

      {/* 门户网格：父级 CSS fade-up 提供整体淡入，motion 负责子卡片错峰入场 */}
      <motion.div
        className="hub-portals"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { delayChildren: 0.85, staggerChildren: 0.12 },
          },
        }}
      >
        {PORTALS.map((portal) => {
          const style: PortalCardStyle = {
            '--portal-color': portal.color,
            '--portal-glow': hexToRgba(portal.color, 0.2),
          };
          return (
            <motion.div
              key={portal.mode}
              className="portal"
              style={style}
              role="button"
              tabIndex={0}
              aria-label={`${t('hub.mode.' + portal.mode)} — ${t('hub.modeDesc.' + portal.mode)}`}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.7, ease: EASE_OUT_EXPO },
                },
              }}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectMode(portal.mode)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMode(portal.mode);
                }
              }}
            >
              <span className="portal__number">{portal.number}</span>
              <span className="portal__icon" aria-hidden="true">
                {portal.icon}
              </span>
              <div className="portal__label">
                <h2 className="portal__name">{t('hub.mode.' + portal.mode)}</h2>
                <p className="portal__desc">{t('hub.modeDesc.' + portal.mode)}</p>
              </div>
              <span className="portal__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="hub-stats">
        <div className="hub-stat">
          <span>{`${t('hub.stat.bestStreak')}:`}</span>
          <AnimatedStatValue value={allTimeBestStreak} />
        </div>
        <div className="hub-stat">
          <span>{`${t('hub.stat.sessions')}:`}</span>
          <AnimatedStatValue value={totalSessions} />
        </div>
        <div className="hub-stat">
          <span>{`${t('hub.stat.notesMastered')}:`}</span>
          <AnimatedStatValue value={totalCorrect} />
        </div>
      </div>
    </div>
  );
}
