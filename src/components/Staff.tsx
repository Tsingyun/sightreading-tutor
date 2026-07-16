/**
 * Staff 组件
 * ============================================
 * 使用 VexFlow 渲染五线谱，根据答题状态变色。
 * 支持单音和和弦两种模式。
 * 支持 ResizeObserver 自动响应容器尺寸变化。
 *
 * 性能优化：
 * - ResizeObserver 防抖 200ms，避免布局变化引发反馈循环
 * - 仅在容器宽度实际变化（>2px）时才重绘，防止高度变化触发无意义重绘
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

function resolveThemeColors(_theme: ThemeMode): ThemeColors {
  // Newsprint 配色：永久浅色，墨黑 + 报纸白 + 编辑红
  return {
    staffColor: '#111111',
    bgColor: '#F9F9F7',
    noteDefault: '#111111',
    noteCorrect: '#15803D',
    noteWrong: '#CC0000',
  };
}

export function Staff({ note, chord, playedIndices, answerState, clefMode, showLabel, alwaysShowLabel, flashLabel, theme }: StaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    lastWidthRef.current = container.clientWidth;

    // 防抖 + 宽度变化检测，避免 ResizeObserver 反馈循环
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const newWidth = entry.contentRect.width;

      // 宽度变化不足 2px 时不重绘（高度变化通常由自身渲染引起，忽略）
      if (Math.abs(newWidth - lastWidthRef.current) < 2) return;
      lastWidthRef.current = newWidth;

      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        doRender();
      }, 200);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [note, chord, playedIndices, answerState, clefMode, showLabel, alwaysShowLabel, flashLabel, themeColors]);

  return (
    <div className={`staff-container staff-state--${answerState}`}>
      <div ref={containerRef} className="staff-canvas" />
    </div>
  );
}
