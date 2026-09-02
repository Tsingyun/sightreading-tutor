/**
 * Onboarding 组件
 * ============================================
 * 首次使用引导浮层，共三步：
 * 1. 欢迎介绍
 * 2. MIDI 连接说明
 * 3. 四种学习模式介绍
 * 关闭时标记引导已查看（saveGuideSeen），不再自动弹出。
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { saveGuideSeen } from '../lib/storage';
import { useLanguage } from '../i18n/LanguageContext';
import type { AppMode } from '../types';

interface OnboardingProps {
  visible: boolean;
  onClose: () => void;
}

/* ---------- 小图标（用于第三步的模式卡片） ---------- */

function NoteIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="8" cy="17.5" rx="4" ry="3" transform="rotate(-20 8 17.5)" fill="currentColor" />
      <path d="M11.7 17.5 V5" />
      <path d="M11.7 5 C16.5 6.5 16.5 11.5 12.5 12.5" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <line x1="8" y1="6" x2="8" y2="20" />
      <line x1="13" y1="6" x2="13" y2="20" />
      <line x1="18" y1="6" x2="18" y2="20" />
      <rect x="6.5" y="6" width="3" height="8" fill="currentColor" stroke="none" />
      <rect x="11.5" y="6" width="3" height="8" fill="currentColor" stroke="none" />
      <rect x="16.5" y="6" width="3" height="8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MetronomeIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21 L11 4 H13 L16 21 Z" />
      <line x1="6" y1="21" x2="18" y2="21" />
      <line x1="12" y1="11" x2="15.5" y2="7.5" />
      <circle cx="15.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SheetIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <ellipse cx="9.5" cy="16" rx="1.5" ry="1.1" fill="currentColor" stroke="none" />
      <ellipse cx="14.5" cy="16" rx="1.5" ry="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V8l8-4v12" />
      <path d="M12 16l8-4" />
      <circle cx="4" cy="20" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="20" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---------- 步骤大图视觉 ---------- */

function WelcomeVisual() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <ellipse cx="34" cy="72" rx="14" ry="10.5" fill="var(--gold)" transform="rotate(-20 34 72)" />
      <rect x="46" y="16" width="3.5" height="58" fill="var(--gold)" rx="1.75" />
      <path
        d="M49.5 16 C70 24 68 44 56 50 C62 40 58 28 49.5 28 Z"
        fill="var(--gold)"
      />
    </svg>
  );
}

function MidiVisual() {
  const whiteKeys = [0, 1, 2, 3, 4, 5, 6];
  const blackKeys = [0, 1, 3, 4, 5];
  return (
    <svg width="220" height="92" viewBox="0 0 220 92" fill="none" aria-hidden="true">
      {whiteKeys.map((i) => (
        <rect
          key={i}
          x={i * 30 + 5}
          y="10"
          width="28"
          height="72"
          rx="3"
          fill="var(--bg-surface)"
          stroke="var(--border-default)"
          strokeWidth="1"
        />
      ))}
      {blackKeys.map((i) => (
        <rect
          key={i}
          x={i * 30 + 25}
          y="10"
          width="16"
          height="44"
          rx="2"
          fill="var(--fg-primary)"
        />
      ))}
    </svg>
  );
}

function PathsVisual() {
  const { t } = useLanguage();
  const modes: { mode: AppMode; label: string; icon: ReactNode }[] = [
    { mode: 'training', label: t('onboarding.path.training'), icon: <NoteIcon /> },
    { mode: 'freeplay', label: t('onboarding.path.freeplay'), icon: <KeyboardIcon /> },
    { mode: 'rhythm', label: t('onboarding.path.rhythm'), icon: <MetronomeIcon /> },
    { mode: 'song', label: t('onboarding.path.song'), icon: <SheetIcon /> },
    { mode: 'scales', label: t('onboarding.path.scales'), icon: <ScaleIcon /> },
  ];
  return (
    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
      {modes.map((m) => (
        <div
          key={m.mode}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '14px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}
          >
            {m.icon}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'var(--fg-tertiary)',
            }}
          >
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- 步骤定义（文案由 i18n 提供） ---------- */

const STEPS: { visual: ReactNode }[] = [
  { visual: <WelcomeVisual /> },
  { visual: <MidiVisual /> },
  { visual: <PathsVisual /> },
];

/* ---------- 主组件 ---------- */

export function Onboarding({ visible, onClose }: OnboardingProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  // 浮层打开时回到第一步
  useEffect(() => {
    if (visible) setStep(0);
  }, [visible]);

  // ESC 关闭
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    saveGuideSeen();
    onClose();
  };

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const title = t('onboarding.step' + (step + 1) + 'Title');
  const body = t('onboarding.step' + (step + 1) + 'Body');
  const indicator = `${String(step + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="onboarding">
            <div className="onboarding__step-indicator">{indicator}</div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                style={{ width: '100%' }}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="onboarding__visual">{current.visual}</div>
                <h2 className="onboarding__title">{title}</h2>
                <p className="onboarding__body">{body}</p>
              </motion.div>
            </AnimatePresence>

            <div className="onboarding__actions">
              <button
                type="button"
                className="onboarding__btn onboarding__btn--ghost"
                onClick={handleClose}
              >
                {t('onboarding.skip')}
              </button>
              <button
                type="button"
                className="onboarding__btn onboarding__btn--primary"
                onClick={() => (isLast ? handleClose() : setStep(step + 1))}
              >
                {isLast ? t('onboarding.begin') : t('onboarding.next')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
