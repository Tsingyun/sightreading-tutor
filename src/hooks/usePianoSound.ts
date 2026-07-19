/**
 * usePianoSound Hook
 * ============================================
 * 基于 Web Audio API 的钢琴音色合成器。
 *
 * 功能：
 * - noteOn/noteOff：持续音（自由弹奏模式，按住不放）
 * - playNote：短促音（训练/乐曲模式，按键即响）
 * - enabled 开关，持久化到 localStorage
 * - 多振荡器叠加（基频 + 谐波）模拟钢琴音色
 * - ADSR 包络：Attack 5ms → Decay 100ms → Sustain 0.25 → Release 400ms
 *
 * 性能：
 * - AudioContext 延迟初始化（首次发声时创建）
 * - 每个音符独立振荡器组，noteOff 时触发释放后自动清理
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { loadSoundEnabled, saveSoundEnabled } from '../lib/storage';

/** MIDI 音高 → 频率（Hz） */
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 单个活跃音符的音频节点引用 */
interface ActiveVoice {
  oscillators: OscillatorNode[];
  gainNode: GainNode;
  releaseTime: number;
}

const ATTACK_TIME = 0.005;   // 5ms 起音
const DECAY_TIME = 0.1;      // 100ms 衰减
const SUSTAIN_LEVEL = 0.25;  // 保持音量
const RELEASE_TIME = 0.4;    // 400ms 释放

export interface UsePianoSoundReturn {
  /** 是否启用声音 */
  enabled: boolean;
  /** 切换开关 */
  toggle: () => void;
  /** 按下音符（持续音，需配合 noteOff） */
  noteOn: (midi: number, velocity?: number) => void;
  /** 松开音符（触发释放包络） */
  noteOff: (midi: number) => void;
  /** 播放短促音符（自动释放，适合训练/乐曲模式） */
  playNote: (midi: number, velocity?: number) => void;
}

