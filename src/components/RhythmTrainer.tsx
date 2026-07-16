/**
 * RhythmTrainer 组件
 * ============================================
 * 节奏训练界面：节拍器、节奏型可视化、敲击检测与统计。
 *
 * 依赖 useRhythm hook 提供全部状态与逻辑，本组件只负责展示与交互。
 * 所有元素使用 `rhythm-` 前缀的 className，样式由 App.css 提供。
 *
 * 布局：
 * ┌─────────────────────────────────────────────┐
 * │ 控制区：BPM 滑块 / 拍号 / 模式                │
 * ├─────────────────────────────────────────────┤
 * │ 节拍器：拍位指示灯（随节拍点亮）              │
 * ├─────────────────────────────────────────────┤
 * │ 节奏型：可视化方块 + 游标高亮                  │
 * ├─────────────────────────────────────────────┤
 * │ 统计：准确率 / 完美 / 良好 / 一般 / 错过 / 总数 │
 * ├─────────────────────────────────────────────┤
 * │ 操作：开始/停止、敲击(空格)、试听、重置        │
 * ├─────────────────────────────────────────────┤
 * │ 最近敲击结果（带颜色）                        │
 * └─────────────────────────────────────────────┘
 */

import { useEffect, useRef } from 'react';
import { useRhythm } from '../hooks/useRhythm';
import type { TimeSignature, RhythmMode, TapResult } from '../hooks/useRhythm';

interface RhythmTrainerProps {
  /** 虚拟键盘按键回调（保留用于接口兼容，当前节奏模块未使用） */
  onVirtualKeyPress: (midi: number) => void;
}

/** 可选拍号列表 */
const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8'];

/** 训练模式列表 */
const MODES: { value: RhythmMode; label: string }[] = [
  { value: 'practice', label: '练习模式' },
  { value: 'challenge', label: '挑战模式' },
];

/** 敲击结果 → 中文文案 */
const TAP_RESULT_TEXT: Record<TapResult, string> = {
  perfect: '完美',
  good: '良好',
  ok: '一般',
  miss: '错过',
};

/** 节奏音符类型 → 中文标签 */
const NOTE_LABEL: Record<string, string> = {
  quarter: '四分',
  eighth: '八分',
  half: '二分',
  rest: '休止',
};

