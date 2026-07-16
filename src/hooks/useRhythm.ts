/**
 * useRhythm Hook
 * ============================================
 * 节奏训练模块：基于 Web Audio API 的节拍器 + 节奏型生成 + 敲击检测。
 *
 * 核心能力：
 * - 节拍器：AudioContext + 振荡器点击声（lookahead 调度，精准定时）
 * - BPM 控制（40-200，默认 80）
 * - 拍号控制（4/4、3/4、2/4、6/8）
 * - 节奏型生成：四分、八分、二分音符与四分休止符的随机组合（4-8 拍）
 * - 敲击检测：用户按空格/键，对比最近节拍的时间偏差评分
 *   · ±100ms = 完美(perfect)
 *   · ±200ms = 良好(good)
 *   · ±300ms = 一般(ok)
 *   · 超出   = 错过(miss)
 * - 统计：总敲击数、各级别计数、准确率
 * - 练习模式：节拍器持续运行，用户跟拍，每次敲击评分
 * - 挑战模式：播放一次节奏型，用户凭记忆复现
 *
 * 计时原理：
 * - 调度器（setInterval 25ms）提前 ~120ms 用 oscillator.start(time) 排定点击，
 *   避免setTimeout 漂移；绘制循环（requestAnimationFrame）从音频时钟推导
 *   当前拍 / 节奏型游标，保证视觉与声音同步。
 * - 敲击评分统一使用 AudioContext.currentTime（与节拍网格同一时间域）。
 *
 * 说明：拍号下方的数字单位决定“一拍”。
 * 4/4、3/4、2/4 → 每拍四分音符；6/8 → 每拍八分音符（6 拍/小节）。
 * BPM 始终表示「每分钟的拍数（点击数）」。
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/* ------------------------------------------------------------------ *
 * 类型定义
 * ------------------------------------------------------------------ */

/** 拍号 */
export type TimeSignature = '4/4' | '3/4' | '2/4' | '6/8';

/** 训练模式 */
export type RhythmMode = 'practice' | 'challenge';

/** 音符类型：四分 / 八分 / 二分 / 休止 */
export type NoteType = 'quarter' | 'eighth' | 'half' | 'rest';

/** 敲击结果 */
export type TapResult = 'perfect' | 'good' | 'ok' | 'miss';

/** 挑战阶段：空闲 / 播放节奏型中 / 录音复现中 */
export type ChallengePhase = 'idle' | 'playing' | 'recording';

/** 节奏型中的一个音符 */
export interface RhythmNote {
  /** 音符类型 */
  type: NoteType;
  /** 时值（以拍为单位）：四分=1、八分=0.5、二分=2、休止=1 */
  duration: number;
}

/** 节奏训练统计 */
export interface RhythmStats {
  /** 总敲击数 */
  total: number;
  /** 完美数 */
  perfect: number;
  /** 良好数 */
  good: number;
  /** 一般数 */
  ok: number;
  /** 错过数 */
  miss: number;
}

/* ------------------------------------------------------------------ *
 * 常量
 * ------------------------------------------------------------------ */

/** 各拍号每小节的拍数 */
const BEATS_PER_MEASURE: Record<TimeSignature, number> = {
  '4/4': 4,
  '3/4': 3,
  '2/4': 2,
  '6/8': 6,
};

/** 调度器轮询间隔（毫秒） */
const SCHEDULER_INTERVAL_MS = 25;
/** 预排窗口（秒）：提前排定这段时间内的点击 */
const LOOKAHEAD_S = 0.12;
/** 节拍器起始延迟（秒）：留出余量避免排到过去 */
const START_OFFSET_S = 0.1;
/** 各音符类型在「半拍」单位下的长度（用于整数化生成，避免浮点误差） */
const HALF_BEAT_LEN: Record<NoteType, number> = {
  quarter: 2,
  eighth: 1,
  half: 4,
  rest: 2,
};
/** 半拍 → 拍 换算（半拍长度 / 2 = 拍数） */
const halfBeatsToBeats = (half: number) => half / 2;

