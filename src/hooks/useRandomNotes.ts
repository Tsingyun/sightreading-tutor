/**
 * useRandomNotes Hook — 随机识谱（音游式连续滚动）
 * ============================================
 * 独立的识谱训练页面：音符在音域内【完全随机】跳动，
 * 既不按音阶走、也不按旋律走，纯粹考验读谱位置反应。
 *
 * 一串音符从右往左连续流动，当前音停在视口左侧，
 * 弹奏正确后立即推进并刷新一个新音符（音游式左移动画由
 * StaffCanvas 复用 renderSongStaff 的整条平移实现）。
 *
 * - 统计复用 TrainingStats 结构，可直接喂给 StatsHud 与 Review。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NoteInfo, AnswerState, TrainingStats } from '../types';
import { midiToNoteInfo } from '../lib/music';

/**
 * 音池：高音谱表 C4(60) ~ C6(84) 的自然音（白键）。
 * 音符从中完全随机抽取，因此会大幅上下跳动、无规律可循。
 */
const NOTE_POOL = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 84];

/** 前方预生成的音符数量（保证流动不断） */
const GEN_AHEAD = 6;

/** 历史保留上限：当前索引超过该值后裁剪左侧已弹奏的音符 */
const HISTORY_CAP = 8;
const HISTORY_KEEP = 4;

/** 反应时间上限（毫秒） */
const MAX_REACTION_TIME = 5000;

export interface UseRandomNotesReturn {
  /** 当前可见音符队列（含已弹奏/未弹奏） */
  notes: NoteInfo[];
  /** 待弹奏音符在队列中的索引 */
  currentIndex: number;
  /** 答题状态 */
  answerState: AnswerState;
  /** 统计（复用 TrainingStats 结构） */
  stats: TrainingStats;
  /** 是否练习中 */
  isPlaying: boolean;
  /** 最近按错的音（键盘红色高亮，短暂） */
  wrongNote: number | null;
  /** 开始练习 */
  start: () => void;
  /** 停止练习（回起始态） */
  stop: () => void;
  /** 提交答案（MIDI 音高），返回是否正确 */
  submitAnswer: (midi: number) => boolean;
  /** 清零统计 */
  reset: () => void;
}

export function useRandomNotes(): UseRandomNotesReturn {
  const [notes, setNotes] = useState<NoteInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [stats, setStats] = useState<TrainingStats>({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    totalReactionTime: 0,
    reactionCount: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [wrongNote, setWrongNote] = useState<number | null>(null);

  const notesRef = useRef<NoteInfo[]>([]);
  const indexRef = useRef(0);
  const answerStateRef = useRef<AnswerState>('idle');
  const isPlayingRef = useRef(false);
  /** 上一个生成的音，用于避免连续重复（保证"跳动"感） */
  const lastMidiRef = useRef<number | null>(null);
  const questionStartRef = useRef(0);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // —— 工具函数 ——

  const makeNote = useCallback((midi: number): NoteInfo => {
    const n = midiToNoteInfo(midi);
    n.clef = 'treble';
    return n;
  }, []);

  /** 完全随机抽取下一个音（避免与上一个音重复） */
  const pickRandom = useCallback((): number => {
    let midi = NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)];
    let guard = 0;
    while (midi === lastMidiRef.current && guard < 8) {
      midi = NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)];
      guard++;
    }
    lastMidiRef.current = midi;
    return midi;
  }, []);

  // —— 开始 ——
  const start = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    lastMidiRef.current = null;

    const arr: NoteInfo[] = [makeNote(pickRandom())];
    for (let i = 1; i < GEN_AHEAD + 4; i++) {
      arr.push(makeNote(pickRandom()));
    }

    notesRef.current = arr;
    indexRef.current = 0;
    questionStartRef.current = performance.now();

    setNotes([...arr]);
    setCurrentIndex(0);
    setAnswerState('pending');
    answerStateRef.current = 'pending';
    setWrongNote(null);
    setStats({
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
      totalReactionTime: 0,
      reactionCount: 0,
    });
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [makeNote, pickRandom]);

  // —— 停止 ——
  const stop = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setAnswerState('idle');
    answerStateRef.current = 'idle';
    setNotes([]);
    notesRef.current = [];
    setCurrentIndex(0);
    indexRef.current = 0;
    setWrongNote(null);
  }, []);

  // —— 提交答案 ——
  const submitAnswer = useCallback(
    (midi: number): boolean => {
      if (!isPlayingRef.current) return false;
      if (answerStateRef.current !== 'pending') return false;

      const idx = indexRef.current;
      const target = notesRef.current[idx];
      if (!target) return false;

      if (midi === target.midi) {
        // 答对
        const rawRT = performance.now() - questionStartRef.current;
        const reactionTime = Math.min(rawRT, MAX_REACTION_TIME);

        setAnswerState('correct');
        answerStateRef.current = 'correct';

        setStats((prev) => {
          const streak = prev.streak + 1;
          return {
            correct: prev.correct + 1,
            total: prev.total + 1,
            streak,
            bestStreak: Math.max(prev.bestStreak, streak),
            totalReactionTime: prev.totalReactionTime + reactionTime,
            reactionCount: prev.reactionCount + 1,
          };
        });

        // 短暂显示绿色后推进并刷新新音符（音游式左移）
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
          const ni = indexRef.current + 1;
          let arr = [...notesRef.current];
          let newIdx = ni;

          // 裁剪过长历史，保持每次重画的音符数较小、动画流畅
          if (newIdx > HISTORY_CAP) {
            arr = arr.slice(newIdx - HISTORY_KEEP);
            newIdx = HISTORY_KEEP;
          }

          // 右侧补足预生成音符（相对当前索引 newIdx）
          while (arr.length - newIdx < GEN_AHEAD + 1) {
            arr.push(makeNote(pickRandom()));
          }

          notesRef.current = arr;
          indexRef.current = newIdx;
          questionStartRef.current = performance.now();

          setNotes([...arr]);
          setCurrentIndex(newIdx);
          setAnswerState('pending');
          answerStateRef.current = 'pending';
        }, 90);

        return true;
      } else {
        // 答错：计为一次失误，红色提示后回到待答，原地重试
        setStats((prev) => ({ ...prev, total: prev.total + 1, streak: 0 }));
        setWrongNote(midi);
        setAnswerState('wrong');
        answerStateRef.current = 'wrong';

        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
          setAnswerState('pending');
          answerStateRef.current = 'pending';
          setWrongNote(null);
        }, 600);
        return false;
      }
    },
    [makeNote, pickRandom],
  );

  // —— 清零统计 ——
  const reset = useCallback(() => {
    setStats({
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
      totalReactionTime: 0,
      reactionCount: 0,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  return {
    notes,
    currentIndex,
    answerState,
    stats,
    isPlaying,
    wrongNote,
    start,
    stop,
    submitAnswer,
    reset,
  };
}
