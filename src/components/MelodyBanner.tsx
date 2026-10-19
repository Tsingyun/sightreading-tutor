/**
 * MelodyBanner — 统一旋律之旅的歌曲标题栏
 * ============================================
 * 识谱训练（阶段一）与乐曲练习（阶段二）共用的同一块标题区：
 * 无论身处哪个阶段，页面都在同一位置显示当前歌曲的歌名、
 * 原唱/作曲、地区徽章与整体进度，并用「阶段一 → 阶段二」
 * 的步骤指示标明所处位置，让两个阶段看起来是同一条学习线。
 */

import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import type { PresetSong } from '../lib/songLibrary';

export type JourneyStage = 'reading' | 'performing';

interface MelodyBannerProps {
  song: PresetSong;
  stage: JourneyStage;
  /** 当前进度（0–100） */
  progress: number;
  /** 进度文案，如「第 12 / 57 音」或「进度 42%」 */
  progressText: string;
}

export function MelodyBanner({ song, stage, progress, progressText }: MelodyBannerProps) {
  const { t } = useLanguage();
  const credit = song.artist ? `${song.composer} · ${song.artist}` : song.composer;

  return (
    <motion.div
      className="melody-banner"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 阶段步骤：阶段一 逐音识谱 → 阶段二 乐曲练习 */}
      <div className="melody-banner__stages" aria-label={`${t('journey.stage1')} → ${t('journey.stage2')}`}>
        <span className={`melody-stage ${stage === 'reading' ? 'melody-stage--active' : 'melody-stage--done'}`}>
          {t('journey.stage1')}
        </span>
        <span className="melody-stage__arrow" aria-hidden="true">→</span>
        <span className={`melody-stage ${stage === 'performing' ? 'melody-stage--active' : ''}`}>
          {t('journey.stage2')}
        </span>
      </div>

      {/* 歌名：全页最醒目的歌曲标识，两个阶段保持一致 */}
      <div className="melody-banner__title-row">
        <span className="melody-banner__now">
          {stage === 'reading' ? t('journey.nowReading') : t('journey.nowPerforming')}
        </span>
        <h2 className="melody-banner__song-name">《{song.name}》</h2>
        <span className="melody-banner__region">{t(`song.region.${song.region}`)}</span>
      </div>
      <div className="melody-banner__meta">
        <span>{song.nameEn}</span>
        <span aria-hidden="true">·</span>
        <span>{credit}</span>
        <span aria-hidden="true">·</span>
        <span>{song.bpm} BPM</span>
        <span aria-hidden="true">·</span>
        <span className="melody-banner__progress-text">{progressText}</span>
      </div>

      {/* 与乐曲练习完全相同的金色进度条 */}
      <div className="song-progress melody-banner__progress">
        <motion.div
          className="song-progress__bar"
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}
