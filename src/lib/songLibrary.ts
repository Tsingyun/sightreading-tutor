/**
 * 统一曲库（识谱训练 + 乐曲练习共用）
 * ============================================
 * 「识谱训练」与「乐曲练习」整合为一条连贯的旋律学习线后，
 * 两个阶段共用同一份曲库：
 *   阶段一 · 逐音识谱 —— 按歌曲旋律顺序逐个呈现音符；
 *   阶段二 · 整曲练习 —— 同一首歌在流动五线谱上跟弹 / 自动播放。
 *
 * 旋律选曲优先华语、日语、欧美经典流行歌曲，并保留原有古典 / 民谣曲目。
 * 所有曲目均为教学用的简化主旋律（单声部），以 NoteStep 数组编码：
 * duration 单位为拍（1 = 四分音符，0.5 = 八分，2 = 二分，4 = 全音）。
 */

export interface SongNote {
  midi: number;
  duration: number;
  isRest?: boolean;
}

/** 歌曲来源地区（用于曲库分组与徽章显示） */
export type SongRegion = 'mandarin' | 'japanese' | 'western' | 'classical';

export interface PresetSong {
  id: string;
  /** 歌曲名（页面标题位置显示） */
  name: string;
  nameEn: string;
  /** 作曲 / 原唱等署名信息 */
  composer: string;
  /** 演唱者 / 标志性演绎者（流行歌曲填写，古典曲目可省略） */
  artist?: string;
  /** 来源地区 */
  region: SongRegion;
  /** 一句话简介（年代、背景），显示在选歌卡片与标题栏 */
  description?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  bpm: number;
  notes: SongNote[];
}

const N = (midi: number, duration: number): SongNote => ({ midi, duration });

/** 一首歌的可弹音符（跳过休止符）——识谱与跟弹共用的「旋律序列」 */
export function getPlayableNotes(song: PresetSong): SongNote[] {
  return song.notes.filter((n) => !n.isRest);
}

/** 旋律音高范围（用于虚拟键盘自动适配） */
export function getSongRange(song: PresetSong): { low: number; high: number } {
  const playable = getPlayableNotes(song);
  if (playable.length === 0) return { low: 60, high: 72 };
  const midis = playable.map((n) => n.midi);
  return { low: Math.min(...midis), high: Math.max(...midis) };
}

/** 曲库分组顺序（选歌界面按此顺序分区展示） */
export const SONG_REGION_ORDER: SongRegion[] = ['mandarin', 'japanese', 'western', 'classical'];

