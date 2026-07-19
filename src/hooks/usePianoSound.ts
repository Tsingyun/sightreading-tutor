/**
 * usePianoSound Hook
 * ============================================
 * 基于 smplr 库的 SplendidGrandPiano 采样钢琴。
 *
 * 音源：Splendid Grand Piano — 高质量多力度层采样
 * 功能：
 * - noteOn/noteOff：持续音（自由弹奏模式，按住不放）
 * - playNote：短促音（训练/乐曲模式，按键即响）
 * - enabled 开关，持久化到 localStorage
 * - 加载进度追踪（首次加载需下载采样）
 * - CacheStorage 缓存，PWA 离线可用
 * - 混响效果（轻度，增加空间感）
 * - 加载失败时回退到 Web Audio 振荡器合成
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { loadSoundEnabled, saveSoundEnabled } from '../lib/storage';

// smplr 动态导入类型
type SplendidGrandPianoInstance = {
  start: (opts: { note: string | number; velocity?: number; duration?: number; time?: number }) => () => void;
  stop: (note?: string | number) => void;
  output: { setVolume: (v: number) => void; addEffect: (name: string, effect: unknown, mix: number) => void };
  load: Promise<unknown>;
  loadProgress: { loaded: number; total: number };
};

export interface UsePianoSoundReturn {
  /** 是否启用声音 */
  enabled: boolean;
  /** 切换开关 */
  toggle: () => void;
  /** 按下音符（持续音，需配合 noteOff） */
  noteOn: (midi: number, velocity?: number) => void;
  /** 松开音符（触发释放） */
  noteOff: (midi: number) => void;
  /** 播放短促音符（自动释放，适合训练/乐曲模式） */
  playNote: (midi: number, velocity?: number) => void;
  /** 采样加载状态 */
  loadStatus: 'idle' | 'loading' | 'ready' | 'error' | 'fallback';
  /** 加载进度 0-1 */
  loadProgress: number;
}

/** MIDI 音高 → 音名（smplr 接受的格式） */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

