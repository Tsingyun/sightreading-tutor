/**
 * useSongPractice Hook
 * ============================================
 * 乐曲练习模式：加载预置乐曲或解析的 MIDI 文件，
 * 支持跟弹模式和自动播放模式。
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PresetSong } from '../lib/songLibrary';
import { midiToNoteInfo } from '../lib/music';
import type { NoteInfo, AnswerState } from '../types';

export interface SongPracticeStats {
  correct: number;
  wrong: number;
  total: number;
}

export interface UseSongPracticeReturn {
  currentSong: PresetSong | null;
  currentIndex: number;
  isPlaying: boolean;
  isFollowMode: boolean;
  speedMultiplier: number;
  stats: SongPracticeStats;
  currentNote: NoteInfo | null;
  allNotes: NoteInfo[];
  answerState: AnswerState;
  wrongNote: number | null;
  /** 是否已弹完整首歌曲（阶段二完成） */
  isFinished: boolean;
  loadSong: (song: PresetSong) => void;
  /** 退出当前歌曲，回到曲库选择 */
  unloadSong: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  submitAnswer: (midi: number) => boolean;
  setFollowMode: (on: boolean) => void;
  setSpeedMultiplier: (s: number) => void;
}

export function useSongPractice(): UseSongPracticeReturn {
  const [currentSong, setCurrentSong] = useState<PresetSong | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFollowMode, setFollowModeState] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [stats, setStats] = useState<SongPracticeStats>({ correct: 0, wrong: 0, total: 0 });
  const [currentNote, setCurrentNote] = useState<NoteInfo | null>(null);
  const [allNotes, setAllNotes] = useState<NoteInfo[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [wrongNote, setWrongNote] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const speedRef = useRef(1);
  const songRef = useRef<PresetSong | null>(null);

  // 同步 ref
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speedMultiplier; }, [speedMultiplier]);
  useEffect(() => { songRef.current = currentSong; }, [currentSong]);

  const computeAllNotes = useCallback((song: PresetSong) => {
    const notes: NoteInfo[] = [];
    for (const sn of song.notes) {
      if (sn.isRest) continue;
      notes.push(midiToNoteInfo(sn.midi));
    }
    return notes;
  }, []);

  const advanceToNextPlayable = useCallback((song: PresetSong, fromIndex: number) => {
    let idx = fromIndex;
    while (idx < song.notes.length && song.notes[idx].isRest) {
      idx++;
    }
    if (idx >= song.notes.length) {
      // 乐曲结束：位置推进到末尾，进度达 100%，进入完成态
      setIsPlaying(false);
      setCurrentNote(null);
      setCurrentIndex(song.notes.length);
      indexRef.current = song.notes.length;
      setIsFinished(true);
      return -1;
    }
    setCurrentIndex(idx);
    setCurrentNote(midiToNoteInfo(song.notes[idx].midi));
    return idx;
  }, []);

  const scheduleNextNote = useCallback((song: PresetSong, noteIndex: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const note = song.notes[noteIndex];
    const beatDuration = 60000 / song.bpm / speedRef.current; // ms per beat
    const noteDurationMs = note.duration * beatDuration;

    timerRef.current = setTimeout(() => {
      if (!isPlayingRef.current) return;
      const nextIdx = noteIndex + 1;
      const result = advanceToNextPlayable(song, nextIdx);
      if (result >= 0) {
        scheduleNextNote(song, result);
      }
    }, noteDurationMs);
  }, [advanceToNextPlayable]);

  const loadSong = useCallback((song: PresetSong) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setCurrentSong(song);
    setAllNotes(computeAllNotes(song));
    setStats({ correct: 0, wrong: 0, total: 0 });
    setIsPlaying(false);
    setIsFinished(false);
    setWrongNote(null);

    // 设置第一个可弹音符
    const firstPlayable = song.notes.findIndex((n) => !n.isRest);
    if (firstPlayable >= 0) {
      setCurrentIndex(firstPlayable);
      setCurrentNote(midiToNoteInfo(song.notes[firstPlayable].midi));
      indexRef.current = firstPlayable;
      setAnswerState('pending');
    } else {
      setCurrentIndex(0);
      setCurrentNote(null);
      indexRef.current = 0;
      setAnswerState('idle');
    }
  }, [computeAllNotes]);

  const unloadSong = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setCurrentSong(null);
    setAllNotes([]);
    setCurrentNote(null);
    setCurrentIndex(0);
    indexRef.current = 0;
    setIsPlaying(false);
    setIsFinished(false);
    setAnswerState('idle');
    setStats({ correct: 0, wrong: 0, total: 0 });
    setWrongNote(null);
  }, []);

  const play = useCallback(() => {
    if (!currentSong) return;
    if (isFollowMode) return; // 跟弹模式不需要自动播放计时
    setIsPlaying(true);
    const idx = indexRef.current;
    scheduleNextNote(currentSong, idx);
  }, [currentSong, isFollowMode, scheduleNextNote]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setIsPlaying(false);
    setIsFinished(false);
    setStats({ correct: 0, wrong: 0, total: 0 });
    setWrongNote(null);
    if (currentSong) {
      const firstPlayable = currentSong.notes.findIndex((n) => !n.isRest);
      if (firstPlayable >= 0) {
        setCurrentIndex(firstPlayable);
        setCurrentNote(midiToNoteInfo(currentSong.notes[firstPlayable].midi));
        indexRef.current = firstPlayable;
        setAnswerState('pending');
      }
    }
  }, [currentSong]);

  const submitAnswer = useCallback((midi: number): boolean => {
    if (!currentSong) return false;
    const song = currentSong;
    const idx = indexRef.current;
    const note = song.notes[idx];
    if (!note || note.isRest) return false;

    const isCorrect = midi === note.midi;
    setStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
      total: prev.total + 1,
    }));

    // 清除上一个反馈定时器
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    if (isCorrect) {
      setAnswerState('correct');
      setWrongNote(null);
      // 前进到下一个可弹音符
      const result = advanceToNextPlayable(song, idx + 1);
      if (result >= 0) {
        // 短暂显示绿色后恢复 pending
        feedbackTimerRef.current = setTimeout(() => setAnswerState('pending'), 600);
      } else {
        // 乐曲结束
        setAnswerState('idle');
      }
      if (result >= 0 && !isFollowMode) {
        scheduleNextNote(song, result);
      }
      return true;
    } else {
      setAnswerState('wrong');
      setWrongNote(midi);
      // 短暂显示红色后恢复 pending（跟弹模式下允许重试）
      feedbackTimerRef.current = setTimeout(() => {
        setAnswerState('pending');
        setWrongNote(null);
      }, 800);
      return false;
    }
  }, [currentSong, isFollowMode, advanceToNextPlayable, scheduleNextNote]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  return {
    currentSong,
    currentIndex,
    isPlaying,
    isFollowMode,
    speedMultiplier,
    stats,
    currentNote,
    allNotes,
    answerState,
    wrongNote,
    isFinished,
    loadSong,
    unloadSong,
    play,
    pause,
    reset,
    submitAnswer,
    setFollowMode: setFollowModeState,
    setSpeedMultiplier,
  };
}
