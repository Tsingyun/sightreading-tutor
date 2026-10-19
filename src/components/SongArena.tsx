/**
 * SongArena — 阶段二 · 乐曲练习
 * ============================================
 * 统一「旋律之旅」的第二阶段：与阶段一共用同一曲库、同一个
 * MelodyBanner 标题栏（歌名/署名/进度）。通常从识谱完成页
 * 带着同一首歌直接进入，也可以在此回阶段一逐音打磨同一首歌。
 * 跟弹模式（弹对才前进）或自动播放模式。
 */

import { motion } from 'motion/react';
import { StaffCanvas } from './StaffCanvas';
import { MelodyBanner } from './MelodyBanner';
import { SongPicker } from './SongPicker';
import { useLanguage } from '../i18n/LanguageContext';
import type { UseSongPracticeReturn } from '../hooks/useSongPractice';
import type { PresetSong } from '../lib/songLibrary';

interface SongArenaProps {
  songPractice: UseSongPracticeReturn;
  /** 回到阶段一，对同一首歌逐音识谱 */
  onGoToSightReading: (song: PresetSong) => void;
}

export function SongArena({ songPractice, onGoToSightReading }: SongArenaProps) {
  const { t } = useLanguage();
  const {
    currentSong,
    currentIndex,
    isPlaying,
    isFollowMode,
    speedMultiplier,
    stats,
    allNotes,
    answerState,
    isFinished,
    loadSong,
    unloadSong,
    play,
    pause,
    reset,
    setFollowMode,
    setSpeedMultiplier,
  } = songPractice;

  // Song selection state（与识谱阶段共用同一选歌器）
  if (!currentSong) {
    return (
      <div className="arena-content arena-content--scroll">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '800px' }}
        >
          <div className="training-start" style={{ marginBottom: '32px' }}>
            <div className="training-start__title">{t('song.choose')}</div>
          </div>
          <SongPicker onSelect={loadSong} />
        </motion.div>
      </div>
    );
  }

  const progress = allNotes.length > 0
    ? Math.min(100, Math.round((currentIndex / allNotes.length) * 100))
    : 0;

  return (
    <>
      <div className="arena-content">
        <div className="song-arena">
          {/* 歌名与进度：与识谱阶段完全相同的标题栏，保证流程连贯 */}
          <MelodyBanner
            song={currentSong}
            stage="performing"
            progress={progress}
            progressText={`${t('song.progress')}: ${progress}%`}
          />

          {/* Staff with song notes */}
          <StaffCanvas
            note={null}
            answerState={answerState}
            clefMode="treble"
            songNotes={allNotes}
            songCurrentIndex={currentIndex}
          />

          {/* 整曲完成：回到识谱打磨，或再演奏一遍 */}
          {isFinished ? (
            <motion.div
              className="journey-complete journey-complete--inline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="journey-complete__title">{t('journey.songCompleteTitle')}</div>
              <p className="journey-complete__body">{t('journey.songCompleteBody')}</p>
              <div className="journey-complete__actions">
                <button
                  className="feedback-btn feedback-btn--primary"
                  onClick={() => onGoToSightReading(currentSong)}
                >
                  {t('journey.stage1')} · 《{currentSong.name}》
                </button>
                <button className="feedback-btn" onClick={reset}>
                  {t('journey.performAgain')}
                </button>
                <button className="feedback-btn" onClick={unloadSong}>
                  {t('journey.chooseAnother')}
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Controls */}
              <div className="song-controls">
                {/* Follow / Auto mode */}
                <div className="pill-group">
                  <button
                    className={`pill ${isFollowMode ? 'pill--active' : ''}`}
                    onClick={() => setFollowMode(true)}
                  >
                    {t('song.follow')}
                  </button>
                  <button
                    className={`pill ${!isFollowMode ? 'pill--active' : ''}`}
                    onClick={() => setFollowMode(false)}
                  >
                    {t('song.auto')}
                  </button>
                </div>

                {/* Speed */}
                <div className="pill-group">
                  {([0.5, 0.75, 1] as const).map((s) => (
                    <button
                      key={s}
                      className={`pill ${speedMultiplier === s ? 'pill--active' : ''}`}
                      onClick={() => setSpeedMultiplier(s)}
                    >
                      {s}×
                    </button>
                  ))}
                </div>

                {/* Play / Pause / Reset */}
                {!isFollowMode && (
                  <button
                    className="feedback-btn feedback-btn--primary"
                    onClick={isPlaying ? pause : play}
                  >
                    {isPlaying ? t('song.pause') : t('song.play')}
                  </button>
                )}
                <button className="feedback-btn" onClick={reset}>
                  {t('song.restart')}
                </button>
                {/* 回阶段一：对同一首歌逐音识谱（统一学习线的反向过渡） */}
                <button
                  className="feedback-btn"
                  onClick={() => onGoToSightReading(currentSong)}
                >
                  {t('journey.backToReading')}
                </button>
                <button className="feedback-btn" onClick={unloadSong}>
                  {t('song.backToLibrary')}
                </button>
              </div>

              {/* Stats */}
              {stats.total > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    gap: '24px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--fg-tertiary)',
                  }}
                >
                  <span>{t('song.correct')}: <span style={{ color: 'var(--sage)' }}>{stats.correct}</span></span>
                  <span>{t('song.wrong')}: <span style={{ color: 'var(--terracotta)' }}>{stats.wrong}</span></span>
                  <span>{t('song.progress')}: <span style={{ color: 'var(--gold)' }}>{progress}%</span></span>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
