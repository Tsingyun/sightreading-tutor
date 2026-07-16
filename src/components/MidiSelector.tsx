/**
 * MidiSelector 组件
 * ============================================
 * MIDI 设备连接状态与选择器。
 */

import type { MidiDeviceInfo } from '../types';

interface MidiSelectorProps {
  supported: boolean;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  devices: MidiDeviceInfo[];
  selectedDeviceId: string | null;
  lastNote: number | null;
  onConnect: () => void;
  onSelect: (id: string) => void;
}

export function MidiSelector({
  supported,
  connected,
  connecting,
  error,
  devices,
  selectedDeviceId,
  lastNote,
  onConnect,
  onSelect,
}: MidiSelectorProps) {
  return (
    <div className="midi-selector">
      <div className="midi-header">
        <div className="midi-status">
          <span className={`midi-dot ${connected ? 'midi-dot--on' : ''}`} />
          <span className="midi-label">
            {connecting
              ? '连接中...'
              : connected
                ? devices.length > 0
                  ? 'MIDI 已连接'
                  : 'MIDI 已授权，未检测到设备'
                : 'MIDI 未连接'}
          </span>
        </div>
        {!connected && (
          <button className="btn-connect" onClick={onConnect} disabled={!supported || connecting}>
            {connecting ? '连接中...' : '连接 MIDI'}
          </button>
        )}
      </div>

      {error && <div className="midi-error">{error}</div>}

      {!supported && (
        <div className="midi-warning">
          当前浏览器不支持 Web MIDI API。请使用 Chrome、Edge 或 Opera 浏览器以获得完整体验。
        </div>
      )}

      {connected && devices.length > 0 && (
        <div className="midi-device-select">
          <label>输入设备</label>
          <select
            value={selectedDeviceId || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.manufacturer})
              </option>
            ))}
          </select>
        </div>
      )}

      {connected && devices.length === 0 && (
        <div className="midi-hint">
          请将 MIDI 键盘连接到电脑，然后重新点击"连接 MIDI"。
        </div>
      )}

      {lastNote !== null && (
        <div className="midi-last-note">
          按键检测：<span className="midi-note-display">{lastNote}</span>
        </div>
      )}
    </div>
  );
}
