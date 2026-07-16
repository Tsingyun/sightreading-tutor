/**
 * SettingsPanel 组件
 * ============================================
 * 训练设置：难度等级、训练模式、谱号选择、音域预设、升降号开关、
 * 音名提示开关、错误处理方式。
 * 支持单音模式和和弦模式（可选择 2/3/4 个音符）。
 */

import type { TrainingConfig, ClefType, TrainingMode, ChordSize, KeySignature } from '../types';
import { RANGE_PRESETS, DIFFICULTY_LEVELS, KEY_SIGNATURES } from '../lib/music';
import { midiToDisplayString } from '../lib/music';
import { ClefIcon } from './ClefIcon';

interface SettingsPanelProps {
  config: TrainingConfig;
  onUpdate: (partial: Partial<TrainingConfig>) => void;
}

const CLEF_OPTIONS: { value: ClefType; label: string; clef: 'treble' | 'bass' | 'both' }[] = [
  { value: 'treble', label: '高音谱号', clef: 'treble' },
  { value: 'bass', label: '低音谱号', clef: 'bass' },
  { value: 'both', label: '双谱表', clef: 'both' },
];

const MODE_OPTIONS: { value: TrainingMode; label: string; icon: string }[] = [
  { value: 'single', label: '单音训练', icon: '♪' },
  { value: 'chord', label: '和弦训练', icon: '♪♫' },
];

const CHORD_SIZE_OPTIONS: { value: ChordSize; label: string; desc: string }[] = [
  { value: 2, label: '2 音', desc: '音程' },
  { value: 3, label: '3 音', desc: '三和弦' },
  { value: 4, label: '4 音', desc: '七和弦' },
];

export function SettingsPanel({ config, onUpdate }: SettingsPanelProps) {
  const presets = RANGE_PRESETS.filter((p) => p.clef === config.clef);

  return (
    <div className="settings-panel">
      <h3>训练设置</h3>

      {/* 难度等级 */}
      <div className="settings-group">
        <label className="settings-label">难度等级</label>
        <div className="difficulty-levels">
          {DIFFICULTY_LEVELS.map((lvl) => (
            <button
              key={lvl.level}
              className={`difficulty-level ${config.difficultyLevel === lvl.level ? 'difficulty-level--active' : ''}`}
              onClick={() => onUpdate({ difficultyLevel: lvl.level })}
            >
              <span className="difficulty-level__num">L{lvl.level}</span>
              <span className="difficulty-level__name">{lvl.name}</span>
              <span className="difficulty-level__desc">{lvl.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 音名提示开关 */}
      <div className="settings-group">
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={config.showNoteLabel}
            onChange={(e) => onUpdate({ showNoteLabel: e.target.checked })}
          />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-label">显示音名提示 🏷️</span>
        </label>
        <p className="settings-hint">开启后在五线谱上显示音名，帮助初学者建立对应关系</p>
      </div>

      {/* 训练模式选择 */}
      <div className="settings-group">
        <label className="settings-label">训练模式</label>
        <div className="mode-tabs">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`mode-tab ${config.mode === opt.value ? 'mode-tab--active' : ''}`}
              onClick={() => onUpdate({ mode: opt.value })}
            >
              <span className="mode-icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 和弦音符数量选择（仅和弦模式显示） */}
      {config.mode === 'chord' && (
        <div className="settings-group">
          <label className="settings-label">和弦音符数</label>
          <div className="chord-size-tabs">
            {CHORD_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`chord-size-tab ${config.chordSize === opt.value ? 'chord-size-tab--active' : ''}`}
                onClick={() => onUpdate({ chordSize: opt.value })}
              >
                <span className="chord-size-num">{opt.label}</span>
                <span className="chord-size-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 谱号选择 */}
      <div className="settings-group">
        <label className="settings-label">谱号模式</label>
        <div className="clef-tabs">
          {CLEF_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`clef-tab ${config.clef === opt.value ? 'clef-tab--active' : ''}`}
              onClick={() => onUpdate({ clef: opt.value })}
            >
              <span className="clef-icon">
                {opt.clef === 'both' ? (
                  <>
                    <ClefIcon type="treble" size={18} />
                    <ClefIcon type="bass" size={18} />
                  </>
                ) : (
                  <ClefIcon type={opt.clef} size={20} />
                )}
              </span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 音域选择 */}
      <div className="settings-group">
        <label className="settings-label">音域范围</label>
        <div className="range-presets">
          {presets.map((preset) => {
            const isActive = config.lowNote === preset.low && config.highNote === preset.high;
            return (
              <button
                key={preset.label}
                className={`range-preset ${isActive ? 'range-preset--active' : ''}`}
                onClick={() => onUpdate({ lowNote: preset.low, highNote: preset.high })}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="range-current">
          当前范围：{midiToDisplayString(config.lowNote)} ~ {midiToDisplayString(config.highNote)}
        </div>
      </div>

      {/* 调号选择 */}
      <div className="settings-group">
        <label className="settings-label">调号</label>
        <div className="keysig-tabs">
          {KEY_SIGNATURES.map((ks) => (
            <button
              key={ks.key}
              className={`keysig-tab ${config.keySignature === ks.key ? 'keysig-tab--active' : ''}`}
              onClick={() => onUpdate({ keySignature: ks.key as KeySignature })}
            >
              {ks.name}
            </button>
          ))}
        </div>
        <p className="settings-hint">选择调号后，训练音符将在该调的自然音阶内生成</p>
      </div>

      {/* 升降号开关（仅单音模式、C 调时显示） */}
      {config.mode === 'single' && config.keySignature === 'C' && (
        <div className="settings-group">
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={config.includeAccidentals}
              onChange={(e) => onUpdate({ includeAccidentals: e.target.checked })}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-label">包含升降号（♯ ♭）</span>
          </label>
        </div>
      )}

      {/* 错误处理方式 */}
      <div className="settings-group">
        <label className="settings-label">答错后</label>
        <div className="error-mode-tabs">
          <button
            className={`error-mode-tab ${!config.autoNextOnError ? 'error-mode-tab--active' : ''}`}
            onClick={() => onUpdate({ autoNextOnError: false })}
          >
            允许继续尝试
          </button>
          <button
            className={`error-mode-tab ${config.autoNextOnError ? 'error-mode-tab--active' : ''}`}
            onClick={() => onUpdate({ autoNextOnError: true })}
          >
            自动下一题
          </button>
        </div>
      </div>
    </div>
  );
}
