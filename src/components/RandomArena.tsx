/**
 * RandomArena — 随机识谱模块（音游式连续滚动）
 * ============================================
 * 独立的识谱训练页面：音符在音域内完全随机跳动，不按音阶也不按旋律，
 * 复用 StaffCanvas 的 songNotes 渲染：整条音符从右往左流动，
 * 当前音停在视口左侧，弹奏正确后立刻推进并刷新新音符。
 */

import { motion } from 'motion/react';
import { StaffCanvas } from './StaffCanvas';
import { StatsHud } from './StatsHud';
import { useLanguage } from '../i18n/LanguageContext';
import type { UseRandomNotesReturn } from '../hooks/useRandomNotes';

interface RandomArenaProps {
  random: UseRandomNotesReturn;
  /** 练习结束 → 进入会话总结 */
  onEnd: () => void;
}

export function RandomArena({ random, onEnd }: RandomArenaProps) {
  const { t } = useLanguage();
  const { notes, currentIndex, answerState, stats, isPlaying, start, stop } = random;

  // 起始 / 结束态
  if (!isPlaying && answerState === 'idle') {
    return (
      <div className="arena-content">
        <motion.div
          className="training-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="training-start__title">
            {t('random.startTitle')}
          </div>
          <motion.button
            className="training-start__btn"
            onClick={start}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {t('random.begin')}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="arena-content">
        <StaffCanvas
          note={null}
          answerState={answerState}
          clefMode="treble"
          songNotes={notes}
          songCurrentIndex={currentIndex}
        />

        <div className="scales-hint">
          {answerState === 'wrong'
            ? t('feedback.incorrect')
            : t('feedback.playNote')}
        </div>
      </div>

      {/* 统计 HUD */}
      {isPlaying && (
        <StatsHud
          stats={stats}
          allTimeBestStreak={stats.bestStreak}
          visible={isPlaying}
        />
      )}

      {/* 顶部左：结束 */}
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: '72px',
            left: '28px',
            zIndex: 12,
            display: 'flex',
            gap: '8px',
          }}
        >
          <button className="feedback-btn" onClick={() => { stop(); onEnd(); }}>{t('random.end')}</button>
        </motion.div>
      )}
    </>
  );
}
