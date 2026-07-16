/**
 * FreePlay 组件
 * ============================================
 * 自由弹奏模式主界面。
 *
 * 功能：
 * - 实时在五线谱上显示当前按下的音符
 * - 显示每个音符的音名（美观的卡片式标签）
 * - 识别并显示和弦名称和转位信息
 * - 支持虚拟键盘点击输入（点击切换按下/松开）
 *
 * 双状态设计：
 * - activeNotes: 当前实际按下的键（用于键盘高亮，立即响应）
 * - displayedNotes: 屏幕上显示的音符（松开后延迟 2s 消失，用于五线谱和和弦信息）
 *
 * 防闪烁/防跳变设计：
 * - 五线谱始终渲染（无音符时渲染空谱表），避免组件挂载/卸载
 * - 信息区域始终保留空间，用 opacity + visibility 过渡代替条件渲染
 * - 布局尺寸恒定，不随音符变化而跳动
 */

import { useMemo } from 'react';
import { Staff } from './Staff';
import { VirtualKeyboard } from './VirtualKeyboard';
import { midiToNoteInfo } from '../lib/music';
import type { IdentifiedChord, ThemeMode, ChordInfo } from '../types';

interface FreePlayProps {
  /** 当前按下的 MIDI 音符（用于键盘高亮） */
  activeNotes: number[];
  /** 屏幕上显示的音符（含释放延迟，用于五线谱和和弦信息） */
  displayedNotes: number[];
  chordInfo: IdentifiedChord | null;
  theme: ThemeMode;
  onVirtualKeyPress: (midi: number) => void;
  onClear: () => void;
}

export function FreePlay({
  activeNotes,
  displayedNotes,
  chordInfo,
  theme,
  onVirtualKeyPress,
  onClear,
}: FreePlayProps) {
  // 将显示中的音符转换为 NoteInfo 数组，用于五线谱渲染
  const noteInfos = useMemo(
    () => displayedNotes.map((m) => midiToNoteInfo(m)),
    [displayedNotes],
  );

  // 构造 ChordInfo 对象传给 Staff 组件
  const chordForStaff: ChordInfo | null = useMemo(() => {
    if (noteInfos.length === 0) return null;
    return {
      notes: noteInfos,
      name: chordInfo?.chordName ?? '',
      root: chordInfo?.root ?? noteInfos[0],
      type: chordInfo?.chordType ?? '',
    };
  }, [noteInfos, chordInfo]);

  // 判断和弦类别用于样式
  const chordCategory = useMemo(() => {
    if (!chordInfo) return 'none';
    if (chordInfo.chordType === 'single') return 'single';
    if (chordInfo.chordType === 'interval') return 'interval';
    if (chordInfo.chordType === 'unknown') return 'unknown';
    return 'chord';
  }, [chordInfo]);

  const hasNotes = displayedNotes.length > 0;

  return (
    <div className="freeplay">
      {/* 五线谱区域 — 始终渲染，无音符时显示空谱表 */}
      <div className="staff-wrapper freeplay-staff-wrapper">
        <Staff
          note={null}
          chord={chordForStaff}
          playedIndices={[]}
          answerState="revealed"
          clefMode="both"
          theme={theme}
        />
        {/* 无音符时的提示覆盖层（不影响布局，绝对定位） */}
        <div className={`freeplay-hint-overlay ${hasNotes ? 'freeplay-hint-overlay--hidden' : ''}`}>
          <div className="freeplay-hint-overlay__icon">♪</div>
          <p className="freeplay-hint-overlay__text">弹奏 MIDI 键盘或点击下方虚拟键盘</p>
        </div>
      </div>

      {/* 和弦信息 + 音名标签 — 始终保留空间，用 opacity 过渡 */}
      <div className={`freeplay-info ${hasNotes ? 'freeplay-info--visible' : ''}`}>
        {/* 和弦名称展示 */}
        <div className={`freeplay-chord freeplay-chord--${chordCategory}`}>
          <div className="freeplay-chord__label">
            {chordCategory === 'single' ? '音名' : chordCategory === 'interval' ? '音程' : chordCategory === 'chord' ? '和弦' : '—'}
          </div>
          <div className="freeplay-chord__name">
            {chordInfo?.chordName ?? '—'}
          </div>
          {chordInfo?.inversionName && chordInfo.inversion > 0 && (
            <div className="freeplay-chord__inversion">
              {chordInfo.inversionName}
            </div>
          )}
          {chordInfo?.root && chordCategory === 'chord' && (
            <div className="freeplay-chord__root">
              根音：{chordInfo.root.name}{chordInfo.root.octave}
            </div>
          )}
          {chordInfo?.bassNote && chordCategory === 'chord' && chordInfo.inversion > 0 && (
            <div className="freeplay-chord__bass">
              低音：{chordInfo.bassNote.name}{chordInfo.bassNote.octave}
            </div>
          )}
        </div>

        {/* 音名标签卡片 */}
        <div className="freeplay-notes">
          {noteInfos.length > 0 ? (
            noteInfos.map((note, index) => (
              <div
                key={`${note.midi}-${index}`}
                className={`freeplay-note-badge ${note.clef === 'bass' ? 'freeplay-note-badge--bass' : ''}`}
              >
                <span className="freeplay-note-badge__name">{note.name}</span>
                <span className="freeplay-note-badge__octave">{note.octave}</span>
              </div>
            ))
          ) : (
            <div className="freeplay-notes-empty">按下的音符将显示在这里</div>
          )}
        </div>

        {/* 清除按钮 */}
        <button
          className="btn-secondary freeplay-clear-btn"
          onClick={onClear}
          disabled={!hasNotes}
        >
          清除全部
        </button>
      </div>

      {/* 虚拟键盘 — 高亮使用 activeNotes（即时响应） */}
      <VirtualKeyboard
        currentNote={null}
        currentChord={null}
        answerState="idle"
        pressedNote={null}
        playedIndices={[]}
        wrongNote={null}
        mode="single"
        range={{ low: 48, high: 72 }}
        onKeyPress={onVirtualKeyPress}
        freePlayActiveNotes={activeNotes}
      />
    </div>
  );
}
