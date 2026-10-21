/**
 * 内置乐曲库
 * ============================================
 * 预置经典旋律，以 NoteStep 数组编码。
 * duration 单位为拍（1=四分音符, 0.5=八分, 2=二分, 4=全音）
 */

export interface SongNote {
  midi: number;
  duration: number;
  isRest?: boolean;
}

export interface PresetSong {
  id: string;
  name: string;
  nameEn: string;
  composer: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  bpm: number;
  notes: SongNote[];
}

// 音符常量
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69;
const C5 = 72, D5 = 74;
const B3 = 59, B4 = 71;

const N = (midi: number, duration: number): SongNote => ({ midi, duration });

export const SONG_LIBRARY: PresetSong[] = [
  {
    id: 'ode-to-joy',
    name: '欢乐颂',
    nameEn: 'Ode to Joy',
    composer: '贝多芬',
    difficulty: 1,
    bpm: 100,
    notes: [
      N(E4, 1), N(E4, 1), N(F4, 1), N(G4, 1),
      N(G4, 1), N(F4, 1), N(E4, 1), N(D4, 1),
      N(C4, 1), N(C4, 1), N(D4, 1), N(E4, 1),
      N(E4, 1.5), N(D4, 0.5), N(D4, 2),
      N(E4, 1), N(E4, 1), N(F4, 1), N(G4, 1),
      N(G4, 1), N(F4, 1), N(E4, 1), N(D4, 1),
      N(C4, 1), N(C4, 1), N(D4, 1), N(E4, 1),
      N(D4, 1.5), N(C4, 0.5), N(C4, 2),
    ],
  },
  {
    id: 'twinkle',
    name: '小星星',
    nameEn: 'Twinkle Twinkle Little Star',
    composer: '传统民谣',
    difficulty: 1,
    bpm: 90,
    notes: [
      N(C4, 1), N(C4, 1), N(G4, 1), N(G4, 1),
      N(A4, 1), N(A4, 1), N(G4, 2),
      N(F4, 1), N(F4, 1), N(E4, 1), N(E4, 1),
      N(D4, 1), N(D4, 1), N(C4, 2),
      N(G4, 1), N(G4, 1), N(F4, 1), N(F4, 1),
      N(E4, 1), N(E4, 1), N(D4, 2),
      N(G4, 1), N(G4, 1), N(F4, 1), N(F4, 1),
      N(E4, 1), N(E4, 1), N(D4, 2),
      N(C4, 1), N(C4, 1), N(G4, 1), N(G4, 1),
      N(A4, 1), N(A4, 1), N(G4, 2),
      N(F4, 1), N(F4, 1), N(E4, 1), N(E4, 1),
      N(D4, 1), N(D4, 1), N(C4, 2),
    ],
  },
  {
    id: 'mary-lamb',
    name: '玛丽有只小羊羔',
    nameEn: 'Mary Had a Little Lamb',
    composer: '传统民谣',
    difficulty: 1,
    bpm: 90,
    notes: [
      N(E4, 1), N(D4, 1), N(C4, 1), N(D4, 1),
      N(E4, 1), N(E4, 1), N(E4, 2),
      N(D4, 1), N(D4, 1), N(D4, 2),
      N(E4, 1), N(G4, 1), N(G4, 2),
      N(E4, 1), N(D4, 1), N(C4, 1), N(D4, 1),
      N(E4, 1), N(E4, 1), N(E4, 1), N(E4, 1),
      N(D4, 1), N(D4, 1), N(E4, 1), N(D4, 1),
      N(C4, 4),
    ],
  },
  {
    id: 'for-elise',
    name: '致爱丽丝（简化版）',
    nameEn: 'Für Elise (Simplified)',
    composer: '贝多芬',
    difficulty: 3,
    bpm: 120,
    notes: [
      N(A4, 0.5), N(B3, 0.5), N(C5, 0.5), N(B3, 0.5),
      N(A4, 0.5), N(B3, 0.5), N(C5, 0.5), N(B3, 0.5),
      N(A4, 0.5), N(E4, 0.5), N(C5, 0.5), N(B4, 0.5),
      N(A4, 0.5), N(E4, 0.5), N(E4, 0.5), N(D4, 0.5),
      N(C4, 0.5), N(B3, 0.5), N(A4, 0.5), N(B3, 0.5),
      N(C5, 0.5), N(B3, 0.5), N(A4, 0.5), N(B3, 0.5),
      N(A4, 0.5), N(E4, 0.5), N(C5, 0.5), N(B4, 0.5),
      N(A4, 0.5), N(E4, 0.5), N(E4, 0.5), N(D4, 0.5),
      N(C4, 0.5), N(B3, 0.5), N(A4, 2),
    ],
  },
  {
    id: 'canon-d',
    name: '卡农 D 大调（简化版）',
    nameEn: 'Canon in D (Simplified)',
    composer: '帕赫贝尔',
    difficulty: 4,
    bpm: 80,
    notes: [
      // D 大调旋律简化版：F# G A B C# D E F# ...
      N(66, 2), N(64, 2), N(62, 2), N(61, 2),
      N(59, 2), N(57, 2), N(59, 2), N(61, 2),
      N(62, 2), N(61, 2), N(59, 2), N(57, 2),
      N(55, 2), N(54, 2), N(55, 2), N(57, 2),
    ],
  },
  {
    id: 'farewell',
    name: '送别（简化版）',
    nameEn: 'Farewell (Simplified)',
    composer: '约翰·奥德威',
    difficulty: 2,
    bpm: 80,
    notes: [
      N(G4, 2), N(E4, 1), N(G4, 1),
      N(C5, 2), N(B4, 1), N(C5, 1),
      N(D5, 2), N(C5, 1), N(B4, 1),
      N(A4, 4),
      N(G4, 2), N(E4, 1), N(G4, 1),
      N(C5, 2), N(B4, 1), N(A4, 1),
      N(G4, 2), N(E4, 1), N(D4, 1),
      N(C4, 4),
    ],
  },
];
