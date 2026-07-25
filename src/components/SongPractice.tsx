/**
 * SongPractice 组件
 * ============================================
 * 乐曲练习模式：内置乐曲库 + MIDI 文件导入。
 * 支持跟弹模式和自动播放模式。
 */

import { useState, useCallback, useRef } from 'react';
import { SONG_LIBRARY, type PresetSong } from '../lib/songLibrary';
import { parseMidiFile, type ParsedSong } from '../lib/midiParser';
import { useSongPractice } from '../hooks/useSongPractice';
import { SongStaff } from './SongStaff';
import type { ThemeMode } from '../types';

interface SongPracticeProps {
  onVirtualKeyPress: (midi: number) => void;
  theme: ThemeMode;
}

export function SongPractice({ onVirtualKeyPress: _onVirtualKeyPress, theme }: SongPracticeProps) {
  const [tab, setTab] = useState<'library' | 'import'>('library');
  const [parsedSong, setParsedSong] = useState<ParsedSong | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    currentSong, currentIndex, isPlaying, isFollowMode, speedMultiplier,
    stats, currentNote, allNotes, answerState, wrongNote,
    loadSong, play, pause, reset,
    setFollowMode, setSpeedMultiplier,
  } = useSongPractice();

  // 处理文件上传
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseMidiFile(buffer);
      setParsedSong(parsed);
      setSelectedTrack(0);
    } catch (err) {
      setImportError('解析失败，请确认文件为标准 MIDI 格式');
    }
  }, []);

  // 将导入的 MIDI 转换为 PresetSong 格式
  const loadParsedSong = useCallback(() => {
    if (!parsedSong) return;
    const trackNotes = parsedSong.notes.filter((n) => n.trackIndex === selectedTrack);
    if (trackNotes.length === 0) return;

    const bpm = parsedSong.tempos[0]?.bpm ?? 120;
    const beatDuration = 60 / bpm;
    const song: PresetSong = {
      id: 'imported',
      name: parsedSong.name,
      nameEn: '',
      composer: '导入',
      difficulty: 3,
      bpm: Math.round(bpm),
      notes: trackNotes.map((n) => ({
        midi: n.midi,
        duration: n.duration / beatDuration,
      })),
    };
    loadSong(song);
  }, [parsedSong, selectedTrack, loadSong]);

  const totalNotes = currentSong?.notes.filter((n) => !n.isRest).length ?? 0;
  const completedNotes = stats.total;
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  // 计算当前音符在 allNotes（非休止音符序列）中的位置
  const playableNoteIndex = currentSong
    ? currentSong.notes.slice(0, currentIndex).filter((n) => !n.isRest).length
    : 0;
  const displayPosition = playableNoteIndex + 1;

  return (
    <div className="song-practice">
      {/* Tab 切换 */}
      <div className="song-practice__tabs">
        <button
          className={`song-practice__tab ${tab === 'library' ? 'song-practice__tab--active' : ''}`}
          onClick={() => setTab('library')}
        >
          乐曲库
        </button>
        <button
          className={`song-practice__tab ${tab === 'import' ? 'song-practice__tab--active' : ''}`}
          onClick={() => setTab('import')}
        >
          导入 MIDI
        </button>
      </div>

      {tab === 'library' ? (
        <div className="song-practice__library">
          {SONG_LIBRARY.map((song) => (
            <button
              key={song.id}
              className={`song-practice__card ${currentSong?.id === song.id ? 'song-practice__card--active' : ''}`}
              onClick={() => loadSong(song)}
            >
              <div className="song-practice__card-name">{song.name}</div>
              <div className="song-practice__card-composer">{song.composer}</div>
              <div className="song-practice__card-meta">
                <span className="song-practice__card-difficulty">
                  {'★'.repeat(song.difficulty)}{'☆'.repeat(5 - song.difficulty)}
                </span>
                <span className="song-practice__card-bpm">{song.bpm} BPM</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="song-practice__import">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleFileUpload}
            className="song-practice__file-input"
          />
          {importError && <div className="song-practice__error">{importError}</div>}
          {parsedSong && (
            <div className="song-practice__parsed-info">
              <div className="song-practice__parsed-name">{parsedSong.name}</div>
              <div className="song-practice__parsed-tracks">
                <label className="song-practice__track-label">选择轨道：</label>
                {parsedSong.tracks.map((track, idx) => (
                  <button
                    key={idx}
                    className={`song-practice__track-btn ${selectedTrack === idx ? 'song-practice__track-btn--active' : ''}`}
                    onClick={() => setSelectedTrack(idx)}
                  >
                    {track.name} ({track.noteCount} 音)
                  </button>
                ))}
              </div>
              <button className="btn-primary" onClick={loadParsedSong}>
                加载乐曲
              </button>
            </div>
          )}
        </div>
      )}

      {/* 乐曲练习控制区 */}
      {currentSong && (
        <div className="song-practice__player">
          <div className="song-practice__info">
            <div className="song-practice__song-name">{currentSong.name}</div>
            <div className="song-practice__position">
              {displayPosition} / {totalNotes}
            </div>
          </div>

          {/* 进度条 */}
          <div className="song-practice__progress">
            <div
              className="song-practice__progress-bar"
              style={{ width: `${totalNotes > 0 ? (completedNotes / totalNotes) * 100 : 0}%` }}
            />
          </div>

          {/* 五线谱显示音符序列 + 光标 */}
          <div className="song-practice__staff-wrapper">
            {currentNote && allNotes.length > 0 ? (
              <SongStaff
                notes={allNotes}
                currentIndex={playableNoteIndex}
                answerState={answerState}
                theme={theme}
                windowSize={4}
              />
            ) : (
              <div className="song-practice__note-done">乐曲完成</div>
            )}
          </div>

          {/* 音名提示（辅助） */}
          <div className="song-practice__current-note">
            {currentNote ? (
              <>
                <span className={`song-practice__note-name ${answerState === 'wrong' ? 'song-practice__note-name--wrong' : ''} ${answerState === 'correct' ? 'song-practice__note-name--correct' : ''}`}>
                  {currentNote.name}{currentNote.octave}
                </span>
                {wrongNote !== null && (
                  <span className="song-practice__wrong-note">弹了 {wrongNote}</span>
                )}
              </>
            ) : null}
          </div>

          {/* 控制按钮 */}
          <div className="song-practice__controls">
            {!isFollowMode && (
              <button
                className="btn-secondary"
                onClick={isPlaying ? pause : play}
              >
                {isPlaying ? '暂停' : '播放'}
              </button>
            )}
            <button className="btn-secondary" onClick={reset}>
              重置
            </button>
            <label className="song-practice__follow-toggle">
              <input
                type="checkbox"
                checked={isFollowMode}
                onChange={(e) => setFollowMode(e.target.checked)}
              />
              <span>跟弹模式</span>
            </label>
            <select
              className="song-practice__speed"
              value={speedMultiplier}
              onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
            </select>
          </div>

          {/* 统计 */}
          <div className="song-practice__stats">
            <div className="song-practice__stat">
              <span className="song-practice__stat-label">正确</span>
              <span className="song-practice__stat-value song-practice__stat-value--correct">{stats.correct}</span>
            </div>
            <div className="song-practice__stat">
              <span className="song-practice__stat-label">错误</span>
              <span className="song-practice__stat-value song-practice__stat-value--wrong">{stats.wrong}</span>
            </div>
            <div className="song-practice__stat">
              <span className="song-practice__stat-label">准确率</span>
              <span className="song-practice__stat-value">{accuracy}%</span>
            </div>
          </div>

          {/* 音符导航提示 */}
          <div className="song-practice__hint">
            {isFollowMode
              ? '弹奏当前音符以继续 — 弹对自动前进到下一个音'
              : '自动播放模式 — 跟着节拍弹奏即可'}
          </div>

          {/* 音符预览（下一个 3 个音） */}
          {currentNote && allNotes.length > 0 && (
            <div className="song-practice__preview">
              <span className="song-practice__preview-label">接下来：</span>
              {allNotes.slice(displayPosition, displayPosition + 3).map((note, i) => (
                <span key={i} className="song-practice__preview-note">
                  {note.name}{note.octave}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
