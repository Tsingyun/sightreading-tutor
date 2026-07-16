/**
 * 乐理工具库
 * ============================================
 * 处理 MIDI 音高与音名、VexFlow key 之间的转换，
 * 以及随机音符生成、和弦生成、谱号音域判定等逻辑。
 */

import type { NoteInfo, NoteLetter, AccidentalType, ClefType, ChordInfo, ChordSize, DifficultyLevel, IdentifiedChord } from '../types';

/** 12 个半音对应的音名（升号体系） */
const SHARP_NAMES: NoteLetter[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
const SHARP_ACCIDENTALS: AccidentalType[] = [null, '#', null, '#', null, null, '#', null, '#', null, '#', null];

/** 12 个半音对应的音名（降号体系） */
const FLAT_NAMES: NoteLetter[] = ['C', 'D', 'D', 'E', 'E', 'F', 'G', 'A', 'A', 'B', 'B'];
const FLAT_ACCIDENTALS: AccidentalType[] = [null, 'b', null, 'b', null, null, 'b', null, 'b', null, 'b', null];

/**
 * 将 MIDI 音高编号转换为 NoteInfo 对象。
 *
 * @param midi MIDI 音高编号 (0-127)，60 = C4 (Middle C)
 * @param preferFlat 是否优先使用降号命名（默认升号）
 */
export function midiToNoteInfo(midi: number, preferFlat = false): NoteInfo {
  const pitchClass = ((midi % 12) + 12) % 12; // 0-11
  const octave = Math.floor(midi / 12) - 1; // MIDI 60 = C4 => octave 4

  const names = preferFlat ? FLAT_NAMES : SHARP_NAMES;
  const accidentals = preferFlat ? FLAT_ACCIDENTALS : SHARP_ACCIDENTALS;

  const letter = names[pitchClass];
  const accidental = accidentals[pitchClass];

  // 构建显示名
  const accidentalSymbol = accidental === '#' ? '♯' : accidental === 'b' ? '♭' : '';
  const name = `${letter}${accidentalSymbol}`;

  // 构建 VexFlow key（小写 + 斜杠 + 八度）
  const vexAccidental = accidental ?? '';
  const vexKey = `${letter.toLowerCase()}${vexAccidental}/${octave}`;

  return {
    midi,
    name,
    letter,
    accidental,
    octave,
    vexKey,
    clef: getClefForMidi(midi),
  };
}

/**
 * 根据 MIDI 音高判断更适合哪个谱号。
 * 高音谱号通常覆盖 G3(55) 以上，低音谱号覆盖 E3(52) 以下。
 * 中间区域根据上下文决定，这里以 C4(60) 为分界。
 */
export function getClefForMidi(midi: number): 'treble' | 'bass' {
  // C4 = 60 为分界线，C4 及以上用高音谱号
  // 但低音谱号也可表示到 A4 左右，这里取 G3(55) 作为低音谱号上限
  if (midi >= 60) return 'treble';
  return 'bass';
}

/**
 * 获取音名（不含八度），用于 UI 显示。
 */
export function midiToNoteName(midi: number, preferFlat = false): string {
  return midiToNoteInfo(midi, preferFlat).name;
}

/**
 * 生成随机音符，确保分布均匀且不连续重复。
 *
 * @param range     MIDI 音高范围 [low, high]（含两端）
 * @param includeAccidentals 是否包含带升降号的音
 * @param lastMidi  上一个音符的 MIDI（避免重复），可选
 * @returns 新的 MIDI 音高编号
 */
export function generateRandomNote(
  range: { low: number; high: number },
  includeAccidentals: boolean,
  lastMidi: number | null,
): number {
  // 构建候选列表
  const candidates: number[] = [];
  for (let midi = range.low; midi <= range.high; midi++) {
    const info = midiToNoteInfo(midi);
    if (!includeAccidentals && info.accidental !== null) continue;
    candidates.push(midi);
  }

  if (candidates.length === 0) return range.low;

  // 过滤掉与上一个相同的音（如果候选数 > 1）
  let pool = candidates;
  if (lastMidi !== null && candidates.length > 1) {
    pool = candidates.filter((m) => m !== lastMidi);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================
// 和弦定义与生成
// ============================================

/** 和弦类型定义 */
interface ChordTypeDef {
  /** 和弦类型标识 */
  id: string;
  /** 中文名称 */
  name: string;
  /** 音程间隔（半音数），从根音开始 */
  intervals: number[];
}

/** 2 音符（音程）类型 */
const INTERVAL_TYPES: ChordTypeDef[] = [
  { id: 'maj3', name: '大三度', intervals: [0, 4] },
  { id: 'min3', name: '小三度', intervals: [0, 3] },
  { id: 'p5', name: '纯五度', intervals: [0, 7] },
  { id: 'p4', name: '纯四度', intervals: [0, 5] },
  { id: 'maj6', name: '大六度', intervals: [0, 9] },
  { id: 'oct', name: '纯八度', intervals: [0, 12] },
];

/** 3 音符（三和弦）类型 */
const TRIAD_TYPES: ChordTypeDef[] = [
  { id: 'major', name: '大三和弦', intervals: [0, 4, 7] },
  { id: 'minor', name: '小三和弦', intervals: [0, 3, 7] },
  { id: 'dim', name: '减三和弦', intervals: [0, 3, 6] },
  { id: 'aug', name: '增三和弦', intervals: [0, 4, 8] },
];

/** 4 音符（七和弦）类型 */
const SEVENTH_TYPES: ChordTypeDef[] = [
  { id: 'dom7', name: '属七和弦', intervals: [0, 4, 7, 10] },
  { id: 'maj7', name: '大七和弦', intervals: [0, 4, 7, 11] },
  { id: 'min7', name: '小七和弦', intervals: [0, 3, 7, 10] },
  { id: 'm7b5', name: '半减七和弦', intervals: [0, 3, 6, 10] },
];

/** 根据 ChordSize 获取对应的和弦类型列表 */
function getChordTypes(size: ChordSize): ChordTypeDef[] {
  switch (size) {
    case 2: return INTERVAL_TYPES;
    case 3: return TRIAD_TYPES;
    case 4: return SEVENTH_TYPES;
    default: return TRIAD_TYPES;
  }
}

/**
 * 生成随机和弦。
 * 确保和弦的所有音符都在指定音域范围内。
 *
 * @param range     MIDI 音高范围 [low, high]（含两端）
 * @param size      和弦音符数量
 * @param lastRoot  上一个和弦根音的 MIDI（避免重复），可选
 * @returns ChordInfo 对象，包含音符数组、和弦名称等
 */
export function generateRandomChord(
  range: { low: number; high: number },
  size: ChordSize,
  lastRoot: number | null,
): ChordInfo {
  const chordTypes = getChordTypes(size);

  // 收集所有可行的（根音, 和弦类型）组合
  const candidates: { rootMidi: number; chordType: ChordTypeDef }[] = [];

  for (let rootMidi = range.low; rootMidi <= range.high; rootMidi++) {
    for (const chordType of chordTypes) {
      // 检查所有和弦音是否在范围内
      const allInRange = chordType.intervals.every(
        (interval) => rootMidi + interval >= range.low && rootMidi + interval <= range.high,
      );
      if (allInRange) {
        candidates.push({ rootMidi, chordType });
      }
    }
  }

  if (candidates.length === 0) {
    // 兜底：使用最低音作为根音的第一个和弦类型
    const fallbackType = chordTypes[0];
    const rootMidi = range.low;
    const notes = fallbackType.intervals.map((interval) => {
      const note = midiToNoteInfo(rootMidi + interval);
      return note;
    });
    const rootInfo = midiToNoteInfo(rootMidi);
    return {
      notes,
      name: `${rootInfo.name}${fallbackType.name}`,
      root: rootInfo,
      type: fallbackType.id,
    };
  }

  // 过滤掉与上一个根音相同的（如果候选数 > 1）
  let pool = candidates;
  if (lastRoot !== null && candidates.length > 1) {
    const filtered = candidates.filter((c) => c.rootMidi !== lastRoot);
    if (filtered.length > 0) pool = filtered;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const rootInfo = midiToNoteInfo(chosen.rootMidi);

  // 构建和弦音符（升序排列）
  const notes = chosen.chordType.intervals.map((interval) =>
    midiToNoteInfo(chosen.rootMidi + interval),
  );

  return {
    notes,
    name: `${rootInfo.name}${chosen.chordType.name}`,
    root: rootInfo,
    type: chosen.chordType.id,
  };
}

/**
 * 默认训练音域配置。
 * 高音谱号：C4(60) ~ A5(81)
 * 低音谱号：E2(40) ~ C4(60)
 * 双谱表：E2(40) ~ A5(81)
 */
export const DEFAULT_RANGES: Record<ClefType, { low: number; high: number }> = {
  treble: { low: 60, high: 81 },
  bass: { low: 40, high: 60 },
  both: { low: 40, high: 81 },
};

/** 音域预设选项（供设置面板使用） */
export const RANGE_PRESETS: { label: string; clef: ClefType; low: number; high: number }[] = [
  { label: '高音谱号 C4 ~ A5', clef: 'treble', low: 60, high: 81 },
  { label: '高音谱号 C4 ~ C6', clef: 'treble', low: 60, high: 84 },
  { label: '高音谱号 G3 ~ G5', clef: 'treble', low: 55, high: 79 },
  { label: '低音谱号 E2 ~ C4', clef: 'bass', low: 40, high: 60 },
  { label: '低音谱号 C2 ~ G3', clef: 'bass', low: 36, high: 55 },
  { label: '低音谱号 E2 ~ E4', clef: 'bass', low: 40, high: 64 },
  { label: '双谱表 E2 ~ A5', clef: 'both', low: 40, high: 81 },
  { label: '双谱表 C3 ~ C5', clef: 'both', low: 48, high: 72 },
];

/**
 * 将 MIDI 音高转换为可读的显示文本。
 * 如 60 -> "C4"
 */
export function midiToDisplayString(midi: number, preferFlat = false): string {
  const info = midiToNoteInfo(midi, preferFlat);
  return `${info.name}${info.octave}`;
}

// ============================================
// 难度等级系统
// ============================================

/** 难度等级配置 */
export interface DifficultyLevelConfig {
  level: DifficultyLevel;
  name: string;
  desc: string;
  clef: ClefType;
  lowNote: number;
  highNote: number;
  includeAccidentals: boolean;
}

/** 5 个难度等级定义（渐进式学习） */
export const DIFFICULTY_LEVELS: DifficultyLevelConfig[] = [
  {
    level: 1,
    name: '入门',
    desc: 'C D E F G 五个音',
    clef: 'treble',
    lowNote: 60,
    highNote: 67,
    includeAccidentals: false,
  },
  {
    level: 2,
    name: '基础',
    desc: 'C D E F G A B 七个音',
    clef: 'treble',
    lowNote: 60,
    highNote: 71,
    includeAccidentals: false,
  },
  {
    level: 3,
    name: '进阶',
    desc: 'C4 ~ A5 全音域',
    clef: 'treble',
    lowNote: 60,
    highNote: 81,
    includeAccidentals: false,
  },
  {
    level: 4,
    name: '高级',
    desc: '含升降号 ♯ ♭',
    clef: 'treble',
    lowNote: 60,
    highNote: 81,
    includeAccidentals: true,
  },
  {
    level: 5,
    name: '大师',
    desc: '高低音双谱表 + 升降号',
    clef: 'both',
    lowNote: 40,
    highNote: 81,
    includeAccidentals: true,
  },
];

/** 根据难度等级获取配置 */
export function getDifficultyConfig(level: DifficultyLevel): DifficultyLevelConfig {
  return DIFFICULTY_LEVELS.find((l) => l.level === level) ?? DIFFICULTY_LEVELS[0];
}

// ============================================
// 渐进式提示系统
// ============================================

/**
 * 计算音符在五线谱上的线/间位置。
 * 返回如 "第2线"、"第1间"、"下加一线" 等。
 *
 * 五线谱从下往上数：第1线、第1间、第2线、第2间、...、第5线
 * 高音谱号：第2线 = G4，第1间 = F4，第1线 = E4，下加一间 = D4，下加一线 = C4
 * 低音谱号：第4线 = F3，第3间 = E3，第3线 = D3，...
 */
export function getStaffPosition(note: NoteInfo): string {
  const midi = note.midi;
  const clef = note.clef;

  // 高音谱号参考：E4(64) = 第1线
  // 线间从下往上：下加一线(C4=60), 下加一间(D4=62), 第1线(E4=64), 第1间(F4=65),
  //   第2线(G4=67), 第2间(A4=69), 第3线(B4=71), 第3间(C5=72),
  //   第4线(D5=74), 第4间(E5=76), 第5线(F5=77), 第5间(G5=79), 上加一线(A5=81)
  if (clef === 'treble') {
    const positions: Record<number, string> = {
      60: '下加一线', 61: '下加一线（升号）',
      62: '下加一间', 63: '下加一间（升号）',
      64: '第1线', 65: '第1间',
      66: '第1线（升号）',
      67: '第2线', 68: '第2线（升号）',
      69: '第2间', 70: '第2间（升号）',
      71: '第3线', 72: '第3间', 73: '第3间（升号）',
      74: '第4线', 75: '第4线（升号）',
      76: '第4间', 77: '第5线', 78: '第5线（升号）',
      79: '第5间', 80: '第5间（升号）',
      81: '上加一线', 82: '上加一间', 83: '上加一间（升号）',
      84: '上加二线',
    };
    return positions[midi] ?? `MIDI ${midi}`;
  }

  // 低音谱号参考：G2(43) = 第1线
  // 线间从下往上：下加二线(C2=36), 下加二间(D2=38), 下加一线(E2=40), 下加一间(F2=41),
  //   第1线(G2=43), 第1间(A2=45), 第2线(B2=47), 第2间(C3=48),
  //   第3线(D3=50), 第3间(E3=52), 第4线(F3=53), 第4间(G3=55),
  //   第5线(A3=57), 第5间(B3=59), 上加一线(C4=60)
  const positions: Record<number, string> = {
    36: '下加二线', 37: '下加二线（升号）',
    38: '下加二间', 39: '下加二间（升号）',
    40: '下加一线', 41: '下加一间',
    42: '下加一线（升号）',
    43: '第1线', 44: '第1线（升号）',
    45: '第1间', 46: '第1间（升号）',
    47: '第2线', 48: '第2间', 49: '第2间（升号）',
    50: '第3线', 51: '第3线（升号）',
    52: '第3间', 53: '第4线', 54: '第4线（升号）',
    55: '第4间', 56: '第4间（升号）',
    57: '第5线', 58: '第5线（升号）',
    59: '第5间', 60: '上加一线', 61: '上加一线（升号）',
    62: '上加一间', 63: '上加一间（升号）',
    64: '上加二线',
  };
  return positions[midi] ?? `MIDI ${midi}`;
}

/**
 * 生成渐进式提示文本。
 *
 * @param note 当前音符
 * @param level 提示等级（1=位置, 2=音名字母, 3=完整答案）
 */
export function getNoteHint(note: NoteInfo, level: number): string {
  switch (level) {
    case 1: {
      // 第一级：告诉用户这个音在五线谱的哪个位置
      const pos = getStaffPosition(note);
      const clefName = note.clef === 'treble' ? '高音谱号' : '低音谱号';
      return `💡 第1级提示：这个音在${clefName}的 ${pos} 上`;
    }
    case 2: {
      // 第二级：给出音名字母（不含八度）
      const pos = getStaffPosition(note);
      return `💡 第2级提示：在 ${pos} 上，音名以字母 "${note.letter}" 开头`;
    }
    case 3: {
      // 第三级：完整答案
      const fullName = `${note.name}${note.octave}`;
      return `💡 完整答案：${fullName}（在 ${getStaffPosition(note)} 上）`;
    }
    default:
      return '';
  }
}

// ============================================
// 和弦识别（自由弹奏模式）
// ============================================

/** 和弦识别用模式定义（按优先级排序，更具体的先匹配） */
const CHORD_PATTERNS: { type: string; name: string; intervals: number[] }[] = [
  // 七和弦（4 音符）
  { type: 'dim7', name: '减七和弦', intervals: [0, 3, 6, 9] },
  { type: 'm7b5', name: '半减七和弦', intervals: [0, 3, 6, 10] },
  { type: 'dom7', name: '属七和弦', intervals: [0, 4, 7, 10] },
  { type: 'maj7', name: '大七和弦', intervals: [0, 4, 7, 11] },
  { type: 'min7', name: '小七和弦', intervals: [0, 3, 7, 10] },
  { type: 'minMaj7', name: '小大七和弦', intervals: [0, 3, 7, 11] },
  { type: 'augMaj7', name: '增大七和弦', intervals: [0, 4, 8, 11] },
  { type: 'aug7', name: '增七和弦', intervals: [0, 4, 8, 10] },
  // 三和弦（3 音符）
  { type: 'major', name: '大三和弦', intervals: [0, 4, 7] },
  { type: 'minor', name: '小三和弦', intervals: [0, 3, 7] },
  { type: 'dim', name: '减三和弦', intervals: [0, 3, 6] },
  { type: 'aug', name: '增三和弦', intervals: [0, 4, 8] },
  { type: 'sus4', name: '挂四和弦', intervals: [0, 5, 7] },
  { type: 'sus2', name: '挂二和弦', intervals: [0, 2, 7] },
];

/** 音程名称映射（2 音符时使用） */
const INTERVAL_NAMES: Record<number, string> = {
  1: '小二度', 2: '大二度', 3: '小三度', 4: '大三度',
  5: '纯四度', 6: '增四度（三全音）', 7: '纯五度', 8: '小六度',
  9: '大六度', 10: '小七度', 11: '大七度',
};

/**
 * 识别当前按下的音符组成的和弦或音程。
 *
 * 支持识别：
 * - 单音：返回音名
 * - 2 音符：音程（大三度、纯五度等）
 * - 3 音符：三和弦（大、小、减、增、挂二、挂四）+ 转位
 * - 4 音符：七和弦（属七、大七、小七等）+ 转位
 * - 5+ 音符：尝试匹配扩展和弦，无法识别则列出所有音名
 *
 * 转位判定基于最低音（贝斯音）在和弦中的音级位置：
 * - 根音在最低 → 原位
 * - 三音在最低 → 第一转位
 * - 五音在最低 → 第二转位
 * - 七音在最低 → 第三转位
 *
 * @param midiNotes 当前按下的 MIDI 音高数组
 * @returns 识别结果，若无音符返回 null
 */
export function identifyChord(midiNotes: number[]): IdentifiedChord | null {
  if (midiNotes.length === 0) return null;

  // 去重并按音高排序
  const sorted = [...new Set(midiNotes)].sort((a, b) => a - b);
  const notes = sorted.map((m) => midiToNoteInfo(m));

  // 提取唯一音级（pitch class，0-11）
  const pitchClasses = [...new Set(sorted.map((m) => ((m % 12) + 12) % 12))];

  // —— 单音 ——
  if (pitchClasses.length === 1) {
    return {
      notes,
      root: notes[0],
      chordName: notes[0].name,
      chordTypeName: '',
      chordType: 'single',
      inversion: 0,
      inversionName: '',
      bassNote: notes[0],
      intervalName: '',
    };
  }

  // —— 2 音符：音程 ——
  if (pitchClasses.length === 2) {
    const lowPc = pitchClasses[0];
    const highPc = pitchClasses[1];
    const interval = (highPc - lowPc + 12) % 12;
    const intervalName = INTERVAL_NAMES[interval] ?? `${interval} 个半音`;

    return {
      notes,
      root: notes[0],
      chordName: `${notes[0].name}–${notes[1].name} ${intervalName}`,
      chordTypeName: intervalName,
      chordType: 'interval',
      inversion: 0,
      inversionName: '',
      bassNote: notes[0],
      intervalName,
    };
  }

  // —— 3+ 音符：和弦识别 ——
  const bassPc = ((sorted[0] % 12) + 12) % 12;

  // 遍历每个音级作为候选根音
  for (const rootPc of pitchClasses) {
    // 计算从候选根音到其他所有音级的半音间隔
    const intervalsFromRoot = pitchClasses
      .filter((pc) => pc !== rootPc)
      .map((pc) => ((pc - rootPc) % 12 + 12) % 12)
      .sort((a, b) => a - b);

    const allIntervals = [0, ...intervalsFromRoot];

    // 尝试匹配和弦模式
    for (const pattern of CHORD_PATTERNS) {
      if (allIntervals.length !== pattern.intervals.length) continue;

      const matches = pattern.intervals.every(
        (interval, i) => interval === allIntervals[i],
      );
      if (!matches) continue;

      // 匹配成功！找到根音对应的 NoteInfo
      const rootMidi = sorted.find(
        (m) => ((m % 12) + 12) % 12 === rootPc,
      )!;
      const rootNote = midiToNoteInfo(rootMidi);

      // 判定转位：最低音在和弦中的哪个音级
      const bassInterval = ((bassPc - rootPc) % 12 + 12) % 12;
      const inversionIndex = pattern.intervals.indexOf(bassInterval);

      let inversion = 0;
      let inversionName = '原位';

      if (inversionIndex === 0) {
        inversion = 0;
        inversionName = '原位';
      } else if (inversionIndex === 1) {
        inversion = 1;
        inversionName = '第一转位';
      } else if (inversionIndex === 2) {
        inversion = 2;
        inversionName = '第二转位';
      } else if (inversionIndex === 3) {
        inversion = 3;
        inversionName = '第三转位';
      } else {
        // 低音不在和弦音级中（可能是八度重复等）
        inversion = 0;
        inversionName = '原位';
      }

      // 构建和弦名称
      const baseName = `${rootNote.name}${pattern.name}`;
      const fullChordName =
        inversion > 0 ? `${baseName}（${inversionName}）` : baseName;

      return {
        notes,
        root: rootNote,
        chordName: fullChordName,
        chordTypeName: pattern.name,
        chordType: pattern.type,
        inversion,
        inversionName,
        bassNote: notes[0],
        intervalName: '',
      };
    }
  }

  // —— 无法识别：列出所有音名 ——
  return {
    notes,
    root: null,
    chordName: notes.map((n) => n.name).join(' · '),
    chordTypeName: '',
    chordType: 'unknown',
    inversion: 0,
    inversionName: '',
    bassNote: notes[0],
    intervalName: '',
  };
}
