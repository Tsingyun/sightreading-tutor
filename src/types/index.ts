/**
 * 全局类型定义
 * ============================================ */

/** 谱号类型：高音谱号 / 低音谱号 / 双谱表 */
export type ClefType = 'treble' | 'bass' | 'both';

/** 调号类型 */
export type KeySignature = 'C' | 'G' | 'D' | 'A' | 'E' | 'F' | 'Bb' | 'Eb' | 'Ab';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark';

/** 音名（不含升降号） */
export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** 升降号类型 */
export type AccidentalType = '#' | 'b' | 'n' | null;

/** 答案状态 */
export type AnswerState = 'idle' | 'pending' | 'correct' | 'wrong' | 'revealed';

/** 训练模式：单音 / 和弦 */
export type TrainingMode = 'single' | 'chord';

/** 和弦音符数量：2（音程）/ 3（三和弦）/ 4（七和弦） */
export type ChordSize = 2 | 3 | 4;

/** 难度等级（渐进式学习） */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** 一个音符的完整描述 */
export interface NoteInfo {
  /** MIDI 音高编号 (0-127)，如 60 = C4 */
  midi: number;
  /** 完整音名，含升降号，如 "C", "C♯", "D♭" */
  name: string;
  /** 音名字母 */
  letter: NoteLetter;
  /** 升降号 */
  accidental: AccidentalType;
  /** 八度 */
  octave: number;
  /** VexFlow 格式的 key，如 "c/4", "c#/4" */
  vexKey: string;
  /** 适用于哪个谱号（双谱表训练时用于决定渲染在哪个谱表） */
  clef: 'treble' | 'bass';
}

/** 和弦信息 */
export interface ChordInfo {
  /** 和弦包含的音符（按音高升序排列） */
  notes: NoteInfo[];
  /** 和弦名称，如 "C大三和弦", "A小七和弦" */
  name: string;
  /** 根音 */
  root: NoteInfo;
  /** 和弦类型标识，如 "major", "minor", "dom7" */
  type: string;
}

/** 训练配置 */
export interface TrainingConfig {
  /** 谱号模式 */
  clef: ClefType;
  /** 最低 MIDI 音高 */
  lowNote: number;
  /** 最高 MIDI 音高 */
  highNote: number;
  /** 是否包含升降号 */
  includeAccidentals: boolean;
  /** 答错后是否自动进入下一题（false = 需要手动继续/查看答案） */
  autoNextOnError: boolean;
  /** 训练模式：单音 / 和弦 */
  mode: TrainingMode;
  /** 和弦音符数量（仅 mode='chord' 时生效） */
  chordSize: ChordSize;
  /** 难度等级（渐进式学习，1-5） */
  difficultyLevel: DifficultyLevel;
  /** 是否显示音名提示（学习模式，在五线谱上标注音名） */
  showNoteLabel: boolean;
  /** 调号（'C' = 无升降号，'G' = 1个升号，等） */
  keySignature: KeySignature;
}

/** 训练统计数据 */
export interface TrainingStats {
  /** 正确数 */
  correct: number;
  /** 总题数 */
  total: number;
  /** 当前连击数 */
  streak: number;
  /** 历史最高连击 */
  bestStreak: number;
  /** 反应时间总和（毫秒） */
  totalReactionTime: number;
  /** 反应次数（用于计算平均） */
  reactionCount: number;
}

/** MIDI 输入设备信息 */
export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

/** 一次答题记录（用于详细统计或回放） */
export interface AnswerRecord {
  note: NoteInfo;
  pressedMidi: number;
  correct: boolean;
  reactionTime: number;
  timestamp: number;
}

/** 应用模式：识谱训练 / 自由弹奏 / 节奏训练 / 乐曲练习 / 音阶流动 */
export type AppMode = 'training' | 'freeplay' | 'rhythm' | 'song' | 'scales';

/** 识别出的和弦信息（自由弹奏模式） */
export interface IdentifiedChord {
  /** 所有按下的音符（按音高升序） */
  notes: NoteInfo[];
  /** 根音 */
  root: NoteInfo | null;
  /** 和弦完整名称（含转位，如"C大三和弦（第一转位）"） */
  chordName: string;
  /** 和弦类型名称（如"大三和弦"、"属七和弦"） */
  chordTypeName: string;
  /** 和弦类型标识（如"major"、"dom7"） */
  chordType: string;
  /** 转位编号（0=原位, 1=第一转位, 2=第二转位, 3=第三转位） */
  inversion: number;
  /** 转位名称（"原位"、"第一转位"等，单音/音程时为空） */
  inversionName: string;
  /** 最低音（贝斯音） */
  bassNote: NoteInfo | null;
  /** 音程名称（仅2音符时有效，如"大三度"） */
  intervalName: string;
}

// ============================================
// Nocturne — 新增类型
// ============================================

/** 屏幕状态：Hub 门户 → Arena 练习 → Review 总结 */
export type Screen = 'hub' | 'arena' | 'review';

/** 会话统计数据（用于 Review 屏幕） */
export interface SessionStats {
  mode: AppMode;
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
  avgReactionTime: number;
  duration: number;
}

/** Toast 通知项 */
export interface ToastItem {
  id: string;
  variant: 'gold' | 'sage';
  icon: string;
  title: string;
  message: string;
}
