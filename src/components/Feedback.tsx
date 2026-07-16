/**
 * Feedback 组件
 * ============================================
 * 显示答题反馈：正确、错误、揭示答案时的提示信息和动画。
 * 支持单音和和弦两种模式的反馈。
 * 包含渐进式提示功能：引导初学者逐步推导答案。
 */

import type { AnswerState, NoteInfo, ChordInfo, TrainingMode } from '../types';
import { midiToDisplayString } from '../lib/music';

interface FeedbackProps {
  answerState: AnswerState;
  currentNote: NoteInfo | null;
  currentChord: ChordInfo | null;
  pressedNote: number | null;
  mode: TrainingMode;
  playedIndices: number[];
  wrongNote: number | null;
  hintLevel: number;
  hintText: string;
  onReveal: () => void;
  onNext: () => void;
  onRetry: () => void;
  onHint: () => void;
}

export function Feedback({
  answerState,
  currentNote,
  currentChord,
  pressedNote,
  mode,
  playedIndices,
  wrongNote,
  hintLevel,
  hintText,
  onReveal,
  onNext,
  onRetry,
  onHint,
}: FeedbackProps) {
  const hasContent = mode === 'chord' ? currentChord : currentNote;

  if (answerState === 'pending' || answerState === 'idle') {
    // 和弦模式下显示进度提示
    if (mode === 'chord' && currentChord) {
      // 错误音短暂提示
      if (wrongNote !== null) {
        const wrongName = midiToDisplayString(wrongNote);
        const progress = playedIndices.length > 0
          ? `（已弹对 ${playedIndices.length} / ${currentChord.notes.length} 个音）`
          : '';
        return (
          <div className="feedback feedback--wrong">
            <p className="feedback-text">
              <strong>{wrongName}</strong> 不在和弦中，继续尝试！{progress}
            </p>
          </div>
        );
      }

      if (playedIndices.length > 0) {
        return (
          <div className="feedback feedback--pending">
            <p className="feedback-hint">
              已弹对 {playedIndices.length} / {currentChord.notes.length} 个音，继续！
            </p>
          </div>
        );
      }

      return (
        <div className="feedback feedback--pending">
          <p className="feedback-hint">请依次弹奏和弦中的所有音</p>
        </div>
      );
    }

    // 单音模式：显示提示内容 + 提示按钮
    if (hasContent && answerState === 'pending') {
      return (
        <div className="feedback feedback--pending">
          {hintLevel > 0 && (
            <p className="feedback-hint-text">{hintText}</p>
          )}
          <div className="feedback-pending-row">
            <p className="feedback-hint">
              请在 MIDI 键盘上按下对应的琴键
            </p>
            <div className="feedback-actions">
              <button
                className="btn-feedback btn-feedback--hint"
                onClick={onHint}
                disabled={hintLevel >= 3}
              >
                {hintLevel === 0 ? '💡 提示' : hintLevel < 3 ? '💡 更多提示' : '💡 已无更多提示'}
              </button>
              <button className="btn-feedback" onClick={onReveal}>
                查看答案
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="feedback feedback--pending">
        <p className="feedback-hint">
          {hasContent
            ? mode === 'chord'
              ? '请依次弹奏和弦中的所有音'
              : '请在 MIDI 键盘上按下对应的琴键'
            : '点击"开始训练"开始练习'}
        </p>
      </div>
    );
  }

  if (answerState === 'correct') {
    return (
      <div className="feedback feedback--correct">
        <div className="feedback-icon">✓</div>
        <p className="feedback-text">
          {mode === 'chord' && currentChord ? (
            <>正确！这是 <strong>{currentChord.name}</strong></>
          ) : (
            '正确！'
          )}
        </p>
      </div>
    );
  }

  if (answerState === 'wrong') {
    const pressedName = pressedNote !== null ? midiToDisplayString(pressedNote) : '';

    return (
      <div className="feedback feedback--wrong">
        <div className="feedback-icon">✗</div>
        <p className="feedback-text">
          不对！你按的是 <strong>{pressedName}</strong>
        </p>
        {hintLevel > 0 && (
          <p className="feedback-hint-text">{hintText}</p>
        )}
        <div className="feedback-actions">
          <button className="btn-feedback" onClick={onRetry}>
            再试一次
          </button>
          {mode === 'single' && (
            <button
              className="btn-feedback btn-feedback--hint"
              onClick={onHint}
              disabled={hintLevel >= 3}
            >
              {hintLevel === 0 ? '💡 提示' : hintLevel < 3 ? '💡 更多提示' : '💡 已无更多提示'}
            </button>
          )}
          <button className="btn-feedback btn-feedback--primary" onClick={onReveal}>
            查看答案
          </button>
        </div>
      </div>
    );
  }

  if (answerState === 'revealed') {
    if (mode === 'chord' && currentChord) {
      const noteNames = currentChord.notes.map((n) => n.name + n.octave).join('  ');
      return (
        <div className="feedback feedback--revealed">
          <div className="feedback-icon">♪</div>
          <p className="feedback-text">
            正确答案是 <strong>{currentChord.name}</strong>
          </p>
          <p className="feedback-sub">音符：{noteNames}</p>
          <div className="feedback-actions">
            <button className="btn-feedback btn-feedback--primary" onClick={onNext}>
              下一题
            </button>
          </div>
        </div>
      );
    }

    const targetName = currentNote ? midiToDisplayString(currentNote.midi) : '';

    return (
      <div className="feedback feedback--revealed">
        <div className="feedback-icon">♪</div>
        <p className="feedback-text">
          正确答案是 <strong>{targetName}</strong>
        </p>
        <div className="feedback-actions">
          <button className="btn-feedback btn-feedback--primary" onClick={onNext}>
            下一题
          </button>
        </div>
      </div>
    );
  }

  return null;
}
