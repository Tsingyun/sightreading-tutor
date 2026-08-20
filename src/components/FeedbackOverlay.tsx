/**
 * FeedbackOverlay — Nocturne Contextual Practice Feedback
 * ============================================
 * Center-screen feedback that appears during practice.
 * Shows pending actions, correct/wrong/revealed states.
 */

import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import type { AnswerState } from '../types';

export interface FeedbackOverlayProps {
  answerState: AnswerState;
  hintLevel?: number;
  hintText?: string;
  onReveal?: () => void;
  onNext?: () => void;
  onRetry?: () => void;
  onHint?: () => void;
  noteName?: string;
  chordName?: string;
}

function FeedbackOverlayImpl(props: FeedbackOverlayProps) {
  const { t } = useLanguage();
  const {
    answerState,
    hintLevel = 0,
    hintText = '',
    onReveal,
    onNext,
    onRetry,
    onHint,
    noteName,
    chordName,
  } = props;

  // Keyboard shortcuts for pending state
  useEffect(() => {
    if (answerState !== 'pending') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); onHint?.(); }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); onReveal?.(); }
      else if (e.key === ' ' || e.key === 'n' || e.key === 'N') { e.preventDefault(); onNext?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answerState, onHint, onReveal, onNext]);

  const icon = answerState === 'correct' ? '✓' : answerState === 'wrong' ? '✗' : noteName || '';
  const iconClass =
    answerState === 'correct' ? 'feedback-overlay__icon--correct' :
    answerState === 'wrong' ? 'feedback-overlay__icon--wrong' :
    'feedback-overlay__icon--revealed';

  const feedbackText =
    answerState === 'correct' ? t('feedback.correct') :
    answerState === 'wrong' ? (noteName ? `${t('feedback.correctWith')}${noteName}` : t('feedback.incorrect')) :
    answerState === 'revealed' ? (chordName || noteName || '') : '';

  return (
    <div className="feedback-overlay">
      <AnimatePresence mode="wait">
        {answerState === 'pending' && (
          <motion.div
            key="pending"
            className="feedback-pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {hintText && (
              <span className="feedback-pending__text">{hintText}</span>
            )}
            {!hintText && (
              <span className="feedback-pending__text">
                {hintLevel === 0 ? t('feedback.playNote') : t('feedback.keepGoing')}
              </span>
            )}
            <div className="feedback-pending__actions">
              {onHint && hintLevel < 3 && (
                <button className="feedback-btn" onClick={onHint}>
                  {t('feedback.hint')}
                </button>
              )}
              {onReveal && (
                <button className="feedback-btn" onClick={onReveal}>
                  {t('feedback.reveal')}
                </button>
              )}
              {onNext && (
                <button className="feedback-btn feedback-btn--primary" onClick={onNext}>
                  {t('feedback.skip')}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {(answerState === 'correct' || answerState === 'wrong' || answerState === 'revealed') && (
          <motion.div
            key={answerState}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`feedback-overlay__icon ${iconClass}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {icon}
            </motion.div>
            {feedbackText && (
              <motion.div
                className="feedback-overlay__text"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              >
                {feedbackText}
              </motion.div>
            )}
            {answerState === 'wrong' && onRetry && (
              <motion.div
                className="feedback-pending__actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <button className="feedback-btn" onClick={onRetry}>{t('feedback.retry')}</button>
                {onNext && (
                  <button className="feedback-btn feedback-btn--primary" onClick={onNext}>{t('feedback.next')}</button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const FeedbackOverlay = memo(FeedbackOverlayImpl);
