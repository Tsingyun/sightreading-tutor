/**
 * VexFlow 渲染工具库
 * ============================================
 * 封装五线谱的绘制逻辑，包括谱号、音符、升降号渲染，
 * 以及根据答题状态对音符着色。
 *
 * 支持两种模式：
 * - 单音模式：渲染单个音符
 * - 和弦模式：渲染多个音符（和弦），支持单独着色已弹奏的音符
 *
 * 注意：SVG 不支持 CSS 变量，所有颜色值必须在使用前
 * 通过 getComputedStyle 解析为实际颜色值再传入。
 */

import { Renderer, Stave, StaveNote, Accidental, Voice, Formatter, type RenderContext } from 'vexflow';
import type { NoteInfo, AnswerState } from '../types';

/** 主题颜色配置（已解析的实际颜色值，非 CSS 变量） */
export interface ThemeColors {
  /** 谱表线条颜色 */
  staffColor: string;
  /** 背景颜色 */
  bgColor: string;
  /** 默认音符颜色 */
  noteDefault: string;
  /** 正确音符颜色（绿色） */
  noteCorrect: string;
  /** 错误音符颜色（红色） */
  noteWrong: string;
}

export interface RenderOptions {
  /** 容器元素 */
  container: HTMLDivElement;
  /** 单音模式下的音符 */
  note: NoteInfo | null;
  /** 和弦模式下的多个音符（为 null 或空数组时绘制空谱表） */
  notes?: NoteInfo[] | null;
  /** 已正确弹奏的音符索引（和弦模式下，这些音符显示为绿色） */
  playedIndices?: number[];
  /** 答题状态（决定音符颜色） */
  answerState: AnswerState;
  /** 是否显示音名提示（揭示答案时） */
  showLabel?: boolean;
  /** 是否始终显示音名（学习模式，pending 状态下也显示） */
  alwaysShowLabel?: boolean;
  /** 按键后短暂闪现音名（关闭 alwaysShowLabel 时生效） */
  flashLabel?: boolean;
  /** 和弦名称（和弦完成时显示） */
  chordName?: string;
  /** 主题颜色配置 */
  themeColors: ThemeColors;
  /** 调号（如 'C', 'G', 'D', 'F', 'Bb' 等），不传默认 C */
  keySignature?: string;
}

/** 根据答题状态和主题颜色获取音符颜色 */
function getNoteColor(state: AnswerState, colors: ThemeColors): string {
  switch (state) {
    case 'correct':
    case 'revealed':
      return colors.noteCorrect;
    case 'wrong':
      return colors.noteWrong;
    default:
      return colors.noteDefault;
  }
}

/**
 * 渲染后对 SVG 中的音符元素单独着色（和弦模式下使用）。
 * 通过 inline style 设置颜色，优先级高于 CSS 规则。
 */
function applyNoteColors(
  container: HTMLDivElement,
  playedIndices: number[],
  answerState: AnswerState,
  colors: ThemeColors,
): void {
  const noteheads = container.querySelectorAll('.vf-notehead text');
  const stems = container.querySelectorAll('.vf-stem path');
  const notePaths = container.querySelectorAll('.vf-stavenote > path');
  const accidentals = container.querySelectorAll('.vf-accidental text');

  let color = colors.noteDefault;
  if (answerState === 'correct' || answerState === 'revealed') {
    color = colors.noteCorrect;
  } else if (answerState === 'wrong') {
    color = colors.noteWrong;
  }

  noteheads.forEach((el) => {
    (el as SVGTextElement).style.fill = color;
  });
  stems.forEach((el) => {
    (el as SVGPathElement).style.fill = color;
  });
  notePaths.forEach((el) => {
    (el as SVGPathElement).style.stroke = color;
  });
  accidentals.forEach((el) => {
    (el as SVGTextElement).style.fill = color;
  });

  // 如果是 pending 状态且有部分音符已弹奏，单独设置已弹奏音符为绿色
  if (answerState === 'pending' && playedIndices.length > 0) {
    noteheads.forEach((el, i) => {
      if (playedIndices.includes(i)) {
        (el as SVGTextElement).style.fill = colors.noteCorrect;
      }
    });
  }
}

/**
 * 创建和弦的 StaveNote（多音符）。
 */
function createChordNote(notes: NoteInfo[], clef: string): StaveNote {
  const keys = notes.map((n) => n.vexKey);
  const staveNote = new StaveNote({
    keys,
    duration: 'w',
    clef,
    autoStem: true,
  });

  // 为带升降号的音符添加修饰符
  notes.forEach((note, index) => {
    if (note.accidental) {
      staveNote.addModifier(new Accidental(note.accidental), index);
    }
  });

  return staveNote;
}

