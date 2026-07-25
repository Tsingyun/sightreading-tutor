/**
 * SongStaff 组件
 * ============================================
 * 乐曲练习专用五线谱：渲染音符序列 + 光标竖线。
 * 弹对后光标自动右移到下一个音符。
 */

import { useRef, useEffect, useMemo } from 'react';
import { renderSongStaff, type ThemeColors } from '../lib/vexflow';
import type { NoteInfo, AnswerState, ThemeMode } from '../types';

interface SongStaffProps {
  notes: NoteInfo[];
  currentIndex: number;
  answerState: AnswerState;
  theme: ThemeMode;
  windowSize?: number;
}

function resolveThemeColors(_theme: ThemeMode): ThemeColors {
  return {
    staffColor: '#111111',
    bgColor: '#F9F9F7',
    noteDefault: '#111111',
    noteCorrect: '#15803D',
    noteWrong: '#CC0000',
  };
}

export function SongStaff({ notes, currentIndex, answerState, theme, windowSize = 4 }: SongStaffProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const themeColors = useMemo(() => resolveThemeColors(theme), [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const doRender = () => {
      renderSongStaff({
        container,
        notes,
        currentIndex,
        windowSize,
        answerState,
        themeColors,
      });
    };

    doRender();
    lastWidthRef.current = container.clientWidth;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const newWidth = entry.contentRect.width;
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
  }, [notes, currentIndex, answerState, themeColors, windowSize]);

  return (
    <div className={`staff-container staff-state--${answerState}`}>
      <div ref={containerRef} className="staff-canvas" />
    </div>
  );
}
