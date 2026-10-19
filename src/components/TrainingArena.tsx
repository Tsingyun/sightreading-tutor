/**
 * TrainingArena — 阶段一 · 逐音识谱
 * ============================================
 * 统一「旋律之旅」的第一阶段：不再随机跳音，而是选中一首真实
 * 歌曲后，跟随它的完整旋律依次识谱——弹对当前音，旋律便前进
 * 到下一个音；读完整首歌后，自然过渡到阶段二「乐曲练习」，
 * 用同一首歌整曲跟弹。
 *
 * 页面顶部以 MelodyBanner 显示歌名与进度，与乐曲练习完全一致。
 * 和弦辨认模式（设置中切换）仍为随机和弦题，不占用旋律流程。
 */

import { motion } from 'motion/react';
import { StaffCanvas } from './StaffCanvas';
import { FeedbackOverlay } from './FeedbackOverlay';
import { MelodyBanner } from './MelodyBanner';
import { SongPicker } from './SongPicker';
import { useLanguage } from '../i18n/LanguageContext';
import type { UseTrainingReturn } from '../hooks/useTraining';
import type { PresetSong } from '../lib/songLibrary';
import { getKeySignatureConfig } from '../lib/music';

interface TrainingArenaProps {
  training: UseTrainingReturn;
  /** 读完旋律后进入同一首歌的乐曲练习（阶段二） */
  onGoToSongPractice: (song: PresetSong) => void;
}

export function TrainingArena({ training, onGoToSongPractice }: TrainingArenaProps) {
  const { t } = useLanguage();
  const {
    currentNote,
    currentChord,
    playedIndices,
    answerState,
    config,
    isTraining,
    flashLabel,
    hintLevel,
    hintText,
    melodySong,
    melodyIndex,
    melodyTotal,
    isMelodyComplete,
    selectSong,
    dismissMelodyComplete,
    startTraining,
    stopTraining,
    skipQuestion,
    revealAnswer,
    retry,
    requestHint,
  } = training;

  const keySigVex = config.keySignature
    ? getKeySignatureConfig(config.keySignature).vexKey
    : 'C';

  const isChordMode = config.mode === 'chord';
  const progress = melodyTotal > 0 ? Math.round((melodyIndex / melodyTotal) * 100) : 0;

  // —— 阶段一完成：读完整首旋律 → 过渡到乐曲练习 ——
  if (isMelodyComplete && !isChordMode) {
    return (
      <div className="arena-content">
        <motion.div
          className="journey-complete"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <MelodyBanner
            song={melodySong}
            stage="reading"
            progress={100}
            progressText={t('journey.noteProgress', { current: melodyTotal, total: melodyTotal })}
          />
          <div className="journey-complete__title">{t('journey.completeTitle')}</div>
          <p className="journey-complete__body">{t('journey.completeBody')}</p>
          <div className="journey-complete__actions">
            <motion.button
              className="training-start__btn"
              onClick={() => onGoToSongPractice(melodySong)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('journey.stage2')} · 《{melodySong.name}》 →
            </motion.button>
            <button className="feedback-btn" onClick={startTraining}>
              {t('journey.readAgain')}
            </button>
            <button className="feedback-btn" onClick={dismissMelodyComplete}>
              {t('journey.chooseAnother')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // —— 未开始：先选歌（与乐曲练习共用同一曲库），再开始逐音识谱 ——
  if (!isTraining && answerState === 'idle') {
    return (
      <div className="arena-content arena-content--scroll">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '800px' }}
        >
          <div className="training-start" style={{ marginBottom: '28px', gap: '16px' }}>
            <div className="training-start__title">
              {isChordMode ? t('training.startTitleChord') : t('journey.chooseSong')}
            </div>
            {!isChordMode && (
              <>
                <div className="journey-selected-song">
                  {t('journey.nowReading')}：《{melodySong.name}》
                  <span className="journey-selected-song__en">{melodySong.nameEn}</span>
                </div>
                <motion.button
                  className="training-start__btn"
                  onClick={startTraining}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {t('journey.beginReading')}《{melodySong.name}》
                </motion.button>
              </>
            )}
            {isChordMode && (
              <motion.button
                className="training-start__btn"
                onClick={startTraining}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                {t('training.begin')}
              </motion.button>
            )}
          </div>
          {!isChordMode && (
            <SongPicker selectedId={melodySong.id} onSelect={selectSong} />
          )}
        </motion.div>
      </div>
    );
  }

  const chordName = currentChord?.name ?? undefined;

  return (
    <>
      <div className="arena-content">
        {/* 歌名与进度：与乐曲练习完全相同的标题栏 */}
        {!isChordMode ? (
          <MelodyBanner
            song={melodySong}
            stage="reading"
            progress={progress}
            progressText={t('journey.noteProgress', {
              current: Math.min(melodyIndex + 1, melodyTotal),
              total: melodyTotal,
            })}
          />
        ) : null}

        <StaffCanvas
          note={currentNote}
          chord={currentChord?.notes ?? null}
          playedIndices={playedIndices}
          answerState={answerState}
          clefMode={isChordMode ? config.clef : 'treble'}
          showLabel={answerState === 'revealed'}
          alwaysShowLabel={config.showNoteLabel}
          flashLabel={flashLabel}
          chordName={chordName}
          keySignature={keySigVex}
        />

        <FeedbackOverlay
          answerState={answerState}
          hintLevel={hintLevel}
          hintText={hintText}
          onReveal={revealAnswer}
          onNext={skipQuestion}
          onRetry={retry}
          onHint={requestHint}
          noteName={currentNote?.name}
          chordName={chordName}
        />
      </div>

      {/* Active controls when training — positioned top-left to avoid staff overlap */}
      {isTraining && (
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
          <button className="feedback-btn" onClick={skipQuestion}>{t('training.skip')}</button>
          <button className="feedback-btn" onClick={stopTraining}>{t('training.end')}</button>
        </motion.div>
      )}
    </>
  );
}