/**
 * 渲染单谱表五线谱。
 * 根据 note 的 clef 属性决定使用高音/低音谱号。
 * 支持单音和和弦两种模式。
 */
export function renderStaff(options: RenderOptions): void {
  const { container, note, notes, playedIndices = [], answerState, themeColors } = options;

  // 清空容器
  container.innerHTML = '';

  // —— 固定尺寸渲染 ——
  // 无论单音还是和弦，均使用相同的 scale 和 height，
  // 避免音符数量变化时 SVG 尺寸跳变导致屏幕闪烁。
  const scale = 2.5;
  const svgWidth = container.clientWidth || 600;
  const drawWidth = svgWidth / scale;
  const svgHeight = 170 * scale;

  // 创建 SVG 渲染器
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(svgWidth, svgHeight);
  const context = renderer.getContext();
  context.scale(scale, scale);
  context.setFont('Arial', 12);

  // 创建谱表
  const staveX = 18;
  const staveWidth = drawWidth - 36;
  const staveY = 50;
  const stave = new Stave(staveX, staveY, staveWidth);

  // 确定谱号：和弦模式取第一个音符的谱号
  const clef = notes?.[0]?.clef || note?.clef || 'treble';
  stave.addClef(clef);
  if (options.keySignature && options.keySignature !== 'C') {
    stave.addKeySignature(options.keySignature);
  }
  stave.setContext(context);
  stave.setStyle({ strokeStyle: themeColors.staffColor, fillStyle: themeColors.staffColor });
  stave.draw();

  // 确定要渲染的音符列表
  const renderNotes = notes && notes.length > 0 ? notes : note ? [note] : null;

  if (!renderNotes) return;

  // 创建 StaveNote（单音或和弦）
  const staveNote =
    renderNotes.length === 1
      ? new StaveNote({ keys: [renderNotes[0].vexKey], duration: 'w', clef, autoStem: true })
      : createChordNote(renderNotes, clef);

  // 单音模式下添加升降号
  if (renderNotes.length === 1 && renderNotes[0].accidental) {
    staveNote.addModifier(new Accidental(renderNotes[0].accidental), 0);
  }

  // 设置整体颜色（单音模式使用 setStyle，和弦模式使用后处理着色）
  if (renderNotes.length === 1) {
    const color = getNoteColor(answerState, themeColors);
    staveNote.setStyle({ fillStyle: color, strokeStyle: color });
  }

  const voice = new Voice({ numBeats: 4, beatValue: 4 });
  voice.setMode(Voice.Mode.SOFT);
  voice.addTickables([staveNote]);

  const formatter = new Formatter();
  formatter.joinVoices([voice]);
  formatter.format([voice], staveWidth - 100);

  voice.draw(context, stave);

  // 和弦模式：渲染后单独着色
  if (renderNotes.length > 1) {
    applyNoteColors(container, playedIndices, answerState, themeColors);
  }

  // 显示标签（揭示答案、学习模式、闪现、或和弦完成时）
  const shouldShowLabel = options.showLabel
    || (options.alwaysShowLabel && answerState !== 'wrong' && answerState !== 'idle')
    || (options.flashLabel && !options.alwaysShowLabel);
  if (shouldShowLabel && renderNotes.length === 1) {
    const noteStartX = stave.getNoteStartX();
    const noteEndX = stave.getNoteEndX();
    const centerX = (noteStartX + noteEndX) / 2;
    const labelColor = (answerState === 'pending' || options.flashLabel) ? themeColors.noteDefault : themeColors.noteCorrect;
    drawNoteLabel(context, renderNotes[0], centerX, staveY, labelColor);
  }

  // 和弦名称标签
  if (options.chordName && (answerState === 'correct' || answerState === 'revealed')) {
    const centerX = staveX + staveWidth / 2;
    drawChordLabel(context, options.chordName, centerX, staveY, themeColors.noteCorrect);
  }
}

/**
 * 在音符上方绘制音名标签。
 */
function drawNoteLabel(context: RenderContext, note: NoteInfo, x: number, staveY: number, color: string): void {
  context.save();
  context.setFont('Arial', 16, 'bold');
  context.setFillStyle(color);
  context.fillText(note.name + note.octave, x - 20, staveY - 15);
  context.restore();
}

/**
 * 在谱表上方绘制和弦名称标签。
 */
function drawChordLabel(context: RenderContext, name: string, x: number, staveY: number, color: string): void {
  context.save();
  context.setFont('Arial', 18, 'bold');
  context.setFillStyle(color);
  context.fillText(name, x - 40, staveY - 15);
  context.restore();
}

