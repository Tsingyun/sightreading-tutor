/**
 * SettingsDrawer 组件
 * ============================================
 * 从右侧滑入的设置面板。
 * 包含谱号、模式、和弦大小、难度、调号、各类开关与声音开关。
 * 使用 AnimatePresence + motion 实现滑入/滑出与背景遮罩淡入淡出。
 */

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  TrainingConfig,
  ClefType,
  TrainingMode,
  ChordSize,
  KeySignature,
  DifficultyLevel,
} from '../types';

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  config: TrainingConfig;
  onUpdate: (partial: Partial<TrainingConfig>) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface PillOption {
  value: string | number;
  label: string;
}

/* ---------- 内部辅助组件 ---------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="settings-drawer__section">
      <div className="settings-drawer__section-title">{title}</div>
      {children}
    </div>
  );
}

function PillGroup({
  options,
  value,
  onSelect,
}: {
  options: PillOption[];
  value: string | number;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="pill-group">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          className={`pill ${opt.value === value ? 'pill--active' : ''}`}
          onClick={() => onSelect(String(opt.value))}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`toggle ${on ? 'toggle--on' : ''}`}
      onClick={onToggle}
    >
      <span className="toggle__thumb" />
    </button>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.6-5 4.4 1.5 6.5L12 17.3 5.9 20.6l1.5-6.5-5-4.4 6.6-.6z" />
    </svg>
  );
}

/* ---------- 配置项常量 ---------- */

const CLEF_OPTIONS: PillOption[] = [
  { value: 'treble', label: 'Treble' },
  { value: 'bass', label: 'Bass' },
  { value: 'both', label: 'Both' },
];

const MODE_OPTIONS: PillOption[] = [
  { value: 'single', label: 'Single Note' },
  { value: 'chord', label: 'Chord' },
];

const CHORD_SIZE_OPTIONS: PillOption[] = [
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
];

const KEY_SIGNATURE_OPTIONS: PillOption[] = [
  { value: 'C', label: 'C' },
  { value: 'G', label: 'G' },
  { value: 'D', label: 'D' },
  { value: 'F', label: 'F' },
];

/* ---------- 主组件 ---------- */

export function SettingsDrawer({
  visible,
  onClose,
  config,
  onUpdate,
  soundEnabled,
  onToggleSound,
}: SettingsDrawerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* 背景遮罩：点击关闭 */}
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
              background: 'rgba(6, 7, 9, 0.6)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* 滑入面板 */}
          <motion.div
            className="settings-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="settings-drawer__header">
              <h2 className="settings-drawer__title">Settings</h2>
              <button
                type="button"
                className="settings-drawer__close"
                onClick={onClose}
                aria-label="Close settings"
              >
                <CloseIcon />
              </button>
            </div>

            {/* 1. 谱号 */}
            <Section title="Clef">
              <PillGroup
                options={CLEF_OPTIONS}
                value={config.clef}
                onSelect={(v) => onUpdate({ clef: v as ClefType })}
              />
            </Section>

            {/* 2. 模式 */}
            <Section title="Mode">
              <PillGroup
                options={MODE_OPTIONS}
                value={config.mode}
                onSelect={(v) => onUpdate({ mode: v as TrainingMode })}
              />
            </Section>

            {/* 3. 和弦大小（仅和弦模式） */}
            {config.mode === 'chord' && (
              <Section title="Chord Size">
                <PillGroup
                  options={CHORD_SIZE_OPTIONS}
                  value={config.chordSize}
                  onSelect={(v) => onUpdate({ chordSize: Number(v) as ChordSize })}
                />
              </Section>
            )}

            {/* 4. 难度（星级） */}
            <Section title="Difficulty">
              <div className="difficulty-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`difficulty-star ${n <= config.difficultyLevel ? 'difficulty-star--active' : ''}`}
                    onClick={() => onUpdate({ difficultyLevel: n as DifficultyLevel })}
                    aria-label={`Difficulty ${n}`}
                  >
                    <StarIcon />
                  </button>
                ))}
              </div>
            </Section>

            {/* 5. 调号 */}
            <Section title="Key Signature">
              <PillGroup
                options={KEY_SIGNATURE_OPTIONS}
                value={config.keySignature}
                onSelect={(v) => onUpdate({ keySignature: v as KeySignature })}
              />
            </Section>

            {/* 6. 音名提示开关 */}
            <div className="settings-drawer__section">
              <div className="setting-row">
                <span className="setting-row__label">Note Labels</span>
                <Toggle
                  on={config.showNoteLabel}
                  onToggle={() => onUpdate({ showNoteLabel: !config.showNoteLabel })}
                />
              </div>
            </div>

            {/* 7. 答错自动下一题 */}
            <div className="settings-drawer__section">
              <div className="setting-row">
                <span className="setting-row__label">Auto Next on Error</span>
                <Toggle
                  on={config.autoNextOnError}
                  onToggle={() => onUpdate({ autoNextOnError: !config.autoNextOnError })}
                />
              </div>
            </div>

            {/* 8. 升降号 */}
            <div className="settings-drawer__section">
              <div className="setting-row">
                <span className="setting-row__label">Accidentals</span>
                <Toggle
                  on={config.includeAccidentals}
                  onToggle={() => onUpdate({ includeAccidentals: !config.includeAccidentals })}
                />
              </div>
            </div>

            {/* 9. 声音开关 */}
            <div className="settings-drawer__section">
              <div className="setting-row">
                <span className="setting-row__label">Sound</span>
                <Toggle on={soundEnabled} onToggle={onToggleSound} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
