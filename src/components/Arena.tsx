/**
 * Arena — Full-Screen Practice Space
 * ============================================
 * Wraps mode-specific practice modules with shared chrome:
 * top bar (back, mode label, settings), keyboard, HUD, MIDI indicator.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingArena } from './TrainingArena';
import { FreePlayArena } from './FreePlayArena';
import { RhythmArena } from './RhythmArena';
import { SongArena } from './SongArena';
import { PianoKeyboard } from './PianoKeyboard';
import { StatsHud } from './StatsHud';
import { SettingsDrawer } from './SettingsDrawer';
import { MidiIndicator } from './MidiIndicator';
import type { AppMode } from '../types';
import type { UseTrainingReturn } from '../hooks/useTraining';
import type { UseFreePlayReturn } from '../hooks/useFreePlay';
import type { UseRhythmReturn } from '../hooks/useRhythm';
import type { UseSongPracticeReturn } from '../hooks/useSongPractice';
import type { UsePianoSoundReturn } from '../hooks/usePianoSound';
import type { UseMidiReturn } from '../hooks/useMidi';

const MODE_LABELS: Record<AppMode, string> = {
  training: 'Sight Reading',
  freeplay: 'Free Play',
  rhythm: 'Rhythm',
  song: 'Repertoire',
};

const KEYBOARD_RANGE: Record<AppMode, { low: number; high: number }> = {
  training: { low: 55, high: 84 },
  freeplay: { low: 36, high: 96 },
  rhythm: { low: 48, high: 72 },
  song: { low: 48, high: 84 },
};

interface ArenaProps {
  mode: AppMode;
  onBack: () => void;
  onSessionEnd: () => void;
  training: UseTrainingReturn;
  freePlay: UseFreePlayReturn;
  rhythm: UseRhythmReturn;
  songPractice: UseSongPracticeReturn;
  pianoSound: UsePianoSoundReturn;
  midi: UseMidiReturn;
  onVirtualKeyPress: (midi: number) => void;
}

export function Arena(props: ArenaProps) {
  const { mode, onBack, training, freePlay, rhythm, songPractice, pianoSound, midi, onVirtualKeyPress } = props;

  const [settingsOpen, setSettingsOpen] = useState(false);

  // ESC to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !settingsOpen) {
        onBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBack, settingsOpen]);

  const renderMode = () => {
    switch (mode) {
      case 'training':
        return <TrainingArena training={training} />;
      case 'freeplay':
        return <FreePlayArena freePlay={freePlay} />;
      case 'rhythm':
        return <RhythmArena rhythm={rhythm} />;
      case 'song':
        return <SongArena songPractice={songPractice} />;
    }
  };

  // Keyboard range: in training mode the keyboard must cover the exact note
  // range being quizzed (so e.g. bass/both clef low notes are playable on screen).
  const keyboardRange =
    mode === 'training'
      ? { low: training.config.lowNote, high: training.config.highNote }
      : KEYBOARD_RANGE[mode];

  // Keyboard state for PianoKeyboard component
  const keyboardProps = {
    range: keyboardRange,
    onKeyPress: onVirtualKeyPress,
    disabled: mode === 'rhythm',
    activeNotes: mode === 'freeplay' ? freePlay.activeNotes : [],
    pressedNote: mode === 'training' ? training.pressedNote : null,
    wrongNote: mode === 'training' ? training.wrongNote : (mode === 'song' ? songPractice.wrongNote : null),
    correctNote: mode === 'training' && training.config.mode === 'single' && (training.answerState === 'correct' || training.answerState === 'revealed') ? training.currentNote?.midi ?? null : null,
    playedIndices: mode === 'training' ? training.playedIndices : [],
    currentChordNotes: mode === 'training' && training.currentChord
      ? training.currentChord.notes.map((n) => n.midi)
      : [],
  };

  return (
    <div className="screen-arena">
      {/* Top bar */}
      <div className="arena-topbar">
        <button className="arena-back" onClick={onBack}>
          <span className="arena-back__icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Hub
        </button>

        <span className="arena-mode-label">{MODE_LABELS[mode]}</span>

        <div className="arena-topbar__right">
          {/* Sound toggle */}
          <button
            className={`arena-icon-btn ${pianoSound.enabled ? 'arena-icon-btn--active' : ''}`}
            onClick={pianoSound.toggle}
            title={pianoSound.enabled ? 'Sound on' : 'Sound off'}
          >
            {pianoSound.enabled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {/* Settings (only for training mode) */}
          {mode === 'training' && (
            <button
              className={`arena-icon-btn ${settingsOpen ? 'arena-icon-btn--active' : ''}`}
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mode-specific content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}
        >
          {renderMode()}
        </motion.div>
      </AnimatePresence>

      {/* Piano Keyboard (hidden for rhythm mode) */}
      {mode !== 'rhythm' && (
        <PianoKeyboard {...keyboardProps} />
      )}

      {/* Stats HUD (training mode only) */}
      {mode === 'training' && (
        <StatsHud
          stats={training.stats}
          allTimeBestStreak={training.allTimeBestStreak}
          visible={training.isTraining}
        />
      )}

      {/* MIDI Indicator */}
      <MidiIndicator
        supported={midi.supported}
        connected={midi.connected}
        connecting={midi.connecting}
        error={midi.error}
        devices={midi.devices}
        selectedDeviceId={midi.selectedDeviceId}
        onConnect={midi.connect}
        onSelect={midi.selectDevice}
      />

      {/* Settings Drawer */}
      {mode === 'training' && (
        <SettingsDrawer
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          config={training.config}
          onUpdate={training.updateConfig}
          soundEnabled={pianoSound.enabled}
          onToggleSound={pianoSound.toggle}
        />
      )}
    </div>
  );
}