/** 评分阈值（毫秒） */
const PERFECT_MS = 100;
const GOOD_MS = 200;
const OK_MS = 300;

/** 初始 BPM */
const DEFAULT_BPM = 80;
/** BPM 边界 */
const BPM_MIN = 40;
const BPM_MAX = 200;

/** 空统计 */
const EMPTY_STATS: RhythmStats = { total: 0, perfect: 0, good: 0, ok: 0, miss: 0 };

/* ------------------------------------------------------------------ *
 * 纯函数工具
 * ------------------------------------------------------------------ */

/** 将 BPM 限制在 40-200 并取整 */
const clampBpm = (v: number) => Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(v)));

/** 根据时间偏差返回敲击评级 */
function scoreTap(diffMs: number): TapResult {
  const a = Math.abs(diffMs);
  if (a <= PERFECT_MS) return 'perfect';
  if (a <= GOOD_MS) return 'good';
  if (a <= OK_MS) return 'ok';
  return 'miss';
}

/** 生成一个随机节奏型（总长 4-8 拍） */
function generatePattern(): RhythmNote[] {
  // 4-8 拍（含端点）
  const patternLength = 4 + Math.floor(Math.random() * 5);
  const totalHalfBeats = patternLength * 2;
  const notes: RhythmNote[] = [];
  let remaining = totalHalfBeats;

  const allTypes: NoteType[] = ['half', 'quarter', 'eighth', 'rest'];
  while (remaining > 0) {
    const candidates = allTypes.filter((t) => HALF_BEAT_LEN[t] <= remaining);
    // 理论上 remaining>=1 时至少 eighth 可用；兜底
    const pool = candidates.length > 0 ? candidates : (['eighth'] as NoteType[]);
    const type = pool[Math.floor(Math.random() * pool.length)];
    const half = HALF_BEAT_LEN[type];
    notes.push({ type, duration: halfBeatsToBeats(half) });
    remaining -= half;
  }
  return notes;
}

/** 计算节奏型中非休止音符的起始拍位（相对节奏型起点） */
function computeOnsetBeats(pattern: RhythmNote[]): number[] {
  const onsets: number[] = [];
  let acc = 0;
  for (const note of pattern) {
    if (note.type !== 'rest') onsets.push(acc);
    acc += note.duration;
  }
  return onsets;
}

/* ------------------------------------------------------------------ *
 * Hook 返回值接口
 * ------------------------------------------------------------------ */

export interface UseRhythmReturn {
  /** 当前 BPM */
  bpm: number;
  /** 当前拍号 */
  timeSignature: TimeSignature;
  /** 节拍器/训练是否运行中 */
  isPlaying: boolean;
  /** 当前小节内的拍位（0 起，用于节拍指示灯） */
  currentBeat: number;
  /** 每小节拍数 */
  beatsPerMeasure: number;
  /** 当前节奏型 */
  pattern: RhythmNote[];
  /** 当前节奏型游标所在音符索引 */
  currentNoteIndex: number;
  /** 统计数据 */
  stats: RhythmStats;
  /** 准确率（非 miss 占比，百分比整数） */
  accuracy: number;
  /** 训练模式 */
  mode: RhythmMode;
  /** 挑战模式当前阶段 */
  challengePhase: ChallengePhase;
  /** 最近一次敲击结果 */
  lastTapResult: TapResult | null;
  /** 挑战模式下各节奏音符是否已被正确敲击命中 */
  matchedNotes: boolean[];
  /** 设置 BPM */
  setBpm: (v: number) => void;
  /** 设置拍号 */
  setTimeSignature: (v: TimeSignature) => void;
  /** 设置训练模式 */
  setMode: (v: RhythmMode) => void;
  /** 开始训练 */
  start: () => void;
  /** 停止训练 */
  stop: () => void;
  /** 处理一次敲击（空格/按键/按钮） */
  handleTap: () => void;
  /** 试听当前节奏型（仅播放一次点击声，不启动循环） */
  playPattern: () => void;
  /** 重置统计 */
  resetStats: () => void;
}

