/**
 * useFreePlay Hook
 * ============================================
 * 自由弹奏模式：追踪当前按下的 MIDI 音符，
 * 实时识别和弦类型和转位。
 *
 * 音符释放延迟：
 * - activeNotes: 当前实际按下的音符（立即响应 MIDI）
 * - displayedNotes: 屏幕上显示的音符（松开后延迟 2s 消失）
 * - chordInfo 从 displayedNotes 派生，确保用户有时间阅读和弦名称
 *
 * 性能：chordInfo 使用 useMemo 直接派生，避免双重渲染。
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { identifyChord } from '../lib/music';
import type { IdentifiedChord } from '../types';

/** 音符释放后继续显示的延迟时间（毫秒） */
const RELEASE_DELAY = 2000;

export interface UseFreePlayReturn {
  /** 当前按下的 MIDI 音符（用于键盘高亮） */
  activeNotes: number[];
  /** 屏幕上显示的音符（含释放延迟，用于五线谱和和弦信息） */
  displayedNotes: number[];
  /** 识别出的和弦信息（基于 displayedNotes） */
  chordInfo: IdentifiedChord | null;
  /** 按下音符 */
  handleNoteOn: (midi: number) => void;
  /** 松开音符（displayedNotes 延迟清除） */
  handleNoteOff: (midi: number) => void;
  /** 清除所有音符（立即） */
  clearAll: () => void;
}

export function useFreePlay(): UseFreePlayReturn {
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [displayedNotes, setDisplayedNotes] = useState<number[]>([]);
  const releaseTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // 从 displayedNotes 派生 chordInfo
  const chordInfo = useMemo<IdentifiedChord | null>(() => {
    if (displayedNotes.length === 0) return null;
    return identifyChord(displayedNotes);
  }, [displayedNotes]);

  const handleNoteOn = useCallback((midi: number) => {
    // 取消该音符的释放定时器（如果存在）
    const timer = releaseTimersRef.current.get(midi);
    if (timer) {
      clearTimeout(timer);
      releaseTimersRef.current.delete(midi);
    }

    setActiveNotes((prev) => {
      if (prev.includes(midi)) return prev;
      return [...prev, midi].sort((a, b) => a - b);
    });
    setDisplayedNotes((prev) => {
      if (prev.includes(midi)) return prev;
      return [...prev, midi].sort((a, b) => a - b);
    });
  }, []);

  const handleNoteOff = useCallback((midi: number) => {
    // 立即从 activeNotes 移除（键盘高亮消失）
    setActiveNotes((prev) => prev.filter((m) => m !== midi));

    // 延迟从 displayedNotes 移除（五线谱和和弦信息保留）
    const timer = setTimeout(() => {
      setDisplayedNotes((prev) => prev.filter((m) => m !== midi));
      releaseTimersRef.current.delete(midi);
    }, RELEASE_DELAY);
    releaseTimersRef.current.set(midi, timer);
  }, []);

  const clearAll = useCallback(() => {
    // 清除所有释放定时器
    releaseTimersRef.current.forEach((timer) => clearTimeout(timer));
    releaseTimersRef.current.clear();
    setActiveNotes([]);
    setDisplayedNotes([]);
  }, []);

  return {
    activeNotes,
    displayedNotes,
    chordInfo,
    handleNoteOn,
    handleNoteOff,
    clearAll,
  };
}