/**
 * 渲染双谱表（大谱表）。
 * 高音谱表在上，低音谱表在下，中间用竖线连接。
 *
 * 支持将音符按谱号分配到各自对应的谱表上渲染：
 * - clef='treble' 的音符画在高音谱表
 * - clef='bass' 的音符画在低音谱表
 * 这样自由弹奏模式下，跨音域的和弦可以同时显示在两个谱表上。
 */
export function renderGrandStaff(options: RenderOptions): void {
  const { container, note, notes, playedIndices = [], answerState, themeColors } = options;

  container.innerHTML = '';

  // —— 固定尺寸渲染 ——
  // 无论单音还是多音和弦，均使用相同的 scale 和 height，
  // 避免自由弹奏时音符数量变化导致五线谱尺寸跳变和闪烁。
  const scale = 2.5;
  const svgWidth = container.clientWidth || 600;
  const drawWidth = svgWidth / scale;
  const svgHeight = 200 * scale;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(svgWidth, svgHeight);
  const context = renderer.getContext();
  context.scale(scale, scale);
  context.setFont('Arial', 12);

  const staveX = 22;
  const staveWidth = drawWidth - 44;

  // 高音谱表
  const trebleStave = new Stave(staveX, 45, staveWidth);
  trebleStave.addClef('treble');
  if (options.keySignature && options.keySignature !== 'C') {
    trebleStave.addKeySignature(options.keySignature);
  }
  trebleStave.setContext(context);
  trebleStave.setStyle({ strokeStyle: themeColors.staffColor, fillStyle: themeColors.staffColor });
  trebleStave.draw();

  // 低音谱表
  const bassStave = new Stave(staveX, 140, staveWidth);
  bassStave.addClef('bass');
  if (options.keySignature && options.keySignature !== 'C') {
    bassStave.addKeySignature(options.keySignature);
  }
  bassStave.setContext(context);
  bassStave.setStyle({ strokeStyle: themeColors.staffColor, fillStyle: themeColors.staffColor });
  bassStave.draw();

  // 绘制连接线
  context.save();
  context.setStrokeStyle(themeColors.staffColor);
  context.setLineWidth(2);
  context.beginPath();
  context.moveTo(staveX, 45);
  context.lineTo(staveX, 180);
  context.stroke();
  context.restore();

  // 确定要渲染的音符列表
  const renderNotes = notes && notes.length > 0 ? notes : note ? [note] : null;

  if (!renderNotes) return;

  // 按谱号分组
  const trebleNotes = renderNotes.filter((n) => n.clef === 'treble');
  const bassNotes = renderNotes.filter((n) => n.clef === 'bass');

  /** 在指定谱表上渲染一组音符 */
  const renderOnStave = (
    stave: Stave,
    clefNotes: NoteInfo[],
    clefName: 'treble' | 'bass',
  ) => {
    if (clefNotes.length === 0) return;

    const staveNote =
      clefNotes.length === 1
        ? new StaveNote({ keys: [clefNotes[0].vexKey], duration: 'w', clef: clefName, autoStem: true })
        : createChordNote(clefNotes, clefName);

    if (clefNotes.length === 1 && clefNotes[0].accidental) {
      staveNote.addModifier(new Accidental(clefNotes[0].accidental), 0);
    }

    if (clefNotes.length === 1) {
      const color = getNoteColor(answerState, themeColors);
      staveNote.setStyle({ fillStyle: color, strokeStyle: color });
    }

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.setMode(Voice.Mode.SOFT);
    voice.addTickables([staveNote]);

    const formatter = new Formatter();
    formatter.joinVoices([voice]);
    formatter.format([voice], staveWidth - 100);

    voice.draw(context, stave);
  };

  renderOnStave(trebleStave, trebleNotes, 'treble');
  renderOnStave(bassStave, bassNotes, 'bass');

  // 和弦模式：渲染后单独着色
  if (renderNotes.length > 1) {
    applyNoteColors(container, playedIndices, answerState, themeColors);
  }

  const shouldShowLabelGrand = options.showLabel
    || (options.alwaysShowLabel && answerState !== 'wrong' && answerState !== 'idle')
    || (options.flashLabel && !options.alwaysShowLabel);
  if (shouldShowLabelGrand && renderNotes.length === 1) {
    const centerX = staveX + staveWidth / 2;
    const labelY = renderNotes[0].clef === 'treble' ? 45 : 140;
    const labelColor = (answerState === 'pending' || options.flashLabel) ? themeColors.noteDefault : themeColors.noteCorrect;
    drawNoteLabel(context, renderNotes[0], centerX, labelY, labelColor);
  }

  if (options.chordName && (answerState === 'correct' || answerState === 'revealed')) {
    const centerX = staveX + staveWidth / 2;
    // 和弦名称画在有音符的谱表上方，优先高音谱表
    const labelClef = trebleNotes.length > 0 ? 'treble' : 'bass';
    const labelY = labelClef === 'treble' ? 45 : 140;
    drawChordLabel(context, options.chordName, centerX, labelY, themeColors.noteCorrect);
  }
}

