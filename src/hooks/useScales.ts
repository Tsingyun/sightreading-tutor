/**
 * useScales Hook — 音阶流动练习（音游式连续滚动）
 * ============================================
 * 类似音游：一串音符从右往左连续流动，当前音停在视口左侧，
 * 弹奏正确后立即推进并刷新一个新音符（音游式左移动画由 StaffCanvas
 * 复用 renderSongStaff 的整条平移实现）。
 *
 * - 音符按音阶上/下行生成，触底后反向上行，并周期性切换音阶/根音，
 *   从而实现"多个音阶"的连续练习。
 * - 统计复用 TrainingStats 结构，可直接喂给 StatsHud 与 Review。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NoteInfo, AnswerState, TrainingStats } from '../types';
import { midiToNoteInfo } from '../lib/music';

/** 音阶定义：升序半音间隔（含八度） */
const SCALE_RUNS: { name: string; intervals: number[] }[] = [
  { name: 'major', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  { name: 'naturalMinor', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  { name: 'harmonicMinor', intervals: [0, 2, 3, 5, 7, 8, 11, 12] },
  { name: 'pentatonic', intervals: [0, 2, 4, 7, 9, 12] },
  { name: 'majorArp', intervals: [0, 4, 7, 12] },
  { name: 'minorArp', intervals: [0, 3, 7, 12] },
];

/** 音域：高音谱号 C4(60) ~ A5(81) */
const SCALE_LOW = 60;
const SCALE_HIGH = 81;

/** 前方预生成的音符数量（保证流动不断） */
const GEN_AHEAD = 10;

/** 历史保留上限：当前索引超过该值后裁剪左侧已弹奏的音符 */
const HISTORY_CAP = 16;
const HISTORY_KEEP = 8;

/** 反应时间上限（毫秒） */
const MAX_REACTION_TIME = 5000;

/** 生成器状态 */
interface GenState {
  degree: number;
  dir: 1 | -1;
  run: { name: string; intervals: number[] };
  root: number;
}

export interface UseScalesReturn {
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

export function useScales(): UseScalesReturn {
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
  const genRef = useRef<GenState>({ degree: 0, dir: 1, run: SCALE_RUNS[0], root: 60 });
  const questionStartRef = useRef(0);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // —— 工具函数 ——

  const makeNote = useCallback((midi: number): NoteInfo => {
    const n = midiToNoteInfo(midi);
    n.clef = 'treble';
    return n;
  }, []);

  const pickRunAndRoot = useCallback(() => {
    const run = SCALE_RUNS[Math.floor(Math.random() * SCALE_RUNS.length)];
    const top = run.intervals[run.intervals.length - 1];
    const minR = SCALE_LOW;
    const maxR = SCALE_HIGH - top;
    const root = minR + Math.floor(Math.random() * Math.max(1, maxR - minR + 1));
    return { run, root };
  }, []);

  /** 生成下一个音的 MIDI（并更新生成器状态） */
  const stepGen = useCallback((): number => {
    const g = genRef.current;
    const intervals = g.run.intervals;
    let d = g.degree + g.dir;

    if (d > intervals.length - 1) {
      g.dir = -1;
      d = intervals.length - 2;
    } else if (d < 0) {
      g.dir = 1;
      d = 1;
    }
    g.degree = d;

    // 触底回升时，有概率切换音阶/根音，实现"多个音阶"交替练习
    if (d === 0 && Math.random() < 0.5) {
      const pick = pickRunAndRoot();
      g.run = pick.run;
      g.root = pick.root;
      g.degree = 0;
      g.dir = 1;
      return g.root + g.run.intervals[0];
    }

    return g.root + intervals[d];
  }, [pickRunAndRoot]);

  /** 保证前方有足够未弹奏音符 */
  const topUp = useCallback((arr: NoteInfo[]): NoteInfo[] => {
    while (arr.length - indexRef.current < GEN_AHEAD) {
      arr.push(makeNote(stepGen()));
    }
    return arr;
  }, [makeNote, stepGen]);

  // —— 开始 ——
  const start = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    const pick = pickRunAndRoot();
    genRef.current = { degree: 0, dir: 1, run: pick.run, root: pick.root };

    const arr: NoteInfo[] = [makeNote(pick.root + pick.run.intervals[0])];
    for (let i = 1; i < GEN_AHEAD + 4; i++) {
      arr.push(makeNote(stepGen()));
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
  }, [makeNote, pickRunAndRoot, stepGen]);

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
  const submitAnswer = useCallback((midi: number): boolean => {
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
        const arr = [...notesRef.current];
        topUp(arr);

        // 裁剪过长历史，保持动画流畅
        let newIdx = ni;
        let newArr = arr;
        if (newIdx > HISTORY_CAP) {
          newArr = arr.slice(newIdx - HISTORY_KEEP);
          newIdx = HISTORY_KEEP;
        }

        notesRef.current = newArr;
        indexRef.current = newIdx;
        questionStartRef.current = performance.now();

        setNotes([...newArr]);
        setCurrentIndex(newIdx);
        setAnswerState('pending');
        answerStateRef.current = 'pending';
      }, 140);

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
  }, [topUp]);

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
