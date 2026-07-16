/**
 * useTraining Hook
 * ============================================
 * 核心训练逻辑：随机出题、答案判定、统计追踪。
 *
 * 支持两种训练模式：
 * - single: 单音训练（原有模式）
 * - chord:  和弦训练（2/3/4 个音符），弹奏完成后提示和弦名称
 *
 * 里程碑功能：
 * - 每完成 100 题时触发里程碑庆祝
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  NoteInfo,
  AnswerState,
  TrainingConfig,
  TrainingStats,
  ClefType,
  ChordInfo,
} from '../types';
import { midiToNoteInfo, generateRandomNote, generateRandomChord, getDifficultyConfig, getNoteHint } from '../lib/music';
import {
  loadStats,
  saveStats,
  loadConfig,
  saveConfig,
  loadBestStreak,
  saveBestStreak,
  DEFAULT_STATS,
} from '../lib/storage';

/** 里程碑触发的题数间隔 */
const MILESTONE_INTERVAL = 100;

export interface UseTrainingReturn {
  /** 当前题目音符（单音模式） */
  currentNote: NoteInfo | null;
  /** 当前和弦信息（和弦模式） */
  currentChord: ChordInfo | null;
  /** 答题状态 */
  answerState: AnswerState;
  /** 训练统计 */
  stats: TrainingStats;
  /** 训练配置 */
  config: TrainingConfig;
  /** 历史最高连击（跨会话） */
  allTimeBestStreak: number;
  /** 是否正在训练中 */
  isTraining: boolean;
  /** 用户按下的 MIDI 音高（单音模式）或最后按下的音（和弦模式） */
  pressedNote: number | null;
  /** 和弦模式下已正确弹奏的音符索引列表 */
  playedIndices: number[];
  /** 和弦模式下最近按错的音（短暂提示用，自动清除） */
  wrongNote: number | null;
  /** 里程碑是否触发（每 100 题） */
  milestoneReached: boolean;
  /** 里程碑触发的题数（如 100, 200...） */
  milestoneValue: number;
  /** 按键后短暂闪现音名（关闭音名提示时生效） */
  flashLabel: boolean;
  /** 当前提示等级（0=无提示，1=线/间，2=音名字母，3=完整答案） */
  hintLevel: number;
  /** 当前提示文本 */
  hintText: string;
  /** 请求下一级提示 */
  requestHint: () => void;
  /** 开始训练 */
  startTraining: () => void;
  /** 停止训练 */
  stopTraining: () => void;
  /** 提交答案（MIDI 音高） */
  submitAnswer: (midi: number) => void;
  /** 重试当前题（不改变统计，重置为待答状态） */
  retry: () => void;
  /** 揭示答案 */
  revealAnswer: () => void;
  /** 跳过当前题 */
  skipQuestion: () => void;
  /** 重新开始（清零统计） */
  resetStats: () => void;
  /** 更新配置 */
  updateConfig: (partial: Partial<TrainingConfig>) => void;
  /** 下一题 */
  nextQuestion: () => void;
  /** 关闭里程碑弹窗 */
  dismissMilestone: () => void;
}

