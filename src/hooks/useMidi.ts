/**
 * useMidi Hook
 * ============================================
 * 管理 Web MIDI API 连接状态、设备列表和按键输入。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MidiDeviceInfo } from '../types';
import {
  isMidiSupported,
  requestMidiAccess,
  getInputDevices,
  listenToMidiInput,
  type MidiNoteCallback,
} from '../lib/midi';

export interface UseMidiReturn {
  /** 是否支持 Web MIDI */
  supported: boolean;
  /** 是否已连接 */
  connected: boolean;
  /** 连接中 */
  connecting: boolean;
  /** 错误信息 */
  error: string | null;
  /** 可用输入设备列表 */
  devices: MidiDeviceInfo[];
  /** 当前选中的设备 ID */
  selectedDeviceId: string | null;
  /** 最后按下的 MIDI 音高 */
  lastNote: number | null;
  /** 请求 MIDI 访问权限 */
  connect: () => Promise<void>;
  /** 选择设备 */
  selectDevice: (id: string) => void;
  /** 注册按键回调 */
  onNote: (callback: MidiNoteCallback) => void;
}

export function useMidi(): UseMidiReturn {
  const [supported] = useState(() => isMidiSupported());
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [lastNote, setLastNote] = useState<number | null>(null);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const currentInputRef = useRef<MIDIInput | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const noteCallbackRef = useRef<MidiNoteCallback | null>(null);

  /** 连接 MIDI */
  const connect = useCallback(async () => {
    if (!supported) {
      setError('当前浏览器不支持 Web MIDI API，请使用 Chrome、Edge 或 Opera 浏览器。');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const access = await requestMidiAccess();
      midiAccessRef.current = access;

      const updateDevices = () => {
        const list = getInputDevices(access);
        setDevices(list);

        // 自动选择第一个设备
        if (list.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(list[0].id);
        }
      };

      updateDevices();

      // 监听设备插拔
      access.onstatechange = () => {
        updateDevices();
      };

      setConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '连接 MIDI 设备失败';
      setError(msg);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [supported, selectedDeviceId]);

  /** 注册按键回调 */
  const onNote = useCallback((callback: MidiNoteCallback) => {
    noteCallbackRef.current = callback;
  }, []);

  /** 选择设备并开始监听 */
  const selectDevice = useCallback((id: string) => {
    // 先取消之前的监听
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
    currentInputRef.current = null;

    setSelectedDeviceId(id);

    if (!midiAccessRef.current) return;

    const input = midiAccessRef.current.inputs.get(id);
    if (!input) return;

    currentInputRef.current = input;

    // 监听 MIDI 输入
    const unlisten = listenToMidiInput(input, (note, velocity, isNoteOn) => {
      if (isNoteOn) {
        setLastNote(note);
      }
      // 转发给注册的回调
      noteCallbackRef.current?.(note, velocity, isNoteOn);
    });

    unlistenRef.current = unlisten;
  }, []);

  // 当选中设备变化时，重新绑定监听
  useEffect(() => {
    if (selectedDeviceId && midiAccessRef.current) {
      selectDevice(selectedDeviceId);
    }
    // 清理
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  return {
    supported,
    connected,
    connecting,
    error,
    devices,
    selectedDeviceId,
    lastNote,
    connect,
    selectDevice,
    onNote,
  };
}
