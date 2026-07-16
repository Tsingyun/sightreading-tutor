/**
 * Staff 组件
 * ============================================
 * 使用 VexFlow 渲染五线谱，根据答题状态变色。
 * 支持单音和和弦两种模式。
 * 支持 ResizeObserver 自动响应容器尺寸变化。
 */

import { useRef, useEffect, useMemo } from 'react';
import { renderStaff, renderGrandStaff, type ThemeColors } from '../lib/vexflow';
import type { NoteInfo, AnswerState, ClefType, ThemeMode, ChordInfo } from '../types';

interface StaffProps {
  note: NoteInfo | null;
  chord: ChordInfo | null;
  playedIndices: number[];
  answerState: AnswerState;
  clefMode: ClefType;
  showLabel?: boolean;
  alwaysShowLabel?: boolean;
  flashLabel?: boolean;
  theme: ThemeMode;
}

function resolveThemeColors(theme: ThemeMode): ThemeColors {
  if (theme === 'dark') {
    return {
      staffColor: '#e0e0e0',
      bgColor: '#0f0f1e',
      noteDefault: '#e0e0e0',
      noteCorrect: '#4ade80',
      noteWrong: '#f87171',
    };
  }
  return {
    staffColor: '#374151',
    bgColor: '#f8f9fc',
    noteDefault: '#1a1a2e',
    noteCorrect: '#22c55e',
    noteWrong: '#ef4444',
  };
}

export function Staff({ note, chord, playedIndices, answerState, clefMode, showLabel, alwaysShowLabel, flashLabel, theme }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const themeColors = useMemo(() => resolveThemeColors(theme), [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const doRender = () => {
      const opts = {
        container,
        note,
        notes: chord?.notes ?? null,
        playedIndices,
        answerState,
        showLabel,
        alwaysShowLabel,
        flashLabel,
        chordName: chord?.name,
        themeColors,
      };

      if (clefMode === 'both') {
        renderGrandStaff(opts);
      } else {
        renderStaff(opts);
      }
    };

    doRender();

    const resizeObserver = new ResizeObserver(() => {
      doRender();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [note, chord, playedIndices, answerState, clefMode, showLabel, alwaysShowLabel, flashLabel, themeColors]);

  return (
    <div className={`staff-container staff-state--${answerState}`}>
      <div ref={containerRef} className="staff-canvas" />
    </div>
  );
}
