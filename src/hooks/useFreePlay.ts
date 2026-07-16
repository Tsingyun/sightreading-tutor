/**
 * useFreePlay Hook
 * ============================================
 * 自由弹奏模式：追踪当前按下的 MIDI 音符，
 * 实时识别和弦类型和转位。
 *
 * 与训练模式不同，自由弹奏不判定对错，
 * 只是将用户弹奏的音符实时显示在五线谱上，
 * 并标注音名、和弦名称和转位信息。
 *
 * 性能注意：chordInfo 使用 useMemo 直接从 activeNotes 派生，
 * 而非 useEffect + setState，避免每次按键触发双重渲染。
 */

import { useState, useMemo, useCallback } from 'react';
import { identifyChord } from '../lib/music';
import type { IdentifiedChord } from '../types';

export interface UseFreePlayReturn {
  /** 当前按下的 MIDI 音符列表（按音高升序） */
  activeNotes: number[];
  /** 识别出的和弦信息 */
  chordInfo: IdentifiedChord | null;
  /** 按下音符（MIDI note on） */
  handleNoteOn: (midi: number) => void;
  /** 松开音符（MIDI note off） */
  handleNoteOff: (midi: number) => void;
  /** 清除所有音符 */
  clearAll: () => void;
}

export function useFreePlay(): UseFreePlayReturn {
  const [activeNotes, setActiveNotes] = useState<number[]>([]);

  // 直接从 activeNotes 派生 chordInfo，单次渲染完成
  const chordInfo = useMemo<IdentifiedChord | null>(() => {
    if (activeNotes.length === 0) return null;
    return identifyChord(activeNotes);
  }, [activeNotes]);

  const handleNoteOn = useCallback((midi: number) => {
    setActiveNotes((prev) => {
      if (prev.includes(midi)) return prev;
      return [...prev, midi].sort((a, b) => a - b);
    });
  }, []);

  const handleNoteOff = useCallback((midi: number) => {
    setActiveNotes((prev) => prev.filter((m) => m !== midi));
  }, []);

  const clearAll = useCallback(() => {
    setActiveNotes([]);
  }, []);

  return {
    activeNotes,
    chordInfo,
    handleNoteOn,
    handleNoteOff,
    clearAll,
  };
}