/* ------------------------------------------------------------------ *
 * Hook 实现
 * ------------------------------------------------------------------ */

export function useRhythm(): UseRhythmReturn {
  const [bpm, setBpmState] = useState<number>(DEFAULT_BPM);
  const [timeSignature, setTimeSignatureState] = useState<TimeSignature>('4/4');
  const [mode, setModeState] = useState<RhythmMode>('practice');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [pattern, setPattern] = useState<RhythmNote[]>([]);
  const [stats, setStats] = useState<RhythmStats>(EMPTY_STATS);
  const [lastTapResult, setLastTapResult] = useState<TapResult | null>(null);
  const [challengePhase, setChallengePhase] = useState<ChallengePhase>('idle');
  const [matchedNotes, setMatchedNotes] = useState<boolean[]>([]);

  /* ---- refs（长生命周期，避免闭包过期） ---- */
  const audioCtxRef = useRef<AudioContext | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const challengeTimerRef = useRef<number | null>(null);

  const nextNoteTimeRef = useRef<number>(0); // 下一个待排定点击的音频时间
  const currentBeatRef = useRef<number>(0); // 调度器侧的拍计数（用于重音判定）
  const startTimeRef = useRef<number>(0); // 节拍网格起点（第 0 拍的音频时间）
  const patternStartRef = useRef<number>(0); // 节奏型游标起点
  const recordingStartRef = useRef<number>(0); // 挑战模式录音复现起点
  const patternTotalBeatsRef = useRef<number>(0); // 节奏型总拍数
  const patternOnsetBeatsRef = useRef<number[]>([]); // 非休止音符起始拍位
  const matchedNotesRef = useRef<boolean[]>([]);
  // 最新节奏型（供 draw / 调度读取，避免闭包过期）
  const patternRef = useRef<RhythmNote[]>([]);

  const bpmRef = useRef<number>(DEFAULT_BPM);
  const timeSigRef = useRef<TimeSignature>('4/4');
  const modeRef = useRef<RhythmMode>('practice');
  const isPlayingRef = useRef<boolean>(false);
  const challengePhaseRef = useRef<ChallengePhase>('idle');
  const metronomeEnabledRef = useRef<boolean>(false); // 是否输出节拍器点击声

  const lastBeatRef = useRef<number>(-1);
  const lastNoteIdxRef = useRef<number>(-1);

  /* ---- AudioContext 管理 ---- */
  const ensureAudioContext = useCallback((): AudioContext => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) throw new Error('当前浏览器不支持 Web Audio API');
    audioCtxRef.current = new Ctor();
    return audioCtxRef.current;
  }, []);

  /* ---- 单次点击声排定 ---- */
  const scheduleClick = useCallback((time: number, accent: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(accent ? 1200 : 820, time);
    // 短促包络，模拟「咔哒」
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.4 : 0.22, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  /* ---- lookahead 调度器 ---- */
  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPlayingRef.current) return;
    const spb = 60 / bpmRef.current;
    while (nextNoteTimeRef.current < ctx.currentTime + LOOKAHEAD_S) {
      if (metronomeEnabledRef.current) {
        scheduleClick(nextNoteTimeRef.current, currentBeatRef.current === 0);
      }
      nextNoteTimeRef.current += spb;
      currentBeatRef.current =
        (currentBeatRef.current + 1) % BEATS_PER_MEASURE[timeSigRef.current];
    }
  }, [scheduleClick]);

  const startScheduler = useCallback(() => {
    if (schedulerTimerRef.current !== null) return;
    schedulerTimerRef.current = window.setInterval(scheduler, SCHEDULER_INTERVAL_MS);
  }, [scheduler]);

  /* ---- 一次性播放节奏型（挑战模式预听 / 试听按钮） ---- */
  const schedulePatternPlayback = useCallback(
    (p: RhythmNote[], startTime: number) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const spb = 60 / bpmRef.current;
      let t = startTime;
      for (const note of p) {
        if (note.type !== 'rest') scheduleClick(t, note.type === 'half');
        t += note.duration * spb;
      }
    },
    [scheduleClick],
  );

  /* ---- 绘制循环：从音频时钟推导当前拍 / 游标 ---- */
  const draw = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPlayingRef.current) {
      rafRef.current = null;
      return;
    }
    const spb = 60 / bpmRef.current;
    const beatsPerMeasure = BEATS_PER_MEASURE[timeSigRef.current];
    const now = ctx.currentTime;

    // 当前小节拍位
    const elapsed = now - startTimeRef.current;
    if (elapsed >= 0) {
      const totalBeats = Math.floor(elapsed / spb);
      const beat = ((totalBeats % beatsPerMeasure) + beatsPerMeasure) % beatsPerMeasure;
      if (beat !== lastBeatRef.current) {
        lastBeatRef.current = beat;
        setCurrentBeat(beat);
      }
    }

    // 节奏型游标
    const p = patternRef.current;
    if (p.length > 0 && patternTotalBeatsRef.current > 0) {
      const patternDur = patternTotalBeatsRef.current * spb;
      let pos: number;

      if (challengePhaseRef.current === 'playing') {
        // 单次播放：游标 0 → 末尾，超过则停在末尾
        pos = now - patternStartRef.current;
        if (pos < 0) pos = 0;
        if (pos >= patternDur) pos = patternDur - 0.0001;
      } else if (challengePhaseRef.current === 'recording') {
        // 录音复现：循环推进，跨循环时重置命中标记
        let recElapsed = now - recordingStartRef.current;
        if (recElapsed >= patternDur) {
          const loops = Math.floor(recElapsed / patternDur);
          recordingStartRef.current += loops * patternDur;
          matchedNotesRef.current = matchedNotesRef.current.map(() => false);
          setMatchedNotes(matchedNotesRef.current.map(() => false));
          recElapsed = now - recordingStartRef.current;
        }
        pos = recElapsed % patternDur;
        if (pos < 0) pos += patternDur;
      } else {
        // 练习模式：循环游标
        pos = (now - patternStartRef.current) % patternDur;
        if (pos < 0) pos += patternDur;
      }

      // 定位游标所在音符索引
      let acc = 0;
      let idx = 0;
      for (let i = 0; i < p.length; i++) {
        const nd = p[i].duration * spb;
        if (pos < acc + nd) {
          idx = i;
          break;
        }
        acc += nd;
        idx = i;
      }
      if (idx !== lastNoteIdxRef.current) {
        lastNoteIdxRef.current = idx;
        setCurrentNoteIndex(idx);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  const startDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  /* ---- 内部停止（清定时器，保留 ctx） ---- */
  const stopInternals = useCallback(() => {
    isPlayingRef.current = false;
    metronomeEnabledRef.current = false;
    if (schedulerTimerRef.current !== null) {
      clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (challengeTimerRef.current !== null) {
      clearTimeout(challengeTimerRef.current);
      challengeTimerRef.current = null;
    }
  }, []);

  /* ---- 对齐节拍网格到「现在 + 偏移」 ---- */
  const realignGrid = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const startAt = ctx.currentTime + START_OFFSET_S;
    startTimeRef.current = startAt;
    patternStartRef.current = startAt;
    nextNoteTimeRef.current = startAt;
    currentBeatRef.current = 0;
    lastBeatRef.current = -1;
    lastNoteIdxRef.current = -1;
    if (challengePhaseRef.current === 'recording') {
      recordingStartRef.current = startAt;
      matchedNotesRef.current = matchedNotesRef.current.map(() => false);
      setMatchedNotes(matchedNotesRef.current.map(() => false));
    }
  }, []);

  /* ---- 装载节奏型到 ref 与 state ---- */
  const loadPattern = useCallback((p: RhythmNote[]) => {
    patternRef.current = p;
    setPattern(p);
    patternTotalBeatsRef.current = p.reduce((s, n) => s + n.duration, 0);
    patternOnsetBeatsRef.current = computeOnsetBeats(p);
    matchedNotesRef.current = new Array(patternOnsetBeatsRef.current.length).fill(false);
    setMatchedNotes(matchedNotesRef.current.map(() => false));
  }, []);

  /* ---- 开始训练 ---- */
  const start = useCallback(() => {
    const ctx = ensureAudioContext();
    void ctx.resume();

    // 重置上一次运行
    stopInternals();
    isPlayingRef.current = true;
    setIsPlaying(true);

    bpmRef.current = bpm;
    timeSigRef.current = timeSignature;
    modeRef.current = mode;
    setLastTapResult(null);
    setCurrentBeat(0);
    setCurrentNoteIndex(0);
    realignGrid();

    // 生成新节奏型
    loadPattern(generatePattern());

    const spb = 60 / bpm;
    const patternDurS = patternTotalBeatsRef.current * spb;

    if (mode === 'challenge') {
      // 播放一次节奏型，随后进入录音复现
      challengePhaseRef.current = 'playing';
      setChallengePhase('playing');
      metronomeEnabledRef.current = false;
      schedulePatternPlayback(patternRef.current, startTimeRef.current);
      challengeTimerRef.current = window.setTimeout(() => {
        if (!isPlayingRef.current) return;
        const c = audioCtxRef.current;
        if (!c) return;
        challengePhaseRef.current = 'recording';
        setChallengePhase('recording');
        recordingStartRef.current = c.currentTime + START_OFFSET_S;
        matchedNotesRef.current = matchedNotesRef.current.map(() => false);
        setMatchedNotes([]);
        metronomeEnabledRef.current = true;
        currentBeatRef.current = 0;
        nextNoteTimeRef.current = recordingStartRef.current;
        lastBeatRef.current = -1;
        startScheduler();
      }, patternDurS * 1000);
      // 播放阶段也运行绘制循环以移动游标
      startDraw();
    } else {
      // 练习模式：节拍器 + 循环游标
      challengePhaseRef.current = 'idle';
      setChallengePhase('idle');
      metronomeEnabledRef.current = true;
      startScheduler();
      startDraw();
    }
  }, [
    bpm,
    timeSignature,
    mode,
    ensureAudioContext,
    stopInternals,
    realignGrid,
    loadPattern,
    schedulePatternPlayback,
    startScheduler,
    startDraw,
  ]);

  /* ---- 停止训练 ---- */
  const stop = useCallback(() => {
    stopInternals();
    challengePhaseRef.current = 'idle';
    setChallengePhase('idle');
    setIsPlaying(false);
    setCurrentBeat(0);
    setCurrentNoteIndex(0);
  }, [stopInternals]);

  /* ---- 敲击处理 ---- */
  const handleTap = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isPlayingRef.current) return;
    // 挑战模式「播放中」忽略敲击
    if (modeRef.current === 'challenge' && challengePhaseRef.current === 'playing') return;

    const spb = 60 / bpmRef.current;
    const tapTime = ctx.currentTime;
    let diffMs: number;
    let result: TapResult;

    if (modeRef.current === 'challenge' && challengePhaseRef.current === 'recording') {
      // 对比最近的节奏音符起始点
      const onsetsBeats = patternOnsetBeatsRef.current;
      if (onsetsBeats.length === 0) return;
      const patternDur = patternTotalBeatsRef.current * spb;
      let rel = tapTime - recordingStartRef.current;
      // 折入单个节奏型周期
      rel = ((rel % patternDur) + patternDur) % patternDur;
      const relBeats = rel / spb;

      let nearestIdx = 0;
      let nearestBeats = Math.abs(relBeats - onsetsBeats[0]);
      for (let i = 1; i < onsetsBeats.length; i++) {
        const d = Math.abs(relBeats - onsetsBeats[i]);
        if (d < nearestBeats) {
          nearestBeats = d;
          nearestIdx = i;
        }
      }
      diffMs = nearestBeats * spb * 1000;
      result = scoreTap(diffMs);
      // 命中阈值内且尚未命中 → 标记
      if (nearestBeats * spb * 1000 <= OK_MS && !matchedNotesRef.current[nearestIdx]) {
        matchedNotesRef.current[nearestIdx] = true;
        setMatchedNotes(matchedNotesRef.current.map((m) => m));
      }
    } else {
      // 练习模式（或挑战未录音）：对比最近节拍
      const elapsed = tapTime - startTimeRef.current;
      const beatIndex = Math.round(elapsed / spb);
      const nearestBeatTime = startTimeRef.current + beatIndex * spb;
      diffMs = Math.abs(tapTime - nearestBeatTime) * 1000;
      result = scoreTap(diffMs);
    }

    setLastTapResult(result);
    setStats((prev) => {
      const next: RhythmStats = { ...prev, total: prev.total + 1 };
      next[result] = prev[result] + 1;
      return next;
    });
  }, []);

  /* ---- 试听节奏型 ---- */
  const playPattern = useCallback(() => {
    const ctx = ensureAudioContext();
    void ctx.resume();
    if (patternRef.current.length === 0) {
      loadPattern(generatePattern());
    }
    schedulePatternPlayback(patternRef.current, ctx.currentTime + START_OFFSET_S);
  }, [ensureAudioContext, loadPattern, schedulePatternPlayback]);

  /* ---- 设置 BPM ---- */
  const setBpm = useCallback(
    (v: number) => {
      const clamped = clampBpm(v);
      setBpmState(clamped);
      bpmRef.current = clamped;
      if (isPlayingRef.current) realignGrid();
    },
    [realignGrid],
  );

  /* ---- 设置拍号 ---- */
  const setTimeSignature = useCallback(
    (v: TimeSignature) => {
      setTimeSignatureState(v);
      timeSigRef.current = v;
      if (isPlayingRef.current) realignGrid();
    },
    [realignGrid],
  );

  /* ---- 设置训练模式（运行中切换会停止当前会话） ---- */
  const setMode = useCallback(
    (v: RhythmMode) => {
      modeRef.current = v;
      setModeState(v);
      if (isPlayingRef.current) stop();
    },
    [stop],
  );

  /* ---- 重置统计 ---- */
  const resetStats = useCallback(() => {
    setStats({ ...EMPTY_STATS });
    setLastTapResult(null);
    matchedNotesRef.current = matchedNotesRef.current.map(() => false);
    setMatchedNotes(matchedNotesRef.current.map(() => false));
  }, []);

  /* ---- 准确率 ---- */
  const accuracy =
    stats.total > 0
      ? Math.round(((stats.perfect + stats.good + stats.ok) / stats.total) * 100)
      : 0;

  const beatsPerMeasure = BEATS_PER_MEASURE[timeSignature];

  /* ---- 卸载清理（StrictMode 下也会触发） ---- */
  useEffect(() => {
    return () => {
      if (schedulerTimerRef.current !== null) clearInterval(schedulerTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (challengeTimerRef.current !== null) clearTimeout(challengeTimerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  return {
    bpm,
    timeSignature,
    isPlaying,
    currentBeat,
    beatsPerMeasure,
    pattern,
    currentNoteIndex,
    stats,
    accuracy,
    mode,
    challengePhase,
    lastTapResult,
    matchedNotes,
    setBpm,
    setTimeSignature,
    setMode,
    start,
    stop,
    handleTap,
    playPattern,
    resetStats,
  };
}