/** MIDI 音高 → 频率（回退模式用） */
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function usePianoSound(): UsePianoSoundReturn {
  const [enabled, setEnabled] = useState(() => loadSoundEnabled());
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'fallback'>('idle');
  const [loadProgress, setLoadProgress] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const pianoRef = useRef<SplendidGrandPianoInstance | null>(null);
  const activeStopsRef = useRef<Map<number, () => void>>(new Map());
  const enabledRef = useRef(enabled);
  const loadStatusRef = useRef(loadStatus);

  // 回退模式：振荡器合成
  const fallbackOscillatorsRef = useRef<Map<number, { osc: OscillatorNode; gain: GainNode }>>(new Map);

  useEffect(() => { enabledRef.current = enabled; saveSoundEnabled(enabled); }, [enabled]);
  useEffect(() => { loadStatusRef.current = loadStatus; }, [loadStatus]);

  /** 确保 AudioContext 可用 */
  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      return audioCtxRef.current;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    return ctx;
  }, []);

  /** 异步初始化采样钢琴 */
  const initPiano = useCallback(async () => {
    if (pianoRef.current || loadStatusRef.current === 'loading') return;

    const ctx = ensureAudioContext();
    if (!ctx) return;

    setLoadStatus('loading');
    setLoadProgress(0);

    try {
      const smplr = await import('smplr');

      // 尝试使用 CacheStorage（PWA 离线支持）
      let storage: unknown = undefined;
      try {
        storage = new smplr.CacheStorage();
      } catch {
        // Cache API 不可用（非 HTTPS），跳过缓存
      }

      const pianoOptions: Record<string, unknown> = {
        volume: 100,
        onLoadProgress: ({ loaded, total }: { loaded: number; total: number }) => {
          setLoadProgress(total > 0 ? loaded / total : 0);
        },
      };
      if (storage) pianoOptions.storage = storage;

      const piano = new smplr.SplendidGrandPiano(ctx, pianoOptions) as SplendidGrandPianoInstance;

      // 添加轻度混响增加空间感
      try {
        const reverb = new smplr.Reverb(ctx);
        piano.output.addEffect('reverb', reverb, 0.15);
      } catch {
        // 混响初始化失败不影响基本功能
      }

      pianoRef.current = piano;

      await piano.load;
      setLoadStatus('ready');
      setLoadProgress(1);
    } catch (err) {
      // 采样加载失败，回退到振荡器合成
      setLoadStatus('fallback');
    }
  }, [ensureAudioContext]);

  /** 回退模式：振荡器合成钢琴 */
  const fallbackNoteOn = useCallback((midi: number, velocity: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // 停止已有的同音
    const existing = fallbackOscillatorsRef.current.get(midi);
    if (existing) {
      try { existing.osc.stop(); } catch { /* noop */ }
      try { existing.gain.disconnect(); } catch { /* noop */ }
    }

    const freq = midiToFreq(midi);
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.005);
    gain.gain.linearRampToValueAtTime(velocity * 0.1, now + 0.1);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // 添加二次谐波
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.3;
    osc2.connect(gain2);
    gain2.connect(gain);

    osc.connect(gain);
    osc.start(now);
    osc2.start(now);

    fallbackOscillatorsRef.current.set(midi, { osc, gain });
  }, []);

  const fallbackNoteOff = useCallback((midi: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const voice = fallbackOscillatorsRef.current.get(midi);
    if (!voice) return;
    const now = ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + 0.4);
    try { voice.osc.stop(now + 0.45); } catch { /* noop */ }
    setTimeout(() => {
      try { voice.gain.disconnect(); } catch { /* noop */ }
      fallbackOscillatorsRef.current.delete(midi);
    }, 500);
  }, []);

  /** noteOn：按下音符 */
  const noteOn = useCallback((midi: number, velocity = 0.7) => {
    if (!enabledRef.current) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    // 首次调用时初始化钢琴
    if (!pianoRef.current && loadStatusRef.current === 'idle') {
      initPiano();
    }

    const midiVelocity = Math.round(velocity * 127);

    if (pianoRef.current && loadStatusRef.current === 'ready') {
      // 停止已有的同音
      const existingStop = activeStopsRef.current.get(midi);
      if (existingStop) existingStop();

      const noteName = midiToNoteName(midi);
      const stopFn = pianoRef.current.start({ note: noteName, velocity: midiVelocity });
      activeStopsRef.current.set(midi, stopFn);
    } else {
      // 回退模式或加载中
      fallbackNoteOn(midi, velocity);
    }
  }, [ensureAudioContext, initPiano, fallbackNoteOn]);

  /** noteOff：松开音符 */
  const noteOff = useCallback((midi: number) => {
    if (!enabledRef.current) return;

    const stopFn = activeStopsRef.current.get(midi);
    if (stopFn) {
      stopFn();
      activeStopsRef.current.delete(midi);
    } else if (fallbackOscillatorsRef.current.has(midi)) {
      fallbackNoteOff(midi);
    }
  }, [fallbackNoteOff]);

  /** playNote：播放短促音符（800ms 后自动停止） */
  const playNote = useCallback((midi: number, velocity = 0.7) => {
    if (!enabledRef.current) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    // 首次调用时初始化钢琴
    if (!pianoRef.current && loadStatusRef.current === 'idle') {
      initPiano();
    }

    const midiVelocity = Math.round(velocity * 127);

    if (pianoRef.current && loadStatusRef.current === 'ready') {
      // 停止已有的同音
      const existingStop = activeStopsRef.current.get(midi);
      if (existingStop) existingStop();

      const noteName = midiToNoteName(midi);
      const stopFn = pianoRef.current.start({
        note: noteName,
        velocity: midiVelocity,
        duration: 0.8,
      });
      activeStopsRef.current.set(midi, stopFn);

      // 800ms 后自动清理
      setTimeout(() => {
        activeStopsRef.current.delete(midi);
      }, 900);
    } else {
      // 回退模式：播放后自动释放
      fallbackNoteOn(midi, velocity);
      setTimeout(() => fallbackNoteOff(midi), 800);
    }
  }, [ensureAudioContext, initPiano, fallbackNoteOn, fallbackNoteOff]);

  /** 切换开关 */
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) {
        // 关闭时停止所有声音
        if (pianoRef.current) {
          pianoRef.current.stop();
        }
        activeStopsRef.current.clear();
        // 停止回退振荡器
        fallbackOscillatorsRef.current.forEach((_voice, midi) => {
          fallbackNoteOff(midi);
        });
      } else {
        // 开启时确保 AudioContext 和钢琴初始化
        ensureAudioContext();
        if (loadStatusRef.current === 'idle') {
          initPiano();
        }
      }
      return next;
    });
  }, [ensureAudioContext, initPiano, fallbackNoteOff]);

  /** 卸载时清理 */
  useEffect(() => {
    return () => {
      activeStopsRef.current.clear();
      fallbackOscillatorsRef.current.forEach((voice) => {
        try { voice.osc.stop(); } catch { /* noop */ }
      });
      fallbackOscillatorsRef.current.clear();
      const ctx = audioCtxRef.current;
      if (ctx) {
        ctx.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  return {
    enabled,
    toggle,
    noteOn,
    noteOff,
    playNote,
    loadStatus,
    loadProgress,
  };
}