/**
 * 乐曲练习专用渲染：在五线谱上渲染一段音符序列，
 * 用竖线光标标记当前待弹奏的位置。
 *
 * - 已弹对的音符显示为绿色
 * - 当前音符根据 answerState 着色（pending=黑色, correct=绿色, wrong=红色）
 * - 未弹奏的音符显示为浅灰色
 * - 光标竖线在当前音符处
 */
export interface SongRenderOptions {
  container: HTMLDivElement;
  notes: NoteInfo[];
  currentIndex: number;
  windowSize?: number;
  answerState: AnswerState;
  themeColors: ThemeColors;
}

export function renderSongStaff(options: SongRenderOptions): void {
  const { container, notes, currentIndex, windowSize = 4, answerState, themeColors } = options;

  container.innerHTML = '';

  if (notes.length === 0) return;

  // 计算窗口：当前音符前显示 1 个已弹过的音，后面显示剩余位置
  const start = Math.max(0, currentIndex - 1);
  const end = Math.min(notes.length, start + windowSize);
  const windowNotes = notes.slice(start, end);
  const relativeIndex = currentIndex - start;

  const scale = 2.5;
  const svgWidth = container.clientWidth || 600;
  const drawWidth = svgWidth / scale;
  const svgHeight = 200 * scale;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(svgWidth, svgHeight);
  const context = renderer.getContext();
  context.scale(scale, scale);
  context.setFont('Arial', 12);

  const staveX = 18;
  const staveWidth = drawWidth - 36;
  const staveY = 60;
  const stave = new Stave(staveX, staveY, staveWidth);

  // 谱号取当前音符的谱号
  const clef = windowNotes[relativeIndex]?.clef || notes[currentIndex]?.clef || 'treble';
  stave.addClef(clef);
  stave.setContext(context);
  stave.setStyle({ strokeStyle: themeColors.staffColor, fillStyle: themeColors.staffColor });
  stave.draw();

  // 创建每个音符的 StaveNote（统一用四分音符显示）
  const staveNotes: StaveNote[] = windowNotes.map((note) => {
    const sn = new StaveNote({
      keys: [note.vexKey],
      duration: 'q',
      clef,
      autoStem: true,
    });
    if (note.accidental) {
      sn.addModifier(new Accidental(note.accidental), 0);
    }
    return sn;
  });

  // 格式化排列
  const voice = new Voice({ numBeats: staveNotes.length, beatValue: 4 });
  voice.setMode(Voice.Mode.SOFT);
  voice.addTickables(staveNotes);

  const formatter = new Formatter();
  formatter.joinVoices([voice]);
  formatter.format([voice], staveWidth - 60);

  voice.draw(context, stave);

  // 逐个着色
  const noteheads = container.querySelectorAll('.vf-stavenote');
  noteheads.forEach((el, i) => {
    const noteheadTexts = el.querySelectorAll('.vf-notehead text');
    const stems = el.querySelectorAll('.vf-stem path');
    const notePaths = el.querySelectorAll('.vf-stavenote > path');
    const accidentals = el.querySelectorAll('.vf-accidental text');

    let color: string;
    if (i < relativeIndex) {
      // 已弹对
      color = themeColors.noteCorrect;
    } else if (i === relativeIndex) {
      // 当前音符
      color = getNoteColor(answerState, themeColors);
    } else {
      // 未弹奏
      color = '#AAAAAA';
    }

    noteheadTexts.forEach((t) => { (t as SVGTextElement).style.fill = color; });
    stems.forEach((s) => { (s as SVGPathElement).style.fill = color; });
    notePaths.forEach((p) => { (p as SVGPathElement).style.stroke = color; });
    accidentals.forEach((a) => { (a as SVGTextElement).style.fill = color; });
  });

  // 绘制光标竖线
  if (relativeIndex < staveNotes.length) {
    const cursorX = staveNotes[relativeIndex].getAbsoluteX();
    const staveTop = stave.getYForLine(0) - 8;
    const staveBottom = stave.getYForLine(4) + 8;
    const cursorColor = answerState === 'wrong' ? themeColors.noteWrong : themeColors.noteDefault;

    context.save();
    context.setStrokeStyle(cursorColor);
    context.setLineWidth(2);
    context.beginPath();
    context.moveTo(cursorX, staveTop);
    context.lineTo(cursorX, staveBottom);
    context.stroke();
    context.restore();
  }
}
