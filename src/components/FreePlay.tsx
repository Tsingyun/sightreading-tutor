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
 * 布局：
 * ┌──────────────────────────────────────┐
 * │         Staff（五线谱渲染区域）         │
 * ├──────────────────────────────────────┤
 * │     ChordDisplay（和弦名称+转位）      │
 * ├──────────────────────────────────────┤
 * │     NoteBadges（音名标签卡片）         │
 * ├──────────────────────────────────────┤
 * │     VirtualKeyboard（虚拟键盘）        │
 * └──────────────────────────────────────┘
 */

import { useMemo } from 'react';
import { Staff } from './Staff';
import { VirtualKeyboard } from './VirtualKeyboard';
import { midiToNoteInfo } from '../lib/music';
import type { IdentifiedChord, ThemeMode, ChordInfo } from '../types';

interface FreePlayProps {
  activeNotes: number[];
  chordInfo: IdentifiedChord | null;
  theme: ThemeMode;
  onVirtualKeyPress: (midi: number) => void;
  onClear: () => void;
}

export function FreePlay({
  activeNotes,
  chordInfo,
  theme,
  onVirtualKeyPress,
  onClear,
}: FreePlayProps) {
  // 将活跃音符转换为 NoteInfo 数组，用于五线谱渲染
  const noteInfos = useMemo(
    () => activeNotes.map((m) => midiToNoteInfo(m)),
    [activeNotes],
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

  const hasNotes = activeNotes.length > 0;

  return (
    <div className="freeplay">
      {/* 五线谱区域 */}
      <div className="staff-wrapper">
        {hasNotes ? (
          <Staff
            note={null}
            chord={chordForStaff}
            playedIndices={[]}
            answerState="revealed"
            clefMode="both"
            theme={theme}
          />
        ) : (
          <div className="freeplay-placeholder">
            <div className="freeplay-placeholder__icon">🎹</div>
            <p className="freeplay-placeholder__text">
              弹奏 MIDI 键盘或点击下方虚拟键盘
            </p>
            <p className="freeplay-placeholder__sub">
              音符将实时显示在五线谱上，并自动识别和弦与转位
            </p>
          </div>
        )}
      </div>

      {/* 和弦信息 + 音名标签 */}
      {hasNotes && (
        <div className="freeplay-info">
          {/* 和弦名称展示 */}
          {chordInfo && chordCategory !== 'unknown' && (
            <div className={`freeplay-chord freeplay-chord--${chordCategory}`}>
              <div className="freeplay-chord__label">
                {chordCategory === 'single' ? '音名' : chordCategory === 'interval' ? '音程' : '和弦'}
              </div>
              <div className="freeplay-chord__name">
                {chordInfo.chordName}
              </div>
              {chordInfo.inversionName && chordInfo.inversion > 0 && (
                <div className="freeplay-chord__inversion">
                  {chordInfo.inversionName}
                </div>
              )}
              {chordInfo.root && chordCategory === 'chord' && (
                <div className="freeplay-chord__root">
                  根音：{chordInfo.root.name}{chordInfo.root.octave}
                </div>
              )}
              {chordInfo.bassNote && chordCategory === 'chord' && chordInfo.inversion > 0 && (
                <div className="freeplay-chord__bass">
                  低音：{chordInfo.bassNote.name}{chordInfo.bassNote.octave}
                </div>
              )}
            </div>
          )}

          {/* 音名标签卡片 */}
          <div className="freeplay-notes">
            {noteInfos.map((note, index) => (
              <div
                key={`${note.midi}-${index}`}
                className={`freeplay-note-badge ${note.clef === 'bass' ? 'freeplay-note-badge--bass' : ''}`}
              >
                <span className="freeplay-note-badge__name">{note.name}</span>
                <span className="freeplay-note-badge__octave">{note.octave}</span>
              </div>
            ))}
          </div>

          {/* 清除按钮 */}
          <button className="btn-secondary freeplay-clear-btn" onClick={onClear}>
            清除全部
          </button>
        </div>
      )}

      {/* 虚拟键盘 */}
      <VirtualKeyboard
        currentNote={null}
        currentChord={null}
        answerState="idle"
        pressedNote={null}
        playedIndices={[]}
        wrongNote={null}
        mode="single"
        range={{ low: 36, high: 84 }}
        onKeyPress={onVirtualKeyPress}
        freePlayActiveNotes={activeNotes}
      />
    </div>
  );
}
