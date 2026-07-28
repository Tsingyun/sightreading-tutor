/**
 * Review 组件 — 会话总结屏
 * ============================================
 * 练习结束后展示本次会话的统计：准确率、最高连击、平均反应时间、时长，
 * 并根据准确率给出鼓励性寄语。可"再来一次"或"返回 Hub"。
 *
 * 动画策略：
 * - 卡片本体 + 内部元素由 motion 驱动，错峰淡入上移（stagger）。
 * - 寄语用 AnimatePresence 按准确率档位 key 切换，支持交叉淡入淡出。
 */

import { motion, AnimatePresence } from 'motion/react';
import type { AppMode, SessionStats } from '../types';

interface ReviewProps {
  stats: SessionStats;
  onRetry: () => void;
  onBackToHub: () => void;
}

/** 与 --ease-out-expo 一致的三次贝塞尔，供 motion 复用 */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** 模式 → 标题 */
const TITLE_BY_MODE: Record<AppMode, string> = {
  training: 'Sight Reading Session',
  freeplay: 'Free Play Session',
  rhythm: 'Rhythm Session',
  song: 'Repertoire Session',
};

/** 准确率档位 → 寄语 */
const MESSAGE_TIERS: { tier: string; min: number; text: string }[] = [
  {
    tier: 'exquisite',
    min: 90,
    text: 'Exquisite. Your reading grows sharper with each session.',
  },
  {
    tier: 'well',
    min: 70,
    text: 'Well done. The notes are becoming familiar territory.',
  },
  {
    tier: 'steady',
    min: 50,
    text: 'Steady progress. Every session builds your intuition.',
  },
  {
    tier: 'begin',
    min: 0,
    text: 'Every master began here. Return when ready.',
  },
];

function getMessage(accuracy: number): { tier: string; text: string } {
  const match =
    MESSAGE_TIERS.find((entry) => accuracy >= entry.min) ??
    MESSAGE_TIERS[MESSAGE_TIERS.length - 1];
  return { tier: match.tier, text: match.text };
}

/** 秒数格式化为 "Xm Ys" 或 "Xs" */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

/** 子元素入场变体（参与卡片 stagger） */
const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

export function Review({ stats, onRetry, onBackToHub }: ReviewProps) {
  const accuracy = Math.round((stats.correct / Math.max(stats.total, 1)) * 100);
  const message = getMessage(accuracy);

  return (
    <div className="screen-review">
      <motion.div
        className="review-card"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.7,
              ease: EASE_OUT_EXPO,
              delayChildren: 0.2,
              staggerChildren: 0.12,
            },
          },
        }}
      >
        <motion.p className="review-card__pretitle" variants={itemVariant}>
          SESSION COMPLETE
        </motion.p>

        <motion.h1 className="review-card__title" variants={itemVariant}>
          {TITLE_BY_MODE[stats.mode]}
        </motion.h1>

        <motion.div className="review-stats" variants={itemVariant}>
          <div className="review-stat">
            <span className="review-stat__value">{accuracy}%</span>
            <span className="review-stat__label">Accuracy</span>
          </div>
          <div className="review-stat">
            <span className="review-stat__value review-stat__value--sage">
              {stats.bestStreak}
            </span>
            <span className="review-stat__label">Best Streak</span>
          </div>
          <div className="review-stat">
            <span className="review-stat__value review-stat__value--terra">
              {Math.round(stats.avgReactionTime)}
            </span>
            <span className="review-stat__label">Avg Time · ms</span>
          </div>
          <div className="review-stat">
            <span className="review-stat__value">{formatDuration(stats.duration)}</span>
            <span className="review-stat__label">Duration</span>
          </div>
        </motion.div>

        {/* 寄语：按档位 key 切换，crossfade 进出 */}
        <AnimatePresence mode="wait">
          <motion.p
            key={message.tier}
            className="review-card__message"
            initial={{ opacity: 0, y: 16 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.5 },
            }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.3, ease: EASE_OUT_EXPO } }}
          >
            {message.text}
          </motion.p>
        </AnimatePresence>

        <motion.div className="review-card__actions" variants={itemVariant}>
          <button className="review-btn review-btn--primary" onClick={onRetry}>
            Practice Again
          </button>
          <button className="review-btn review-btn--ghost" onClick={onBackToHub}>
            Back to Hub
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
