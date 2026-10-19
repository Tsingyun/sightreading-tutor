/**
 * Nocturne — App Root
 * ============================================
 * Screen routing architecture: Hub → Arena → Review
 *
 * The old single-page layout with header/sidebar/tabs is gone.
 * The app now flows through three distinct full-screen spaces:
 *
 * 1. Hub       — Immersive portal selection (entry point)
 * 2. Arena     — Full-screen practice space (mode-specific)
 * 3. Review    — Session summary (post-practice)
 *
 * All hooks are instantiated here and shared via refs to keep
 * MIDI callbacks fresh without re-registration.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuroraBackground } from './components/AuroraBackground';
import { Hub } from './components/Hub';
import { Arena } from './components/Arena';
import { Review } from './components/Review';
import { ToastSystem } from './components/ToastSystem';
import { Onboarding } from './components/Onboarding';
import { useMidi } from './hooks/useMidi';
import { useTraining } from './hooks/useTraining';
import { useFreePlay } from './hooks/useFreePlay';
import { useSongPractice } from './hooks/useSongPractice';
import { useRhythm } from './hooks/useRhythm';
import { useScales } from './hooks/useScales';
import { usePianoSound } from './hooks/usePianoSound';
import { loadGuideSeen, saveGuideSeen, loadBestStreak, loadStats } from './lib/storage';
import type { AppMode, Screen, SessionStats, ToastItem } from './types';
import type { PresetSong } from './lib/songLibrary';
import { useLanguage } from './i18n/LanguageContext';

function App() {
  // — Screen state —
  const [screen, setScreen] = useState<Screen>('hub');
  const [arenaMode, setArenaMode] = useState<AppMode>('training');
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const { t } = useLanguage();

  // — Hooks (all instantiated at root for MIDI routing) —
  const midi = useMidi();
  const training = useTraining();
  const freePlay = useFreePlay();
  const songPractice = useSongPractice();
  const rhythm = useRhythm();
  const scales = useScales();
  const pianoSound = usePianoSound();

  // — First-time onboarding —
  useEffect(() => {
    if (!loadGuideSeen()) {
      setOnboardingVisible(true);
    }
  }, []);

  const handleOnboardingClose = useCallback(() => {
    setOnboardingVisible(false);
    saveGuideSeen();
  }, []);

  // — Toast helpers —
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // — Milestone toast (replaces old modal) —
  useEffect(() => {
    if (training.milestoneReached) {
      addToast({
        variant: 'gold',
        icon: '★',
        title: t('app.milestoneTitle'),
        message: t('app.milestoneMessage', { n: training.milestoneValue }),
      });
      training.dismissMilestone();
    }
  }, [training.milestoneReached, training.milestoneValue, addToast, training.dismissMilestone]);

  // — Refs for MIDI callback freshness —
  const trainingRef = useRef(training);
  trainingRef.current = training;
  const freePlayRef = useRef(freePlay);
  freePlayRef.current = freePlay;
  const songPracticeRef = useRef(songPractice);
  songPracticeRef.current = songPractice;
  const scalesRef = useRef(scales);
  scalesRef.current = scales;
  const pianoSoundRef = useRef(pianoSound);
  pianoSoundRef.current = pianoSound;
  const arenaModeRef = useRef(arenaMode);
  arenaModeRef.current = arenaMode;

  // — MIDI note registration (once) —
  useEffect(() => {
    midi.onNote((note, velocity, isNoteOn) => {
      const mode = arenaModeRef.current;

      // Sound for all modes
      if (isNoteOn) {
        if (mode === 'freeplay') {
          pianoSoundRef.current.noteOn(note, velocity || 0.7);
        } else {
          pianoSoundRef.current.playNote(note, velocity || 0.7);
        }
      } else if (mode === 'freeplay') {
        pianoSoundRef.current.noteOff(note);
      }

      // Route to appropriate handler
      if (mode === 'freeplay') {
        if (isNoteOn) {
          freePlayRef.current.handleNoteOn(note);
        } else {
          freePlayRef.current.handleNoteOff(note);
        }
      } else if (mode === 'song') {
        if (isNoteOn) {
          songPracticeRef.current.submitAnswer(note);
        }
      } else if (mode === 'scales') {
        if (isNoteOn) {
          scalesRef.current.submitAnswer(note);
        }
      } else {
        if (isNoteOn && trainingRef.current.isTraining) {
          trainingRef.current.submitAnswer(note);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // — Virtual keyboard press handler —
  const handleVirtualKeyPress = useCallback(
    (midiNote: number) => {
      const mode = arenaMode;
      if (mode === 'freeplay') {
        if (freePlay.activeNotes.includes(midiNote)) {
          pianoSound.noteOff(midiNote);
          freePlay.handleNoteOff(midiNote);
        } else {
          pianoSound.noteOn(midiNote);
          freePlay.handleNoteOn(midiNote);
        }
      } else if (mode === 'song') {
        pianoSound.playNote(midiNote);
        songPractice.submitAnswer(midiNote);
      } else if (mode === 'scales') {
        pianoSound.playNote(midiNote);
        scales.submitAnswer(midiNote);
      } else {
        pianoSound.playNote(midiNote);
        training.submitAnswer(midiNote);
      }
    },
    [arenaMode, freePlay, pianoSound, songPractice, training],
  );

  // — Hub → Arena navigation —
  const handleSelectMode = useCallback((mode: AppMode) => {
    setArenaMode(mode);
    setScreen('arena');
  }, []);

  // — 统一旋律之旅：阶段一（识谱）→ 阶段二（乐曲练习），同一首歌 —
  const handleGoToSongPractice = useCallback((song: PresetSong) => {
    if (training.isTraining) training.stopTraining();
    songPractice.loadSong(song);
    setArenaMode('song');
    setScreen('arena');
  }, [training, songPractice]);

  // — 统一旋律之旅：阶段二（乐曲练习）→ 阶段一（识谱），同一首歌 —
  const handleGoToSightReading = useCallback((song: PresetSong) => {
    songPractice.pause();
    // 直接进入这首歌的逐音识谱（强制单音旋律模式）
    training.startSongReading(song);
    setArenaMode('training');
    setScreen('arena');
  }, [songPractice, training]);

  // — Arena → Hub (back button) —
  const handleBackToHub = useCallback(() => {
    // Stop any active sessions
    if (training.isTraining) training.stopTraining();
    if (rhythm.isPlaying) rhythm.stop();
    if (scales.isPlaying) scales.stop();
    if (songPractice.isPlaying) songPractice.pause();
    setScreen('hub');
  }, [training, rhythm, scales, songPractice]);

  // — Arena → Review (session end) —
  const handleSessionEnd = useCallback(() => {
    const src = arenaMode === 'scales' ? scales.stats : training.stats;
    const avgRT = src.reactionCount > 0
      ? Math.round(src.totalReactionTime / src.reactionCount)
      : 0;
    setSessionStats({
      mode: arenaMode,
      correct: src.correct,
      total: src.total,
      streak: src.streak,
      bestStreak: src.bestStreak,
      avgReactionTime: avgRT,
      duration: 0,
    });
    setScreen('review');
  }, [arenaMode, scales.stats, training.stats]);

  // — Review → Arena (retry) —
  const handleRetry = useCallback(() => {
    setScreen('arena');
  }, []);

  // — Review → Hub —
  const handleReviewToHub = useCallback(() => {
    setScreen('hub');
  }, []);

  // — Aggregate stats for Hub —
  const allTimeBestStreak = loadBestStreak();
  const allStats = loadStats();

  return (
    <>
      <AuroraBackground />

      <AnimatePresence mode="wait">
        {screen === 'hub' && (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Hub
              onSelectMode={handleSelectMode}
              allTimeBestStreak={allTimeBestStreak}
              totalSessions={Math.floor(allStats.total / 10)}
              totalCorrect={allStats.correct}
            />
          </motion.div>
        )}

        {screen === 'arena' && (
          <motion.div
            key="arena"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Arena
              mode={arenaMode}
              onBack={handleBackToHub}
              onSessionEnd={handleSessionEnd}
              training={training}
              freePlay={freePlay}
              rhythm={rhythm}
              songPractice={songPractice}
              scales={scales}
              pianoSound={pianoSound}
              midi={midi}
              onVirtualKeyPress={handleVirtualKeyPress}
              onGoToSongPractice={handleGoToSongPractice}
              onGoToSightReading={handleGoToSightReading}
            />
          </motion.div>
        )}

        {screen === 'review' && sessionStats && (
          <motion.div
            key="review"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Review
              stats={sessionStats}
              onRetry={handleRetry}
              onBackToHub={handleReviewToHub}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global overlays */}
      <ToastSystem toasts={toasts} onDismiss={dismissToast} />
      <Onboarding visible={onboardingVisible} onClose={handleOnboardingClose} />
    </>
  );
}

export default App;