export function usePianoSound(): UsePianoSoundReturn {
  const [enabled, setEnabled] = useState(() => loadSoundEnabled());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeVoicesRef = useRef<Map<number, ActiveVoice>>(new Map());
  const enabledRef = useRef(enabled);

  // 同步 ref
  useEffect(() => {
    enabledRef.current = enabled;
    saveSoundEnabled(enabled);
  }, [enabled]);

  /** 延迟初始化 AudioContext（必须在用户交互后） */
  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      // 浏览器可能挂起 context（如自动播放策略），恢复它
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;
    return ctx;
  }, []);

  /** 创建一个音符的振荡器组（基频 + 2 个谐波） */
  const createVoice = useCallback((ctx: AudioContext, midi: number, velocity: number, destination: AudioNode): ActiveVoice => {
    const freq = midiToFreq(midi);
    const now = ctx.currentTime;

    // 主增益节点（ADSR 包络）
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity, now + ATTACK_TIME);        // Attack
    gainNode.gain.linearRampToValueAtTime(velocity * SUSTAIN_LEVEL, now + ATTACK_TIME + DECAY_TIME); // Decay → Sustain
    gainNode.connect(destination);

    // 3 个振荡器叠加：基频（正弦）+ 二次谐波（三角）+ 三次谐波（正弦）
    const oscillators: OscillatorNode[] = [];

    // 基频 — 正弦波，最大音量
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    const gain1 = ctx.createGain();
    gain1.gain.value = 0.6;
    osc1.connect(gain1);
    gain1.connect(gainNode);
    osc1.start(now);
    oscillators.push(osc1);

    // 二次谐波 — 三角波，中等音量
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.25;
    osc2.connect(gain2);
    gain2.connect(gainNode);
    osc2.start(now);
    oscillators.push(osc2);

    // 三次谐波 — 正弦波，小音量
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = freq * 3;
    const gain3 = ctx.createGain();
    gain3.gain.value = 0.1;
    osc3.connect(gain3);
    gain3.connect(gainNode);
    osc3.start(now);
    oscillators.push(osc3);

    return { oscillators, gainNode, releaseTime: 0 };
  }, []);

  /** noteOn：按下音符 */
  const noteOn = useCallback((midi: number, velocity = 0.7) => {
    if (!enabledRef.current) return;
    const ctx = ensureAudioContext();
    if (!ctx || !masterGainRef.current) return;

    // 如果该音已在响，先释放旧的
    const existing = activeVoicesRef.current.get(midi);
    if (existing) {
      cleanupVoice(ctx, midi, existing, 0);
    }

    const voice = createVoice(ctx, midi, velocity, masterGainRef.current);
    activeVoicesRef.current.set(midi, voice);
  }, [ensureAudioContext, createVoice]);

  /** noteOff：松开音符，触发释放包络 */
  const noteOff = useCallback((midi: number) => {
    if (!enabledRef.current) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const voice = activeVoicesRef.current.get(midi);
    if (!voice) return;
    cleanupVoice(ctx, midi, voice, RELEASE_TIME);
  }, []);

  /** playNote：播放短促音符（800ms 后自动释放） */
  const playNote = useCallback((midi: number, velocity = 0.7) => {
    if (!enabledRef.current) return;
    const ctx = ensureAudioContext();
    if (!ctx || !masterGainRef.current) return;

    // 如果该音已在响，先清理
    const existing = activeVoicesRef.current.get(midi);
    if (existing) {
      cleanupVoice(ctx, midi, existing, 0);
    }

    const voice = createVoice(ctx, midi, velocity, masterGainRef.current);
    activeVoicesRef.current.set(midi, voice);

    // 800ms 后自动释放
    setTimeout(() => {
      const currentCtx = audioCtxRef.current;
      if (!currentCtx) return;
      const v = activeVoicesRef.current.get(midi);
      if (v === voice) {
        cleanupVoice(currentCtx, midi, v, RELEASE_TIME);
      }
    }, 800);
  }, [ensureAudioContext, createVoice]);

  /** 内部：清理某个音符的音频节点 */
  const cleanupVoice = (ctx: AudioContext, midi: number, voice: ActiveVoice, releaseDuration: number) => {
    const now = ctx.currentTime;
    const releaseEnd = now + releaseDuration;

    // 触发释放包络
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.linearRampToValueAtTime(0, releaseEnd);

    // 释放结束后停止振荡器并断开
    voice.oscillators.forEach((osc) => {
      try {
        osc.stop(releaseEnd + 0.05);
        osc.onended = () => {
          try { osc.disconnect(); } catch { /* already disconnected */ }
        };
      } catch {
        // 振荡器可能已停止
      }
    });

    // 延迟断开增益节点和从 Map 中移除
    setTimeout(() => {
      try { voice.gainNode.disconnect(); } catch { /* noop */ }
      const current = activeVoicesRef.current.get(midi);
      if (current === voice) {
        activeVoicesRef.current.delete(midi);
      }
    }, (releaseDuration + 0.1) * 1000);
  };

  /** 切换开关 */
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) {
        // 关闭时立即停止所有声音
        const ctx = audioCtxRef.current;
        if (ctx) {
          activeVoicesRef.current.forEach((voice, midi) => {
            cleanupVoice(ctx, midi, voice, 0.05);
          });
        }
      } else {
        // 开启时确保 AudioContext 可用
        ensureAudioContext();
      }
      return next;
    });
  }, [ensureAudioContext]);

  /** 卸载时清理所有音频资源 */
  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current;
      if (ctx) {
        activeVoicesRef.current.forEach((voice) => {
          voice.oscillators.forEach((osc) => {
            try { osc.stop(); } catch { /* noop */ }
          });
        });
        activeVoicesRef.current.clear();
        ctx.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  return { enabled, toggle, noteOn, noteOff, playNote };
}
