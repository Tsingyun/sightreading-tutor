/**
 * FreePlayArena — Free Play Module
 * ============================================
 * Real-time chord identification and notation display.
 * Uses grand staff to show all pressed notes across treble and bass.
 */

import { motion, AnimatePresence } from 'motion/react';
import { StaffCanvas } from './StaffCanvas';
import { midiToNoteInfo } from '../lib/music';
import { useLanguage } from '../i18n/LanguageContext';
import type { UseFreePlayReturn } from '../hooks/useFreePlay';

interface FreePlayArenaProps {
  freePlay: UseFreePlayReturn;
}

export function FreePlayArena({ freePlay }: FreePlayArenaProps) {
  const { t } = useLanguage();
  const { displayedNotes, chordInfo } = freePlay;

  const notes = displayedNotes.map((m) => midiToNoteInfo(m));

  return (
    <div className="arena-content">
      <div className="freeplay-arena">
        {/* Chord display */}
        <div className="freeplay-chord-display">
          <AnimatePresence mode="wait">
            {chordInfo && chordInfo.notes.length > 1 ? (
              <motion.div
                key={`${chordInfo.chordName}-${chordInfo.notes.map((n) => n.midi).join(',')}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span className="freeplay-chord-display__category">
                  {chordInfo.notes.length === 2 ? t('freeplay.interval') : t('freeplay.chord')}
                </span>
                <span className="freeplay-chord-display__name">
                  {chordInfo.chordName || '—'}
                </span>
                {chordInfo.inversionName && (
                  <span className="freeplay-chord-display__inversion">
                    {chordInfo.inversionName}
                  </span>
                )}
              </motion.div>
            ) : chordInfo && chordInfo.notes.length === 1 ? (
              <motion.div
                key={`single-${chordInfo.notes[0].midi}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span className="freeplay-chord-display__category">{t('freeplay.note')}</span>
                <span className="freeplay-chord-display__name">
                  {chordInfo.notes[0].name}{chordInfo.notes[0].octave}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <span className="freeplay-chord-display__category">{t('freeplay.emptyTitle')}</span>
                <span className="freeplay-chord-display__name" style={{ color: 'var(--fg-tertiary)', textShadow: 'none' }}>
                  {t('freeplay.playToBegin')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Staff with grand staff */}
        <StaffCanvas
          note={null}
          chord={notes.length > 0 ? notes : null}
          playedIndices={notes.map((_, i) => i)}
          answerState="pending"
          clefMode="both"
        />

        {/* Note badges */}
        {notes.length > 0 && (
          <motion.div
            className="freeplay-note-badges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {notes.map((note, i) => (
              <motion.span
                key={`${note.midi}-${i}`}
                className={`freeplay-note-badge ${chordInfo?.bassNote?.midi === note.midi ? 'freeplay-note-badge--bass' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="freeplay-note-badge__name">{note.name}</span>
                <span className="freeplay-note-badge__octave">{note.octave}</span>
              </motion.span>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
