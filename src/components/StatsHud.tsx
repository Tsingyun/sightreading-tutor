/**
 * StatsHud 组件
 * ============================================
 * 浮动式实时训练统计 HUD。
 * 展示准确率、总题数、平均反应时间、历史最佳连击与当前连击。
 * 使用 motion 实现平滑的淡入 / 淡出。
 */

import { AnimatePresence, motion } from 'motion/react';
import type { TrainingStats } from '../types';

interface StatsHudProps {
  stats: TrainingStats;
  allTimeBestStreak: number;
  visible: boolean;
}

export function StatsHud({ stats, allTimeBestStreak, visible }: StatsHudProps) {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const avgReaction = Math.round(stats.totalReactionTime / Math.max(stats.reactionCount, 1));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`stats-hud ${visible ? 'stats-hud--visible' : ''}`}
          style={{ transition: 'none' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="stats-hud__row">
            <span className="stats-hud__label">ACCURACY</span>
            <span className="stats-hud__value stats-hud__value--sage">{accuracy}%</span>
          </div>

          <div className="stats-hud__row">
            <span className="stats-hud__label">TOTAL</span>
            <span className="stats-hud__value">{stats.total}</span>
          </div>

          <div className="stats-hud__row">
            <span className="stats-hud__label">AVG RT</span>
            <span className="stats-hud__value">{avgReaction} ms</span>
          </div>

          <div className="stats-hud__row">
            <span className="stats-hud__label">BEST</span>
            <span className="stats-hud__value stats-hud__value--gold">{allTimeBestStreak}</span>
          </div>

          <div className="stats-hud__streak">
            <span className="stats-hud__streak-value">{stats.streak}</span>
            <span className="stats-hud__streak-label">Current Streak</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
