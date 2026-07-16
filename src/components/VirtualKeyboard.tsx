/**
 * VirtualKeyboard 组件
 * ============================================
 * 虚拟钢琴键盘，在没有 MIDI 设备时可用于练习。
 * 支持单音和和弦模式：和弦模式下高亮已弹对的音符。
 */

import { useMemo } from 'react';
import type { NoteInfo, AnswerState, ChordInfo, TrainingMode } from '../types';
import { midiToNoteInfo } from '../lib/music';

interface VirtualKeyboardProps {
  currentNote: NoteInfo | null;
  currentChord: ChordInfo | null;
  answerState: AnswerState;
  pressedNote: number | null;
  playedIndices: number[];
  wrongNote: number | null;
  mode: TrainingMode;
  range: { low: number; high: number };
  onKeyPress: (midi: number) => void;
  disabled?: boolean;
}

/** 判断一个 MIDI 音是否为黑键 */
function isBlackKey(midi: number): boolean {
  const pc = midi % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

export function VirtualKeyboard({
  currentNote,
  currentChord,
  answerState,
  pressedNote,
  playedIndices,
  wrongNote,
  mode,
  range,
  onKeyPress,
  disabled,
}: VirtualKeyboardProps) {
  // 生成范围内的所有 MIDI 音
  const allMidiNotes = useMemo(() => {
    const notes: number[] = [];
    for (let m = range.low; m <= range.high; m++) {
      notes.push(m);
    }
    return notes;
  }, [range]);

  // 白键和黑键
  const whiteKeys = allMidiNotes.filter((m) => !isBlackKey(m));
  const blackKeys = allMidiNotes.filter((m) => isBlackKey(m));

  // 和弦模式下需要高亮的 MIDI 音
  const chordMidis = useMemo(() => {
    if (mode === 'chord' && currentChord) {
      return new Set(currentChord.notes.map((n) => n.midi));
    }
    if (mode === 'single' && currentNote) {
      return new Set([currentNote.midi]);
    }
    return new Set<number>();
  }, [currentChord, currentNote, mode]);

  // 已正确弹奏的 MIDI 音（和弦模式）
  const playedMidis = useMemo(() => {
    if (mode === 'chord' && currentChord) {
      return new Set(playedIndices.map((i) => currentChord.notes[i]?.midi).filter((m) => m !== undefined));
    }
    return new Set<number>();
  }, [playedIndices, currentChord, mode]);

  const showTarget = answerState === 'revealed' || answerState === 'correct';

  return (
    <div className="virtual-keyboard">
      <p className="virtual-keyboard__label">🎹 虚拟键盘（无 MIDI 设备时可使用）</p>
      <div className="keyboard-container">
        {/* 白键 */}
        <div className="keyboard-white-row">
          {whiteKeys.map((midi) => {
            const info = midiToNoteInfo(midi);
            const isTarget = showTarget && chordMidis.has(midi);
            const isPlayed = playedMidis.has(midi);
            const isWrong = wrongNote === midi;
            const isPressed = pressedNote === midi;
            let className = 'key key--white';
            if (isTarget) className += ' key--target';
            if (isPlayed) className += ' key--played';
            if (isWrong) className += ' key--wrong';
            if (isPressed && !isWrong) className += ' key--pressed';

            return (
              <button
                key={midi}
                className={className}
                disabled={disabled}
                onClick={() => onKeyPress(midi)}
                title={`${info.name}${info.octave}`}
              >
                <span className="key-label">{info.name}{info.octave}</span>
              </button>
            );
          })}
        </div>

        {/* 黑键（绝对定位叠加在白键之间） */}
        <div className="keyboard-black-row">
          {blackKeys.map((midi) => {
            const info = midiToNoteInfo(midi);
            const isTarget = showTarget && chordMidis.has(midi);
            const isPlayed = playedMidis.has(midi);
            const isWrong = wrongNote === midi;
            const isPressed = pressedNote === midi;

            // 计算黑键的水平位置
            const prevWhiteIndex = whiteKeys.findIndex((w) => w > midi);
            const whiteIndex = prevWhiteIndex === -1 ? whiteKeys.length - 1 : prevWhiteIndex - 1;
            const leftPercent = ((whiteIndex + 1) / whiteKeys.length) * 100;

            let className = 'key key--black';
            if (isTarget) className += ' key--target';
            if (isPlayed) className += ' key--played';
            if (isWrong) className += ' key--wrong';
            if (isPressed && !isWrong) className += ' key--pressed';

            return (
              <button
                key={midi}
                className={className}
                disabled={disabled}
                onClick={() => onKeyPress(midi)}
                title={`${info.name}${info.octave}`}
                style={{ left: `${leftPercent}%` }}
              >
                <span className="key-label key-label--black">{info.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
