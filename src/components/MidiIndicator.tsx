/**
 * MidiIndicator 组件
 * ============================================
 * 角落处低调的 MIDI 状态指示器，点击可展开为设备列表面板。
 * 状态：未连接（灰点）/ 连接中（金色脉冲点）/ 已连接（鼠尾草绿点）/ 错误（赤陶色点）。
 *
 * 面板可通过以下方式关闭：
 * - 点击关闭按钮
 * -点击面板外部区域
 * - 再次点击 MIDI 指示器按钮
 */

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import type { MidiDeviceInfo } from '../types';

interface MidiIndicatorProps {
  supported: boolean;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  devices: MidiDeviceInfo[];
  selectedDeviceId: string | null;
  onConnect: () => void;
  onSelect: (id: string) => void;
}

export function MidiIndicator({
  supported,
  connected,
  connecting,
  error,
  devices,
  selectedDeviceId,
  onConnect,
  onSelect,
}: MidiIndicatorProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLButtonElement>(null);

  const stateClass = error
    ? 'midi-indicator--error'
    : connecting
      ? 'midi-indicator--connecting'
      : connected
        ? 'midi-indicator--connected'
        : '';

  const selectedDevice =
    devices.find((d) => d.id === selectedDeviceId) ?? devices[0] ?? null;

  const label = connected && selectedDevice ? selectedDevice.name : t('midi.label');

  const handleClick = () => {
    if (!supported) return;
    setExpanded((prev) => !prev);
  };

  const handleClose = () => {
    setExpanded(false);
  };

  // 点击面板外部时关闭
  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // 如果点击的不是面板内部，也不是指示器按钮本身，则关闭
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        indicatorRef.current &&
        !indicatorRef.current.contains(target)
      ) {
        setExpanded(false);
      }
    };

    // 延迟绑定，避免触发面板展开的同一个点击事件
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [expanded]);

  return (
    <>
      <button
        ref={indicatorRef}
        type="button"
        className={`midi-indicator ${stateClass}`}
        onClick={handleClick}
        aria-expanded={expanded}
        aria-label={t('midi.status', { label })}
      >
        <span className="midi-indicator__dot" />
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            ref={panelRef}
            className="midi-panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="midi-panel__header">
              <div className="midi-panel__title">{t('midi.devices')}</div>
              <button
                type="button"
                className="midi-panel__close"
                onClick={handleClose}
                aria-label={t('midi.close')}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {!supported ? (
              <div className="midi-panel__error">
                {t('midi.notSupported')}
              </div>
            ) : devices.length === 0 ? (
              <div className="midi-panel__error">
                {connected
                  ? t('midi.authorizedNoDevice')
                  : t('midi.noDevices')}
              </div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.id}
                  type="button"
                  className={`midi-panel__device ${device.id === selectedDeviceId ? 'midi-panel__device--active' : ''}`}
                  onClick={() => onSelect(device.id)}
                >
                  {device.name}
                  {device.manufacturer ? ` · ${device.manufacturer}` : ''}
                </button>
              ))
            )}

            <button
              type="button"
              className="midi-panel__connect-btn"
              onClick={onConnect}
              disabled={!supported || connecting}
            >
              {connecting ? t('midi.connecting') : connected ? t('midi.reconnect') : t('midi.connect')}
            </button>

            {error && <div className="midi-panel__error">{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