export function useTraining(): UseTrainingReturn {
  const [currentNote, setCurrentNote] = useState<NoteInfo | null>(null);
  const [currentChord, setCurrentChord] = useState<ChordInfo | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [stats, setStats] = useState<TrainingStats>(() => loadStats());
  const [config, setConfig] = useState<TrainingConfig>(() => loadConfig());
  const [allTimeBestStreak, setAllTimeBestStreak] = useState<number>(() => loadBestStreak());
  const [isTraining, setIsTraining] = useState(false);
  const [pressedNote, setPressedNote] = useState<number | null>(null);
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const [wrongNote, setWrongNote] = useState<number | null>(null);
  const [milestoneReached, setMilestoneReached] = useState(false);
  const [milestoneValue, setMilestoneValue] = useState(0);
  /** 按键后短暂闪现音名（仅当 showNoteLabel 关闭时） */
  const [flashLabel, setFlashLabel] = useState(false);
  /** 渐进式提示等级（0=无, 1=线/间位置, 2=音名字母, 3=完整答案） */
  const [hintLevel, setHintLevel] = useState(0);
  /** 提示文本 */
  const [hintText, setHintText] = useState('');

  const questionStartTimeRef = useRef<number>(0);
  const lastNoteRef = useRef<number | null>(null);
  const lastChordRootRef = useRef<number | null>(null);
  /** 标记当前题目是否已经计入统计（避免重试时重复计数） */
  const statsCountedRef = useRef(false);
  /** 记录上一次触发里程碑的题数，避免重复触发 */
  const lastMilestoneRef = useRef<number>(0);
  /** 错误音提示的定时器 */
  const wrongNoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 音名闪现的定时器 */
  const flashLabelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 触发音名闪现（仅当 showNoteLabel 关闭时） */
  const triggerFlashLabel = useCallback(() => {
    if (config.showNoteLabel) return; // 开启音名提示时不需要闪现
    // 清除之前的定时器
    if (flashLabelTimerRef.current) {
      clearTimeout(flashLabelTimerRef.current);
    }
    setFlashLabel(true);
    flashLabelTimerRef.current = setTimeout(() => {
      setFlashLabel(false);
      flashLabelTimerRef.current = null;
    }, 1500);
  }, [config.showNoteLabel]);

  /** 生成下一题 */
  const nextQuestion = useCallback(() => {
    // 清除音名闪现
    setFlashLabel(false);
    if (flashLabelTimerRef.current) {
      clearTimeout(flashLabelTimerRef.current);
      flashLabelTimerRef.current = null;
    }
    // 重置提示
    setHintLevel(0);
    setHintText('');

    if (config.mode === 'chord') {
      // —— 和弦模式 ——
      const chord = generateRandomChord(
        { low: config.lowNote, high: config.highNote },
        config.chordSize,
        lastChordRootRef.current,
      );
      lastChordRootRef.current = chord.root.midi;

      // 双谱表模式下，根据根音选择谱号
      if (config.clef === 'both') {
        const clef: 'treble' | 'bass' = chord.root.midi >= 60 ? 'treble' : 'bass';
        chord.notes.forEach((n) => (n.clef = clef));
      } else {
        chord.notes.forEach((n) => (n.clef = config.clef as 'treble' | 'bass'));
      }

      setCurrentChord(chord);
      setCurrentNote(null);
      setAnswerState('pending');
      setPressedNote(null);
      setPlayedIndices([]);
      setWrongNote(null);
      statsCountedRef.current = false;
      questionStartTimeRef.current = performance.now();
    } else {
      // —— 单音模式 ——
      const midi = generateRandomNote(
        { low: config.lowNote, high: config.highNote },
        config.includeAccidentals,
        lastNoteRef.current,
      );
      lastNoteRef.current = midi;
      const note = midiToNoteInfo(midi);

      if (config.clef === 'both') {
        note.clef = note.midi >= 60 ? 'treble' : 'bass';
      } else {
        note.clef = config.clef;
      }

      setCurrentNote(note);
      setCurrentChord(null);
      setAnswerState('pending');
      setPressedNote(null);
      setPlayedIndices([]);
      setWrongNote(null);
      statsCountedRef.current = false;
      questionStartTimeRef.current = performance.now();
    }
  }, [config]);

  /** 开始训练 */
  const startTraining = useCallback(() => {
    setIsTraining(true);
    nextQuestion();
  }, [nextQuestion]);

  /** 停止训练 */
  const stopTraining = useCallback(() => {
    setIsTraining(false);
    setCurrentNote(null);
    setCurrentChord(null);
    setAnswerState('idle');
    setPlayedIndices([]);
  }, []);

  /** 检查并触发里程碑 */
  const checkMilestone = useCallback((total: number) => {
    const milestone = Math.floor(total / MILESTONE_INTERVAL) * MILESTONE_INTERVAL;
    if (milestone > 0 && milestone > lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone;
      setMilestoneValue(milestone);
      setMilestoneReached(true);
    }
  }, []);

  /** 提交答案 */
  const submitAnswer = useCallback(
    (midi: number) => {
      if (!isTraining) return;
      if (answerState !== 'pending' && answerState !== 'wrong') return;

      // ========== 和弦模式 ==========
      if (config.mode === 'chord' && currentChord) {
        setPressedNote(midi);

        // 检查弹奏的音是否在和弦中
        const noteIndex = currentChord.notes.findIndex((n) => n.midi === midi);

        if (noteIndex !== -1) {
          // 正确的音
          if (playedIndices.includes(noteIndex)) {
            // 已经弹奏过这个音，忽略
            return;
          }

          // 清除错误提示
          setWrongNote(null);
          if (wrongNoteTimerRef.current) {
            clearTimeout(wrongNoteTimerRef.current);
            wrongNoteTimerRef.current = null;
          }
          // 按键后闪现音名
          triggerFlashLabel();

          const newPlayedIndices = [...playedIndices, noteIndex];
          setPlayedIndices(newPlayedIndices);

          // 检查是否所有音都弹对了
          if (newPlayedIndices.length === currentChord.notes.length) {
            // 全部弹对！
            setAnswerState('correct');

            if (!statsCountedRef.current) {
              const reactionTime = performance.now() - questionStartTimeRef.current;
              const newStats: TrainingStats = {
                correct: stats.correct + 1,
                total: stats.total + 1,
                streak: stats.streak + 1,
                bestStreak: Math.max(stats.bestStreak, stats.streak + 1),
                totalReactionTime: stats.totalReactionTime + reactionTime,
                reactionCount: stats.reactionCount + 1,
              };
              setStats(newStats);
              saveStats(newStats);

              if (newStats.streak > allTimeBestStreak) {
                setAllTimeBestStreak(newStats.streak);
                saveBestStreak(newStats.streak);
              }

              checkMilestone(newStats.total);
            }
            statsCountedRef.current = true;

            // 延迟进入下一题（让用户看到和弦名称）
            setTimeout(() => {
              if (isTraining) nextQuestion();
            }, 1500);
          }
          // 否则继续等待用户弹奏剩余的音
        } else {
          // 弹了错误的音（不在和弦中）
          if (config.autoNextOnError) {
            // 自动下一题模式：计为错误，自动跳转
            if (!statsCountedRef.current) {
              const newStats: TrainingStats = {
                ...stats,
                total: stats.total + 1,
                streak: 0,
              };
              setStats(newStats);
              saveStats(newStats);
              statsCountedRef.current = true;
              checkMilestone(newStats.total);
            }

            setAnswerState('wrong');

            setTimeout(() => {
              if (isTraining) nextQuestion();
            }, 1200);
          } else {
            // 允许继续尝试模式：只给短暂提示，不结束题目，不计统计
            setPressedNote(midi);
            setWrongNote(midi);

            // 清除之前的定时器
            if (wrongNoteTimerRef.current) {
              clearTimeout(wrongNoteTimerRef.current);
            }
            // 700ms 后清除错误提示
            wrongNoteTimerRef.current = setTimeout(() => {
              setWrongNote(null);
              setPressedNote(null);
            }, 700);
          }
        }
        return;
      }

      // ========== 单音模式 ==========
      if (!currentNote) return;

      setPressedNote(midi);
      // 按键后闪现音名（关闭音名提示时）
      triggerFlashLabel();
      const reactionTime = performance.now() - questionStartTimeRef.current;
      const isCorrect = midi === currentNote.midi;

      if (isCorrect) {
        setAnswerState('correct');

        if (!statsCountedRef.current) {
          const newStats: TrainingStats = {
            correct: stats.correct + 1,
            total: stats.total + 1,
            streak: stats.streak + 1,
            bestStreak: Math.max(stats.bestStreak, stats.streak + 1),
            totalReactionTime: stats.totalReactionTime + reactionTime,
            reactionCount: stats.reactionCount + 1,
          };
          setStats(newStats);
          saveStats(newStats);

          if (newStats.streak > allTimeBestStreak) {
            setAllTimeBestStreak(newStats.streak);
            saveBestStreak(newStats.streak);
          }

          checkMilestone(newStats.total);
        }
        statsCountedRef.current = true;

        setTimeout(() => {
          if (isTraining) nextQuestion();
        }, 800);
      } else {
        setAnswerState('wrong');

        if (!statsCountedRef.current) {
          const newStats: TrainingStats = {
            ...stats,
            total: stats.total + 1,
            streak: 0,
          };
          setStats(newStats);
          saveStats(newStats);
          statsCountedRef.current = true;
          checkMilestone(newStats.total);
        }

        if (config.autoNextOnError) {
          setTimeout(() => {
            if (isTraining) nextQuestion();
          }, 1200);
        }
      }
    },
    [currentNote, currentChord, answerState, stats, allTimeBestStreak, isTraining, config.autoNextOnError, config.mode, playedIndices, nextQuestion, checkMilestone, triggerFlashLabel],
  );

  /** 重试当前题：重置为待答状态，不改变统计 */
  const retry = useCallback(() => {
    if (answerState !== 'wrong') return;
    setAnswerState('pending');
    setPressedNote(null);
    // 清除音名闪现（按键时可能触发了）
    setFlashLabel(false);
    if (flashLabelTimerRef.current) {
      clearTimeout(flashLabelTimerRef.current);
      flashLabelTimerRef.current = null;
    }
    // 重置提示
    setHintLevel(0);
    setHintText('');
    // 和弦模式下重置已弹奏的音
    if (config.mode === 'chord') {
      setPlayedIndices([]);
    }
    questionStartTimeRef.current = performance.now();
  }, [answerState, config.mode]);

  /** 揭示答案 */
  const revealAnswer = useCallback(() => {
    const hasContent = config.mode === 'chord' ? currentChord : currentNote;
    if (!hasContent) return;
    if (answerState !== 'pending' && answerState !== 'wrong') return;

    setAnswerState('revealed');

    if (!statsCountedRef.current) {
      const newStats: TrainingStats = {
        ...stats,
        total: stats.total + 1,
        streak: 0,
      };
      setStats(newStats);
      saveStats(newStats);
      statsCountedRef.current = true;
      checkMilestone(newStats.total);
    }
  }, [currentNote, currentChord, answerState, stats, config.mode, checkMilestone]);

  /** 请求渐进式提示（单音模式） */
  const requestHint = useCallback(() => {
    if (!currentNote) return;
    if (answerState !== 'pending' && answerState !== 'wrong') return;
    // 已到最高提示等级，不再升级
    if (hintLevel >= 3) return;

    const nextLevel = hintLevel + 1;
    const text = getNoteHint(currentNote, nextLevel);
    setHintLevel(nextLevel);
    setHintText(text);
  }, [currentNote, answerState, hintLevel]);

  /** 跳过当前题 */
  const skipQuestion = useCallback(() => {
    if (!isTraining) return;
    nextQuestion();
  }, [isTraining, nextQuestion]);

  /** 重置统计 */
  const resetStats = useCallback(() => {
    const reset = { ...DEFAULT_STATS };
    setStats(reset);
    saveStats(reset);
    lastMilestoneRef.current = 0;
  }, []);

  /** 更新配置 */
  const updateConfig = useCallback((partial: Partial<TrainingConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };

      // 如果难度等级变化，自动应用对应的谱号、音域、升降号
      if (partial.difficultyLevel && partial.difficultyLevel !== prev.difficultyLevel) {
        const diffConfig = getDifficultyConfig(partial.difficultyLevel);
        next.clef = diffConfig.clef;
        next.lowNote = diffConfig.lowNote;
        next.highNote = diffConfig.highNote;
        next.includeAccidentals = diffConfig.includeAccidentals;
      }

      // 如果谱号变化（非难度等级触发的），重置音域为对应默认值
      if (partial.clef && partial.clef !== prev.clef && !partial.difficultyLevel) {
        const ranges: Record<ClefType, { low: number; high: number }> = {
          treble: { low: 60, high: 81 },
          bass: { low: 40, high: 60 },
          both: { low: 40, high: 81 },
        };
        const range = ranges[partial.clef];
        next.lowNote = range.low;
        next.highNote = range.high;
      }

      saveConfig(next);
      return next;
    });
  }, []);

  /** 关闭里程碑弹窗 */
  const dismissMilestone = useCallback(() => {
    setMilestoneReached(false);
  }, []);

  // 初始化时同步难度等级配置（确保旧用户的配置与新难度等级一致）
  useEffect(() => {
    const diffConfig = getDifficultyConfig(config.difficultyLevel);
    // 仅在配置与难度等级不匹配时才更新
    if (
      config.clef !== diffConfig.clef ||
      config.lowNote !== diffConfig.lowNote ||
      config.highNote !== diffConfig.highNote ||
      config.includeAccidentals !== diffConfig.includeAccidentals
    ) {
      const synced = {
        ...config,
        clef: diffConfig.clef,
        lowNote: diffConfig.lowNote,
        highNote: diffConfig.highNote,
        includeAccidentals: diffConfig.includeAccidentals,
      };
      setConfig(synced);
      saveConfig(synced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当训练中且配置变化时，重新出题
  useEffect(() => {
    if (isTraining) {
      nextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.clef, config.lowNote, config.highNote, config.includeAccidentals, config.mode, config.chordSize, config.difficultyLevel]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (wrongNoteTimerRef.current) {
        clearTimeout(wrongNoteTimerRef.current);
      }
      if (flashLabelTimerRef.current) {
        clearTimeout(flashLabelTimerRef.current);
      }
    };
  }, []);

  return {
    currentNote,
    currentChord,
    answerState,
    stats,
    config,
    allTimeBestStreak,
    isTraining,
    pressedNote,
    playedIndices,
    wrongNote,
    milestoneReached,
    milestoneValue,
    flashLabel,
    hintLevel,
    hintText,
    requestHint,
    startTraining,
    stopTraining,
    submitAnswer,
    retry,
    revealAnswer,
    skipQuestion,
    resetStats,
    updateConfig,
    nextQuestion,
    dismissMilestone,
  };
}
