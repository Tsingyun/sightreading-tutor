/**
 * MidiIndicator 组件
 * ============================================
 * 角落处低调的 MIDI 状态指示器，点击可展开为设备列表面板。
 * 状态：未连接（灰点）/ 连接中（金色脉冲点）/ 已连接（鼠尾草绿点）/ 错误（赤陶色点）。
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  const [expanded, setExpanded] = useState(false);

  const stateClass = error
    ? 'midi-indicator--error'
    : connecting
      ? 'midi-indicator--connecting'
      : connected
        ? 'midi-indicator--connected'
        : '';

  const selectedDevice =
    devices.find((d) => d.id === selectedDeviceId) ?? devices[0] ?? null;

  const label = connected && selectedDevice ? selectedDevice.name : 'MIDI';

  const handleClick = () => {
    if (!supported) return;
    setExpanded((prev) => !prev);
  };

  return (
    <>
      <button
        type="button"
        className={`midi-indicator ${stateClass}`}
        onClick={handleClick}
        aria-expanded={expanded}
        aria-label={`MIDI status: ${label}. Click to ${expanded ? 'collapse' : 'expand'}`}
      >
        <span className="midi-indicator__dot" />
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="midi-panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="midi-panel__title">MIDI Devices</div>

            {!supported ? (
              <div className="midi-panel__error">
                Web MIDI is not supported in this browser. Try Chrome, Edge, or Opera.
              </div>
            ) : devices.length === 0 ? (
              <div className="midi-panel__error">
                {connected
                  ? 'MIDI is authorized, but no input devices were detected.'
                  : 'No devices detected. Connect a MIDI keyboard and retry.'}
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
              {connecting ? 'Connecting…' : connected ? 'Reconnect' : 'Connect MIDI'}
            </button>

            {error && <div className="midi-panel__error">{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
