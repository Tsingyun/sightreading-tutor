/**
 * SongArena — Repertoire Practice Module
 * ============================================
 * Play through preset songs with staff notation + cursor.
 * Follow mode (play to advance) or auto-play mode.
 */

import { motion } from 'motion/react';
import { StaffCanvas } from './StaffCanvas';
import { SONG_LIBRARY } from '../lib/songLibrary';
import type { UseSongPracticeReturn } from '../hooks/useSongPractice';

interface SongArenaProps {
  songPractice: UseSongPracticeReturn;
}

export function SongArena({ songPractice }: SongArenaProps) {
  const {
    currentSong,
    currentIndex,
    isPlaying,
    isFollowMode,
    speedMultiplier,
    stats,
    allNotes,
    answerState,
    loadSong,
    play,
    pause,
    reset,
    setFollowMode,
    setSpeedMultiplier,
  } = songPractice;

  // Song selection state
  if (!currentSong) {
    return (
      <div className="arena-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '800px' }}
        >
          <div className="training-start" style={{ marginBottom: '32px' }}>
            <div className="training-start__title">Choose a piece to perform</div>
          </div>
          <div className="song-library">
            {SONG_LIBRARY.map((song) => (
              <motion.div
                key={song.id}
                className="song-card"
                onClick={() => loadSong(song)}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="song-card__name">{song.name}</div>
                <div className="song-card__composer">{song.composer}</div>
                <div className="song-card__meta">
                  <span>{song.bpm} BPM</span>
                  <span className="song-card__difficulty">
                    {'★'.repeat(song.difficulty)}
                    {'☆'.repeat(5 - song.difficulty)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = allNotes.length > 0
    ? Math.round((currentIndex / allNotes.length) * 100)
    : 0;

  return (
    <>
      <div className="arena-content">
        <div className="song-arena">
          {/* Song info */}
          <motion.div
            className="song-info"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="song-info__name">{currentSong.name}</span>
            <span className="song-info__composer">{currentSong.composer}</span>
          </motion.div>

          {/* Progress bar */}
          <div className="song-progress">
            <motion.div
              className="song-progress__bar"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Staff with song notes */}
          <StaffCanvas
            note={null}
            answerState={answerState}
            clefMode="treble"
            songNotes={allNotes}
            songCurrentIndex={currentIndex}
          />

          {/* Controls */}
          <div className="song-controls">
            {/* Follow / Auto mode */}
            <div className="pill-group">
              <button
                className={`pill ${isFollowMode ? 'pill--active' : ''}`}
                onClick={() => setFollowMode(true)}
              >
                Follow
              </button>
              <button
                className={`pill ${!isFollowMode ? 'pill--active' : ''}`}
                onClick={() => setFollowMode(false)}
              >
                Auto
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
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            )}
            <button className="feedback-btn" onClick={reset}>
              Restart
            </button>
            <button
              className="feedback-btn"
              onClick={() => loadSong(currentSong)}
            >
              Back to Library
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
              <span>Correct: <span style={{ color: 'var(--sage)' }}>{stats.correct}</span></span>
              <span>Wrong: <span style={{ color: 'var(--terracotta)' }}>{stats.wrong}</span></span>
              <span>Progress: <span style={{ color: 'var(--gold)' }}>{progress}%</span></span>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
