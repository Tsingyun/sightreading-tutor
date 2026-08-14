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

  // Snap the range to white-key boundaries so the keyboard always
  // starts and ends on a white key (a real piano never starts on a black key).
  const snapToWhite = (midi: number, dir: 1 | -1): number => {
    let m = midi;
    while (BLACK_KEY_PATTERNS.has(((m % 12) + 12) % 12)) {
      m += dir;
    }
    return m;
  };
  const rangeLow = snapToWhite(range.low, -1);
  const rangeHigh = snapToWhite(range.high, 1);

  // Generate all keys in range
  const allKeys: number[] = [];
  for (let m = rangeLow; m <= rangeHigh; m++) {
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

  // Calculate black key positions.
  // A black key always sits exactly on the right edge of the white key just
  // below it. whiteKeys is sorted ascending by MIDI, so we find the last white
  // key whose MIDI value is below this black key, then center the black key on
  // that white key's right boundary.
  const getBlackKeyStyle = (midi: number): React.CSSProperties => {
    let whiteBelowIndex = -1;
    for (let i = 0; i < whiteKeys.length; i++) {
      if (whiteKeys[i] < midi) {
        whiteBelowIndex = i;
      } else {
        break;
      }
    }

    const whiteCount = whiteKeys.length;
    const leftPercent = ((whiteBelowIndex + 1) / whiteCount) * 100;
    const keyWidth = (1 / whiteCount) * 100;
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