export function RhythmTrainer({ onVirtualKeyPress }: RhythmTrainerProps) {
  const rhythm = useRhythm();

  // onVirtualKeyPress 保留用于接口兼容（后续可接入虚拟键盘），
  // 通过 ref 持有以避免「未使用」告警。
  const onVirtualKeyPressRef = useRef(onVirtualKeyPress);
  onVirtualKeyPressRef.current = onVirtualKeyPress;

  const {
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
  } = rhythm;

  // 空格键敲击：当焦点不在输入/按钮上时触发，避免与按钮自身空格激活冲突。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault();
      if (e.repeat) return;
      handleTap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTap]);

  // 点击按钮后失焦，使空格可直接触发敲击而非再次激活按钮
  const runAndBlur = (fn: () => void) => {
    fn();
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const tapResultText = lastTapResult ? TAP_RESULT_TEXT[lastTapResult] : '等待敲击';
  const tapResultClass = lastTapResult
    ? `rhythm-tap-result rhythm-tap-result--${lastTapResult}`
    : 'rhythm-tap-result rhythm-tap-result--none';

  // 挑战模式阶段提示
  let phaseHint = '';
  if (mode === 'challenge') {
    if (challengePhase === 'playing') phaseHint = '正在播放节奏型，请仔细聆听…';
    else if (challengePhase === 'recording') phaseHint = '请凭记忆敲击复现节奏型';
  } else if (isPlaying) {
    phaseHint = '跟随节拍器敲击（可使用空格键）';
  }

  return (
    <div className="rhythm-trainer">
      {/* —— 控制区 —— */}
      <div className="rhythm-controls">
        {/* BPM 滑块 */}
        <div className="rhythm-control rhythm-control--bpm">
          <label className="rhythm-control__label" htmlFor="rhythm-bpm-slider">
            速度 (BPM)
          </label>
          <div className="rhythm-bpm-row">
            <input
              id="rhythm-bpm-slider"
              className="rhythm-bpm-slider"
              type="range"
              min={40}
              max={200}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
            <span className="rhythm-bpm-value">{bpm}</span>
          </div>
        </div>

        {/* 拍号选择 */}
        <div className="rhythm-control rhythm-control--timesig">
          <span className="rhythm-control__label">拍号</span>
          <div className="rhythm-timesig-group">
            {TIME_SIGNATURES.map((ts) => (
              <button
                key={ts}
                type="button"
                className={`rhythm-timesig-btn ${ts === timeSignature ? 'rhythm-timesig-btn--active' : ''}`}
                onClick={() => setTimeSignature(ts)}
              >
                {ts}
              </button>
            ))}
          </div>
        </div>

        {/* 模式切换 */}
        <div className="rhythm-control rhythm-control--mode">
          <span className="rhythm-control__label">模式</span>
          <div className="rhythm-mode-group">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`rhythm-mode-btn ${m.value === mode ? 'rhythm-mode-btn--active' : ''}`}
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* —— 节拍器指示灯 —— */}
      <div className="rhythm-metronome">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <span
            key={i}
            className={`rhythm-beat-dot ${i === 0 ? 'rhythm-beat-dot--downbeat' : ''} ${
              isPlaying && i === currentBeat ? 'rhythm-beat-dot--active' : ''
            }`}
          />
        ))}
      </div>

      {/* —— 节奏型可视化 —— */}
      <div className="rhythm-pattern">
        {pattern.length === 0 ? (
          <div className="rhythm-pattern-empty">点击「开始训练」生成节奏型</div>
        ) : (
          pattern.map((note, i) => {
            const isActive = isPlaying && i === currentNoteIndex;
            const isMatched = matchedNotes[i];
            return (
              <div
                key={i}
                className={`rhythm-pattern-block rhythm-pattern-block--${note.type} ${
                  isActive ? 'rhythm-pattern-block--active' : ''
                } ${isMatched ? 'rhythm-pattern-block--matched' : ''}`}
                style={{ flexGrow: note.duration }}
              >
                {note.type === 'half' ? (
                  <>
                    <span className="rhythm-pattern-block__bar" />
                    <span className="rhythm-pattern-block__bar" />
                  </>
                ) : (
                  <span className="rhythm-pattern-block__label">{NOTE_LABEL[note.type]}</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* —— 阶段提示 —— */}
      {phaseHint && <div className="rhythm-phase">{phaseHint}</div>}

      {/* —— 统计 —— */}
      <div className="rhythm-stats">
        <div className="rhythm-stat rhythm-stat--accuracy">
          <div className="rhythm-stat__value">{accuracy}%</div>
          <div className="rhythm-stat__label">准确率</div>
        </div>
        <div className="rhythm-stat rhythm-stat--perfect">
          <div className="rhythm-stat__value">{stats.perfect}</div>
          <div className="rhythm-stat__label">完美</div>
        </div>
        <div className="rhythm-stat rhythm-stat--good">
          <div className="rhythm-stat__value">{stats.good}</div>
          <div className="rhythm-stat__label">良好</div>
        </div>
        <div className="rhythm-stat rhythm-stat--ok">
          <div className="rhythm-stat__value">{stats.ok}</div>
          <div className="rhythm-stat__label">一般</div>
        </div>
        <div className="rhythm-stat rhythm-stat--miss">
          <div className="rhythm-stat__value">{stats.miss}</div>
          <div className="rhythm-stat__label">错过</div>
        </div>
        <div className="rhythm-stat rhythm-stat--total">
          <div className="rhythm-stat__value">{stats.total}</div>
          <div className="rhythm-stat__label">总数</div>
        </div>
      </div>

      {/* —— 操作区 —— */}
      <div className="rhythm-actions">
        <button
          type="button"
          className={`rhythm-start-btn ${isPlaying ? 'rhythm-start-btn--stop' : ''}`}
          onClick={() => runAndBlur(isPlaying ? stop : start)}
        >
          {isPlaying ? '停止训练' : '开始训练'}
        </button>

        <button
          type="button"
          className="rhythm-tap-btn"
          style={{ minHeight: 44 }}
          onClick={() => runAndBlur(handleTap)}
          disabled={!isPlaying}
        >
          敲击 (空格)
        </button>

        <button
          type="button"
          className="rhythm-play-btn"
          onClick={() => runAndBlur(playPattern)}
          disabled={isPlaying}
        >
          试听节奏
        </button>

        <button
          type="button"
          className="rhythm-reset-btn"
          onClick={() => runAndBlur(resetStats)}
        >
          重置统计
        </button>
      </div>

      {/* —— 最近敲击结果 —— */}
      <div className={tapResultClass}>
        <span className="rhythm-tap-result__label">最近敲击：</span>
        <span className="rhythm-tap-result__value">{tapResultText}</span>
      </div>
    </div>
  );
}
