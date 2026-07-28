/**
 * PianoKeyboard — Nocturne Virtual Keyboard
 * ============================================
 * Floating glass keyboard at the bottom of the Arena.
 * White keys are flex items; black keys are absolutely positioned.
 */

import { memo, useCallback } from 'react';
import { motion } from 'motion/react';

export interface PianoKeyboardProps {
  range: { low: number; high: number };
  onKeyPress: (midi: number) => void;
  activeNotes?: number[];
  pressedNote?: number | null;
  correctNote?: number | null;
  wrongNote?: number | null;
  playedIndices?: number[];
  currentChordNotes?: number[];
  disabled?: boolean;
}

const BLACK_KEY_PATTERNS = new Set([1, 3, 6, 8, 10]); // C#, D#, F#, G#, A#

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

function getNoteLabel(midi: number): string {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[pitchClass]}${octave}`;
}

function PianoKeyboardImpl(props: PianoKeyboardProps) {
  const {
    range,
    onKeyPress,
    activeNotes = [],
    pressedNote = null,
    correctNote = null,
    wrongNote = null,
    playedIndices = [],
    currentChordNotes = [],
    disabled = false,
  } = props;

  // Generate all keys in range
  const allKeys: number[] = [];
  for (let m = range.low; m <= range.high; m++) {
    allKeys.push(m);
  }

  const whiteKeys = allKeys.filter((m) => !BLACK_KEY_PATTERNS.has(((m % 12) + 12) % 12));
  const blackKeys = allKeys.filter((m) => BLACK_KEY_PATTERNS.has(((m % 12) + 12) % 12));

  const getKeyState = useCallback(
    (midi: number): string => {
      const states: string[] = [];
      if (activeNotes.includes(midi)) states.push('active');
      if (pressedNote === midi) states.push('pressed');
      if (wrongNote === midi) states.push('wrong');

      // Correct state: either the correctNote matches, or it's a chord note that's been played
      if (correctNote === midi) states.push('correct');
      if (currentChordNotes.length > 0) {
        const chordIdx = currentChordNotes.indexOf(midi);
        if (chordIdx !== -1 && playedIndices.includes(chordIdx)) {
          states.push('correct');
        }
      }

      return states.join(' ');
    },
    [activeNotes, pressedNote, correctNote, wrongNote, currentChordNotes, playedIndices],
  );

  const handlePointerDown = useCallback(
    (midi: number, e: React.PointerEvent) => {
      e.preventDefault();
      if (!disabled) onKeyPress(midi);
    },
    [disabled, onKeyPress],
  );

  // Calculate black key positions
  const getBlackKeyStyle = (midi: number): React.CSSProperties => {
    const pitchClass = ((midi % 12) + 12) % 12;
    // Find the white key index that this black key sits after
    // C# sits between C and D, D# between D and E, etc.
    const blackKeyWhiteIndex: Record<number, number> = {
      1: 0, // C# after C (index 0)
      3: 1, // D# after D (index 1)
      6: 3, // F# after F (index 3)
      8: 4, // G# after G (index 4)
      10: 5, // A# after A (index 5)
    };

    // Find which white key in our range corresponds
    const octave = Math.floor(midi / 12) - 1;
    const baseMidi = 12 * (octave + 1); // C of this octave
    const whiteOffset = blackKeyWhiteIndex[pitchClass];

    // Count white keys from range.low to the position
    let whiteIndex = 0;
    for (let m = range.low; m < baseMidi + whiteOffset; m++) {
      if (!BLACK_KEY_PATTERNS.has(((m % 12) + 12) % 12)) {
        whiteIndex++;
      }
    }

    const leftPercent = ((whiteIndex + 1) / whiteKeys.length) * 100;
    const keyWidth = (1 / whiteKeys.length) * 100;
    const blackKeyWidth = keyWidth * 0.55;
    return {
      left: `calc(${leftPercent}% - ${blackKeyWidth / 2}%)`,
      width: `${blackKeyWidth}%`,
    };
  };

  return (
    <motion.div
      className="piano-keyboard"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
    >
      <div className="piano-keyboard__keys">
        {whiteKeys.map((midi) => {
          const state = getKeyState(midi);
          return (
            <div
              key={midi}
              className={`piano-key piano-key--white ${state}`}
              onPointerDown={(e) => handlePointerDown(midi, e)}
              role="button"
              tabIndex={0}
              aria-label={getNoteLabel(midi)}
            >
              <span className="piano-keyboard__label">{getNoteLabel(midi)}</span>
            </div>
          );
        })}

        {blackKeys.map((midi) => {
          const state = getKeyState(midi);
          const style = getBlackKeyStyle(midi);
          return (
            <div
              key={midi}
              className={`piano-key piano-key--black ${state}`}
              style={style}
              onPointerDown={(e) => handlePointerDown(midi, e)}
              role="button"
              tabIndex={0}
              aria-label={getNoteLabel(midi)}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

export const PianoKeyboard = memo(PianoKeyboardImpl);