export const SONG_LIBRARY: PresetSong[] = [
  // ================================================================
  // 华语经典流行
  // ================================================================
  {
    id: 'moon-represents-my-heart',
    name: '月亮代表我的心',
    nameEn: 'The Moon Represents My Heart',
    composer: '翁清溪',
    artist: '邓丽君',
    region: 'mandarin',
    description: '1977 · 华语流行永恒经典，旋律舒缓、音域亲和',
    difficulty: 2,
    bpm: 72,
    notes: [
      // 你问我爱你有多深，我爱你有几分
      N(64, 1), N(67, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(64, 1), N(60, 2),
      N(64, 1), N(67, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(64, 1), N(60, 2),
      // 我的情也真，我的爱也真
      N(67, 1), N(69, 1), N(72, 1), N(69, 1), N(67, 2), N(64, 1), N(62, 1),
      N(67, 1), N(69, 1), N(72, 1), N(69, 1), N(67, 2), N(64, 1), N(62, 1),
      // 月亮代表我的心
      N(64, 1), N(67, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 4),
      // 轻轻的一个吻，已经打动我的心
      N(64, 1), N(67, 1), N(69, 1), N(72, 1), N(69, 1), N(67, 1), N(64, 2),
      N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(64, 1), N(67, 1), N(64, 2),
      // 深深的一段情，教我思念到如今
      N(64, 1), N(67, 1), N(69, 1), N(72, 1), N(69, 1), N(67, 1), N(64, 2),
      N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(64, 1), N(62, 1), N(60, 4),
      // 你去想一想，你去看一看，月亮代表我的心
      N(64, 1), N(67, 1), N(69, 1), N(67, 1), N(64, 2), N(62, 1),
      N(64, 1), N(67, 1), N(69, 1), N(67, 1), N(64, 2), N(62, 1),
      N(64, 1), N(67, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 4),
    ],
  },
  {
    id: 'jasmine-flower',
    name: '茉莉花',
    nameEn: 'Jasmine Flower (Mo Li Hua)',
    composer: '江苏民歌',
    artist: '传唱百年的中国旋律',
    region: 'mandarin',
    description: '清代流传至今 · 被誉为中国的第二国歌',
    difficulty: 2,
    bpm: 76,
    notes: [
      // 好一朵美丽的茉莉花
      N(64, 1), N(64, 1), N(67, 1), N(69, 1), N(72, 1), N(72, 1), N(69, 1), N(67, 2),
      N(67, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(64, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 2),
      // 芬芳美丽满枝桠，又香又白人人夸
      N(64, 1), N(64, 1), N(67, 1), N(69, 1), N(72, 1), N(72, 1), N(69, 1), N(67, 2),
      N(67, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(64, 1), N(62, 1), N(60, 2),
      // 让我来把你摘下，送给别人家
      N(62, 1), N(62, 1), N(62, 1), N(64, 1), N(67, 2), N(69, 1), N(67, 1),
      N(64, 1), N(62, 1), N(64, 1), N(65, 1), N(64, 1), N(62, 1), N(62, 2),
      // 茉莉花呀茉莉花
      N(64, 1), N(62, 1), N(60, 1), N(62, 1), N(64, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 4),
    ],
  },

  // ================================================================
  // 日语经典流行
  // ================================================================
  {
    id: 'ue-o-muite-arukou',
    name: '上を向いて歩こう',
    nameEn: 'Ue o Muite Arukou (Sukiyaki)',
    composer: '中村八大',
    artist: '坂本九',
    region: 'japanese',
    description: '1961 · 首支登顶美国 Billboard 的日语歌曲',
    difficulty: 3,
    bpm: 96,
    notes: [
      // 上を向いて歩こう（昂首向前走）
      N(67, 1), N(69, 1), N(71, 1), N(74, 1), N(71, 1), N(69, 1), N(67, 1), N(69, 1), N(71, 2),
      // 涙がこぼれないように（不让泪水滑落）
      N(71, 1), N(74, 1), N(76, 1), N(74, 1), N(71, 1), N(69, 1), N(67, 1), N(69, 1), N(67, 2),
      // 思い出す春の日（想起春日的时光）
      N(76, 1), N(74, 1), N(71, 1), N(74, 1), N(76, 1), N(79, 1), N(76, 1), N(74, 2),
      // 一人ぼっちの夜（独自一人的夜）
      N(71, 1), N(74, 1), N(76, 1), N(74, 1), N(71, 1), N(69, 1), N(67, 1), N(69, 1), N(67, 4),
      // 上を向いて歩こう
      N(67, 1), N(69, 1), N(71, 1), N(74, 1), N(71, 1), N(69, 1), N(67, 1), N(69, 1), N(71, 2),
      // にじんだ星をかぞえて（数着朦胧的星）
      N(71, 1), N(74, 1), N(76, 1), N(79, 1), N(76, 1), N(74, 1), N(71, 1), N(74, 1), N(76, 2),
      // 思い出す夏の日
      N(76, 1), N(74, 1), N(71, 1), N(74, 1), N(76, 1), N(79, 1), N(76, 1), N(74, 2),
      // 一人ぼっちの夜
      N(71, 1), N(74, 1), N(76, 1), N(74, 1), N(71, 1), N(69, 1), N(67, 1), N(69, 1), N(67, 4),
    ],
  },
  {
    id: 'furusato',
    name: '故乡（ふるさと）',
    nameEn: 'Furusato (Hometown)',
    composer: '冈野贞一',
    artist: '文部省唱歌',
    region: 'japanese',
    description: '1914 · 日本国民唱歌，海外游子的共同乡愁',
    difficulty: 2,
    bpm: 84,
    notes: [
      // 兎追いし彼の山（追逐野兔的那座山）
      N(72, 1), N(71, 1), N(69, 1), N(67, 1), N(64, 1), N(67, 1), N(69, 2),
      // 小鮒釣りし彼の川（垂钓小鱼的那条河）
      N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 1), N(62, 1), N(64, 2),
      // 夢は今も巡りて（梦里依旧萦绕）
      N(64, 1), N(67, 1), N(69, 1), N(72, 1), N(69, 1), N(67, 1), N(64, 1), N(67, 2),
      // 忘れ難き故乡（难以忘怀的故乡）
      N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 4),
      // 如何にいます父母（父母如今可安好）
      N(72, 1), N(71, 1), N(69, 1), N(67, 1), N(64, 1), N(67, 1), N(69, 2),
      // 如何や友がき（故友们近况如何）
      N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 1), N(62, 1), N(64, 2),
      // 雨に風につけても（无论风雨交加）
      N(64, 1), N(67, 1), N(69, 1), N(72, 1), N(69, 1), N(67, 1), N(64, 1), N(67, 2),
      // 思い出づる故乡
      N(69, 1), N(67, 1), N(64, 1), N(62, 1), N(60, 4),
    ],
  },

  // ================================================================
  // 欧美经典流行
  // ================================================================
  {
    id: 'cant-help-falling-in-love',
    name: "Can't Help Falling in Love",
    nameEn: "Can't Help Falling in Love",
    composer: 'Hugo Peretti 等',
    artist: 'Elvis Presley',
    region: 'western',
    description: '1961 · 猫王金曲，旋律源自法国古典恋歌',
    difficulty: 2,
    bpm: 68,
    notes: [
      // Wise men say only fools rush in
      N(64, 1), N(67, 1), N(72, 1), N(71, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 2),
      // But I can't help falling in love with you
      N(60, 1), N(64, 1), N(62, 1), N(64, 1), N(65, 1), N(64, 1), N(62, 1), N(60, 2), N(62, 1), N(64, 2),
      // Shall I stay? Would it be a sin
      N(64, 1), N(67, 1), N(72, 1), N(71, 1), N(69, 1), N(67, 1), N(64, 1), N(62, 2),
      // If I can't help falling in love with you
      N(60, 1), N(64, 1), N(62, 1), N(64, 1), N(65, 1), N(64, 1), N(62, 1), N(60, 4),
      // Take my hand, take my whole life too
      N(72, 1), N(71, 1), N(69, 1), N(71, 1), N(72, 1), N(74, 1), N(72, 1), N(71, 2),
      // For I can't help falling in love with you
      N(60, 1), N(64, 1), N(62, 1), N(64, 1), N(65, 1), N(64, 1), N(62, 1), N(60, 4),
    ],
  },
  {
    id: 'scarborough-fair',
    name: 'Scarborough Fair',
    nameEn: 'Scarborough Fair',
    composer: '英格兰传统民谣',
    artist: 'Simon & Garfunkel',
    region: 'western',
    description: '1966 · 经二人组传唱全球的英伦民谣流行经典',
    difficulty: 2,
    bpm: 92,
    notes: [
      // Are you going to Scarborough Fair?
      N(62, 2), N(69, 1), N(69, 1), N(65, 1), N(64, 1), N(62, 3),
      // Parsley, sage, rosemary and thyme
      N(69, 1), N(72, 1), N(74, 1), N(72, 1), N(69, 1), N(71, 1), N(67, 1), N(69, 3),
      // Remember me to one who lives there
      N(69, 1), N(69, 1), N(65, 1), N(64, 1), N(62, 1), N(64, 1), N(65, 1), N(64, 2),
      // She once was a true love of mine
      N(65, 1), N(64, 1), N(62, 1), N(59, 1), N(57, 1), N(62, 4),
      // Tell her to make me a cambric shirt
      N(62, 2), N(69, 1), N(69, 1), N(65, 1), N(64, 1), N(62, 3),
      // Parsley, sage, rosemary and thyme
      N(69, 1), N(72, 1), N(74, 1), N(72, 1), N(69, 1), N(71, 1), N(67, 1), N(69, 3),
      // Without no seams nor needle work
      N(69, 1), N(69, 1), N(65, 1), N(64, 1), N(62, 1), N(64, 1), N(65, 1), N(64, 2),
      // Then she'll be a true love of mine
      N(65, 1), N(64, 1), N(62, 1), N(59, 1), N(57, 1), N(62, 4),
    ],
  },

  // ================================================================
  // 古典与传统民谣（原有曲目）
  // ================================================================
  {
    id: 'ode-to-joy',
    name: '欢乐颂',
    nameEn: 'Ode to Joy',
    composer: '贝多芬',
    region: 'classical',
    description: '第九交响曲第四乐章 · 欧洲联盟盟歌',
    difficulty: 1,
    bpm: 100,
    notes: [
      N(64, 1), N(64, 1), N(65, 1), N(67, 1),
      N(67, 1), N(65, 1), N(64, 1), N(62, 1),
      N(60, 1), N(60, 1), N(62, 1), N(64, 1),
      N(64, 1.5), N(62, 0.5), N(62, 2),
      N(64, 1), N(64, 1), N(65, 1), N(67, 1),
      N(67, 1), N(65, 1), N(64, 1), N(62, 1),
      N(60, 1), N(60, 1), N(62, 1), N(64, 1),
      N(62, 1.5), N(60, 0.5), N(60, 2),
    ],
  },
  {
    id: 'twinkle',
    name: '小星星',
    nameEn: 'Twinkle Twinkle Little Star',
    composer: '传统民谣',
    region: 'classical',
    description: '法国民谣旋律 · 启蒙第一课',
    difficulty: 1,
    bpm: 90,
    notes: [
      N(60, 1), N(60, 1), N(67, 1), N(67, 1),
      N(69, 1), N(69, 1), N(67, 2),
      N(65, 1), N(65, 1), N(64, 1), N(64, 1),
      N(62, 1), N(62, 1), N(60, 2),
      N(67, 1), N(67, 1), N(65, 1), N(65, 1),
      N(64, 1), N(64, 1), N(62, 2),
      N(67, 1), N(67, 1), N(65, 1), N(65, 1),
      N(64, 1), N(64, 1), N(62, 2),
      N(60, 1), N(60, 1), N(67, 1), N(67, 1),
      N(69, 1), N(69, 1), N(67, 2),
      N(65, 1), N(65, 1), N(64, 1), N(64, 1),
      N(62, 1), N(62, 1), N(60, 2),
    ],
  },
  {
    id: 'mary-lamb',
    name: '玛丽有只小羊羔',
    nameEn: 'Mary Had a Little Lamb',
    composer: '传统民谣',
    region: 'classical',
    description: '美国传统童谣 · 入门旋律',
    difficulty: 1,
    bpm: 90,
    notes: [
      N(64, 1), N(62, 1), N(60, 1), N(62, 1),
      N(64, 1), N(64, 1), N(64, 2),
      N(62, 1), N(62, 1), N(62, 2),
      N(64, 1), N(67, 1), N(67, 2),
      N(64, 1), N(62, 1), N(60, 1), N(62, 1),
      N(64, 1), N(64, 1), N(64, 1), N(64, 1),
      N(62, 1), N(62, 1), N(64, 1), N(62, 1),
      N(60, 4),
    ],
  },
  {
    id: 'farewell',
    name: '送别（简化版）',
    nameEn: 'Farewell (Simplified)',
    composer: '约翰·奥德威',
    artist: '李叔同填词',
    region: 'classical',
    description: '长亭外，古道边 · 学堂乐歌不朽之作',
    difficulty: 2,
    bpm: 80,
    notes: [
      N(67, 2), N(64, 1), N(67, 1),
      N(72, 2), N(71, 1), N(72, 1),
      N(74, 2), N(72, 1), N(71, 1),
      N(69, 4),
      N(67, 2), N(64, 1), N(67, 1),
      N(72, 2), N(71, 1), N(69, 1),
      N(67, 2), N(64, 1), N(62, 1),
      N(60, 4),
    ],
  },
  {
    id: 'for-elise',
    name: '致爱丽丝（简化版）',
    nameEn: 'Für Elise (Simplified)',
    composer: '贝多芬',
    region: 'classical',
    description: '家喻户晓的钢琴小品',
    difficulty: 3,
    bpm: 120,
    notes: [
      N(69, 0.5), N(59, 0.5), N(72, 0.5), N(59, 0.5),
      N(69, 0.5), N(59, 0.5), N(72, 0.5), N(59, 0.5),
      N(69, 0.5), N(64, 0.5), N(72, 0.5), N(71, 0.5),
      N(69, 0.5), N(64, 0.5), N(64, 0.5), N(62, 0.5),
      N(60, 0.5), N(59, 0.5), N(69, 0.5), N(59, 0.5),
      N(72, 0.5), N(59, 0.5), N(69, 0.5), N(59, 0.5),
      N(69, 0.5), N(64, 0.5), N(72, 0.5), N(71, 0.5),
      N(69, 0.5), N(64, 0.5), N(64, 0.5), N(62, 0.5),
      N(60, 0.5), N(59, 0.5), N(69, 2),
    ],
  },
  {
    id: 'canon-d',
    name: '卡农 D 大调（简化版）',
    nameEn: 'Canon in D (Simplified)',
    composer: '帕赫贝尔',
    region: 'classical',
    description: '巴洛克经典 · 和声进行的源头',
    difficulty: 4,
    bpm: 80,
    notes: [
      N(66, 2), N(64, 2), N(62, 2), N(61, 2),
      N(59, 2), N(57, 2), N(59, 2), N(61, 2),
      N(62, 2), N(61, 2), N(59, 2), N(57, 2),
      N(55, 2), N(54, 2), N(55, 2), N(57, 2),
    ],
  },
];

/** 默认教学歌曲：旋律国民度最高、音域友好的华语经典 */
export const DEFAULT_SONG: PresetSong = SONG_LIBRARY[0];

export function findSongById(id: string | null | undefined): PresetSong {
  return SONG_LIBRARY.find((s) => s.id === id) ?? DEFAULT_SONG;
}
