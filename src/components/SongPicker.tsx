/**
 * SongPicker — 统一选歌器
 * ============================================
 * 识谱训练与乐曲练习共用同一份曲库、同一个选歌界面：
 * 按「华语经典 / 日语经典 / 欧美经典 / 古典与民谣」分组，
 * 每张卡片显示歌名、英文名、署名、简介、难度与音符数量。
 */

import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  SONG_LIBRARY,
  SONG_REGION_ORDER,
  getPlayableNotes,
  type PresetSong,
  type SongRegion,
} from '../lib/songLibrary';

interface SongPickerProps {
  /** 当前已选歌曲 id（高亮显示） */
  selectedId?: string | null;
  onSelect: (song: PresetSong) => void;
}

export function SongPicker({ selectedId, onSelect }: SongPickerProps) {
  const { t } = useLanguage();

  return (
    <div className="song-picker">
      {SONG_REGION_ORDER.map((region: SongRegion) => {
        const songs = SONG_LIBRARY.filter((s) => s.region === region);
        if (songs.length === 0) return null;
        return (
          <section key={region} className="song-picker__group">
            <h3 className="song-picker__group-title">{t(`song.region.${region}`)}</h3>
            <div className="song-library">
              {songs.map((song) => (
                <motion.button
                  key={song.id}
                  type="button"
                  className={`song-card ${song.id === selectedId ? 'song-card--active' : ''}`}
                  onClick={() => onSelect(song)}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="song-card__name">{song.name}</span>
                  <span className="song-card__composer">
                    {song.artist ? `${song.composer} · ${song.artist}` : song.composer}
                  </span>
                  {song.description && (
                    <span className="song-card__desc">{song.description}</span>
                  )}
                  <span className="song-card__meta">
                    <span>{song.bpm} BPM</span>
                    <span>{t('song.notesCount', { n: getPlayableNotes(song).length })}</span>
                    <span className="song-card__difficulty">
                      {'★'.repeat(song.difficulty)}
                      {'☆'.repeat(5 - song.difficulty)}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
