/**
 * TrainingArena — Sight Reading Practice Module
 * ============================================
 * Full-screen practice space for note/chord identification.
 */

import { motion } from 'motion/react';
import { StaffCanvas } from './StaffCanvas';
import { FeedbackOverlay } from './FeedbackOverlay';
import type { UseTrainingReturn } from '../hooks/useTraining';
import { getKeySignatureConfig } from '../lib/music';

interface TrainingArenaProps {
  training: UseTrainingReturn;
}

export function TrainingArena({ training }: TrainingArenaProps) {
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

  // Idle / start state
  if (!isTraining && answerState === 'idle') {
    return (
      <div className="arena-content">
        <motion.div
          className="training-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="training-start__title">
            {config.mode === 'chord'
              ? 'Chord identification awaits'
              : 'Identify the note on the staff'}
          </div>
          <motion.button
            className="training-start__btn"
            onClick={startTraining}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Begin
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const chordName = currentChord?.name ?? undefined;

  return (
    <>
      <div className="arena-content">
        <StaffCanvas
          note={currentNote}
          chord={currentChord?.notes ?? null}
          playedIndices={playedIndices}
          answerState={answerState}
          clefMode={config.clef}
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

      {/* Active controls when training */}
      {isTraining && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 12,
            display: 'flex',
            gap: '8px',
          }}
        >
          <button className="feedback-btn" onClick={skipQuestion}>Skip</button>
          <button className="feedback-btn" onClick={stopTraining}>End</button>
        </motion.div>
      )}
    </>
  );
}
