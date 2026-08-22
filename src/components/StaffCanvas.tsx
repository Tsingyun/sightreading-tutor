/**
 * StaffCanvas — Nocturne Notation Display
 * ============================================
 * Wraps VexFlow rendering into a declarative React component.
 * Supports single note, chord, and grand staff modes.
 */

import { useRef, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { renderStaff, renderGrandStaff, renderSongStaff, type ThemeColors } from '../lib/vexflow';
import { useLanguage } from '../i18n/LanguageContext';
import type { NoteInfo, AnswerState, ClefType } from '../types';

export interface StaffCanvasProps {
  note: NoteInfo | null;
  chord?: NoteInfo[] | null;
  playedIndices?: number[];
  answerState: AnswerState;
  clefMode: ClefType;
  showLabel?: boolean;
  alwaysShowLabel?: boolean;
  flashLabel?: boolean;
  chordName?: string;
  keySignature?: string;
  idle?: boolean;
  /** Song mode: render a sequence with cursor */
  songNotes?: NoteInfo[] | null;
  songCurrentIndex?: number;
}

const NOCTURNE_COLORS: ThemeColors = {
  staffColor: '#3A3528',
  bgColor: 'transparent',
  noteDefault: '#2A2620',
  noteCorrect: '#5A9E45',
  noteWrong: '#C25E5E',
};

function StaffCanvasImpl(props: StaffCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const {
    note,
    chord,
    playedIndices = [],
    answerState,
    clefMode,
    showLabel,
    alwaysShowLabel,
    flashLabel,
    chordName,
    keySignature = 'C',
    idle,
    songNotes,
    songCurrentIndex = 0,
  } = props;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Song mode
    if (songNotes && songNotes.length > 0) {
      renderSongStaff({
        container,
        notes: songNotes,
        currentIndex: songCurrentIndex,
        answerState,
        themeColors: NOCTURNE_COLORS,
      });
      return;
    }

    // Grand staff mode
    if (clefMode === 'both') {
      renderGrandStaff({
        container,
        note,
        notes: chord,
        playedIndices,
        answerState,
        showLabel,
        alwaysShowLabel,
        flashLabel,
        chordName,
        themeColors: NOCTURNE_COLORS,
        keySignature,
      });
      return;
    }

    // Single staff mode
    renderStaff({
      container,
      note,
      notes: chord,
      playedIndices,
      answerState,
      showLabel,
      alwaysShowLabel,
      flashLabel,
      chordName,
      themeColors: NOCTURNE_COLORS,
      keySignature,
    });
  }, [note, chord, playedIndices, answerState, clefMode, showLabel, alwaysShowLabel, flashLabel, chordName, keySignature, songNotes, songCurrentIndex]);

  const showIdle = idle || (!note && !chord && (!songNotes || songNotes.length === 0));
  const isSong = !!songNotes && songNotes.length > 0;
  const labelNote = chord?.[0] ?? note;
  const labelColorClass =
    answerState === 'wrong' ? 'staff-note-label--terra' :
    answerState === 'correct' || answerState === 'revealed' ? 'staff-note-label--sage' : '';

  return (
    <div className="staff-canvas">
      {isSong ? (
        <motion.div
          className="staff-canvas__song-anim"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* 乐曲模式：长五线谱整体平移，从右往左流动 */}
          <div className="staff-canvas__song-frame">
            <div className="staff-canvas__song-track">
              {/* VexFlow render target — must not contain React-managed children */}
              <div ref={containerRef} className="staff-canvas__song-render" />
            </div>
            {showIdle && (
              <span className="staff-canvas__idle">{t('staff.awaiting')}</span>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="staff-canvas__container"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* VexFlow render target — must not contain React-managed children */}
          <div ref={containerRef} className="staff-canvas__vexflow" />
          {showIdle && (
            <span className="staff-canvas__idle">{t('staff.awaiting')}</span>
          )}
        </motion.div>
      )}

      {/* Note label — absolutely positioned so it never shifts the staff layout */}
      <div className="staff-canvas__label-slot">
        {!showIdle && (showLabel || alwaysShowLabel || flashLabel) && labelNote && !chordName && (
          <motion.div
            className={`staff-note-label ${labelColorClass}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {labelNote.name}{labelNote.octave}
          </motion.div>
        )}

        {!showIdle && chordName && (answerState === 'correct' || answerState === 'revealed') && (
          <motion.div
            className="staff-note-label staff-note-label--sage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {chordName}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export const StaffCanvas = memo(StaffCanvasImpl);
