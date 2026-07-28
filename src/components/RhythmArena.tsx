/**
 * RhythmArena — Rhythm Training Module
 * ============================================
 * Metronome + pattern visualization + tap scoring.
 */

import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import type { UseRhythmReturn } from '../hooks/useRhythm';

interface RhythmArenaProps {
  rhythm: UseRhythmReturn;
}

export function RhythmArena({ rhythm }: RhythmArenaProps) {
  const {
    bpm,
    timeSignature,
    isPlaying,
    currentBeat,
    beatsPerMeasure,
    pattern,
    currentNoteIndex,
    stats,
    accuracy,
    mode,
    challengePhase,
    lastTapResult,
    matchedNotes,
    setBpm,
    setTimeSignature,
    setMode,
    start,
    stop,
    handleTap,
    playPattern,
    resetStats,
  } = rhythm;

  // Keyboard: spacebar to tap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPlaying) {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, handleTap]);

  return (
    <div className="arena-content">
      <div className="rhythm-arena">
        {/* Mode selector */}
        <div className="rhythm-controls">
          <div className="pill-group">
            <button
              className={`pill ${mode === 'practice' ? 'pill--active' : ''}`}
              onClick={() => setMode('practice')}
            >
              Practice
            </button>
            <button
              className={`pill ${mode === 'challenge' ? 'pill--active' : ''}`}
              onClick={() => setMode('challenge')}
            >
              Challenge
            </button>
          </div>
        </div>

        {/* Beat indicators */}
        <div className="rhythm-visualizer">
          <div className="rhythm-beats">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <motion.div
                key={i}
                className={`rhythm-beat ${i === 0 ? 'rhythm-beat--accent' : ''} ${i === currentBeat && isPlaying ? 'rhythm-beat--active' : ''}`}
                animate={i === currentBeat && isPlaying ? { scale: 1.15 } : { scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>

          {/* Pattern visualization */}
          {pattern.length > 0 && (
            <div className="rhythm-pattern">
              {pattern.map((note, i) => (
                <div
                  key={i}
                  className={`rhythm-note-block rhythm-note-block--${note.type}
                    ${i === currentNoteIndex && isPlaying ? 'rhythm-note-block--active' : ''}
                    ${matchedNotes[i] ? 'rhythm-note-block--matched' : ''}
                  `}
                >
                  {note.type === 'rest' ? '×' : ''}
                </div>
              ))}
            </div>
          )}

          {/* Tap result */}
          <AnimatePresence mode="wait">
            {lastTapResult && (
              <motion.div
                key={`${lastTapResult}-${stats.total}`}
                className={`rhythm-tap-result rhythm-tap-result--${lastTapResult}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {lastTapResult}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BPM and controls */}
        <div className="rhythm-controls">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="rhythm-bpm-display">{bpm}</span>
            <span className="rhythm-bpm-label">BPM</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="pill-group">
              {(['4/4', '3/4', '2/4', '6/8'] as const).map((ts) => (
                <button
                  key={ts}
                  className={`pill ${timeSignature === ts ? 'pill--active' : ''}`}
                  onClick={() => setTimeSignature(ts)}
                >
                  {ts}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="feedback-btn"
                onClick={() => setBpm(Math.max(40, bpm - 5))}
              >
                −5
              </button>
              <button
                className="feedback-btn"
                onClick={() => setBpm(Math.max(40, bpm - 1))}
              >
                −1
              </button>
              <button
                className="feedback-btn"
                onClick={() => setBpm(Math.min(200, bpm + 1))}
              >
                +1
              </button>
              <button
                className="feedback-btn"
                onClick={() => setBpm(Math.min(200, bpm + 5))}
              >
                +5
              </button>
            </div>
          </div>
        </div>

        {/* Tap button + start/stop */}
        <div className="rhythm-controls">
          {!isPlaying ? (
            <motion.button
              className="training-start__btn"
              onClick={start}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              {mode === 'challenge' ? 'Start Challenge' : 'Start Metronome'}
            </motion.button>
          ) : (
            <>
              <motion.button
                className="rhythm-tap-btn"
                onClick={handleTap}
                whileTap={{ scale: 0.92 }}
                disabled={mode === 'challenge' && challengePhase === 'playing'}
              >
                TAP
              </motion.button>
              <button className="feedback-btn feedback-btn--primary" onClick={stop}>
                Stop
              </button>
            </>
          )}

          {!isPlaying && pattern.length > 0 && (
            <button className="feedback-btn" onClick={playPattern}>
              Preview
            </button>
          )}
        </div>

        {/* Stats */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: '24px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--fg-tertiary)' }}
          >
            <span>Accuracy: <span style={{ color: 'var(--gold)' }}>{accuracy}%</span></span>
            <span>Perfect: <span style={{ color: 'var(--sage)' }}>{stats.perfect}</span></span>
            <span>Good: <span style={{ color: 'var(--gold)' }}>{stats.good}</span></span>
            <span>OK: <span style={{ color: 'var(--blue)' }}>{stats.ok}</span></span>
            <span>Miss: <span style={{ color: 'var(--terracotta)' }}>{stats.miss}</span></span>
            {stats.total > 0 && (
              <button className="feedback-btn" onClick={resetStats} style={{ marginLeft: '8px' }}>
                Reset
              </button>
            )}
          </motion.div>
        )}

        {/* Challenge phase indicator */}
        {mode === 'challenge' && isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontStyle: 'italic', color: 'var(--fg-secondary)' }}
          >
            {challengePhase === 'playing'
              ? 'Listen carefully…'
              : challengePhase === 'recording'
                ? 'Now reproduce the rhythm!'
                : ''}
          </motion.div>
        )}
      </div>
    </div>
  );
}
