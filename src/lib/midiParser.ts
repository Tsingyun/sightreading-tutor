/**
 * MIDI 文件解析工具
 * ============================================
 * 使用 @tonejs/midi 解析 MIDI 文件，
 * 转换为统一的 ParsedNote 格式。
 */

import { Midi } from '@tonejs/midi';

export interface ParsedNote {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
  trackIndex: number;
}

export interface ParsedSong {
  name: string;
  notes: ParsedNote[];
  duration: number;
  tracks: { name: string; noteCount: number; isDrum: boolean }[];
  ppq: number;
  tempos: { bpm: number; time: number }[];
}

export function parseMidiFile(arrayBuffer: ArrayBuffer): ParsedSong {
  const midi = new Midi(arrayBuffer);

  const tracks: ParsedSong['tracks'] = [];
  const notes: ParsedNote[] = [];

  midi.tracks.forEach((track, trackIndex) => {
    const noteCount = track.notes.length;
    if (noteCount === 0) return;

    tracks.push({
      name: track.name || `轨道 ${trackIndex + 1}`,
      noteCount,
      isDrum: track.instrument.percussion,
    });

    for (const note of track.notes) {
      notes.push({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity,
        trackIndex,
      });
    }
  });

  notes.sort((a, b) => a.time - b.time);

  return {
    name: midi.name || '未命名乐曲',
    notes,
    duration: midi.duration,
    tracks,
    ppq: midi.header.ppq,
    tempos: midi.header.tempos.map((t) => ({ bpm: t.bpm, time: t.time ?? 0 })),
  };
}

export function filterNotesByTrack(song: ParsedSong, trackIndices: number[]): ParsedNote[] {
  const set = new Set(trackIndices);
  return song.notes.filter((n) => set.has(n.trackIndex));
}
