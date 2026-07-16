/**
 * Web MIDI API 封装
 * ============================================
 * 提供 MIDI 设备检测、连接、输入监听等功能。
 * 所有方法均返回 Promise，内部处理浏览器兼容性。
 */

import type { MidiDeviceInfo } from '../types';

/** 检查当前浏览器是否支持 Web MIDI API */
export function isMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}

/** MIDI 消息类型 */
export const MidiMessageType = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
  PITCH_BEND: 0xe0,
} as const;

/**
 * 请求 MIDI 访问权限。
 * @returns MIDIAccess 对象
 */
export async function requestMidiAccess(): Promise<MIDIAccess> {
  if (!isMidiSupported()) {
    throw new Error('当前浏览器不支持 Web MIDI API，请使用 Chrome、Edge 或 Opera 浏览器。');
  }
  return navigator.requestMIDIAccess({ sysex: false });
}

/**
 * 获取所有可用的 MIDI 输入设备列表。
 */
export function getInputDevices(access: MIDIAccess): MidiDeviceInfo[] {
  const devices: MidiDeviceInfo[] = [];
  access.inputs.forEach((input) => {
    devices.push({
      id: input.id,
      name: input.name || '未知设备',
      manufacturer: input.manufacturer || '未知厂商',
      state: input.state,
    });
  });
  return devices;
}

/** MIDI 按键回调函数类型 */
export type MidiNoteCallback = (note: number, velocity: number, isNoteOn: boolean) => void;

/**
 * 监听指定 MIDI 输入设备的按键消息。
 *
 * @param input   MIDIInput 设备
 * @param callback 按键回调
 * @returns 取消监听函数
 */
export function listenToMidiInput(input: MIDIInput, callback: MidiNoteCallback): () => void {
  const handler = (event: MIDIMessageEvent) => {
    if (!event.data || event.data.length < 2) return;

    const status = event.data[0] & 0xf0; // 高 4 位为消息类型
    const note = event.data[1]; // 音高
    const velocity = event.data[2]; // 力度

    if (status === MidiMessageType.NOTE_ON && velocity > 0) {
      callback(note, velocity, true);
    } else if (status === MidiMessageType.NOTE_OFF || (status === MidiMessageType.NOTE_ON && velocity === 0)) {
      callback(note, velocity, false);
    }
  };

  input.onmidimessage = handler;

  // 返回取消监听函数
  return () => {
    input.onmidimessage = null;
  };
}

/**
 * 解析 MIDI 消息，返回可读描述（调试用）。
 */
export function describeMidiMessage(data: Uint8Array): string {
  if (data.length < 2) return '无效 MIDI 消息';
  const status = data[0] & 0xf0;
  const note = data[1];
  const velocity = data[2] || 0;

  switch (status) {
    case MidiMessageType.NOTE_ON:
      return `Note On: ${note}, velocity=${velocity}`;
    case MidiMessageType.NOTE_OFF:
      return `Note Off: ${note}, velocity=${velocity}`;
    case MidiMessageType.CONTROL_CHANGE:
      return `CC: ${note}, value=${velocity}`;
    default:
      return `MIDI: ${Array.from(data).join(', ')}`;
  }
}
