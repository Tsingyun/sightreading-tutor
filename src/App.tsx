/**
 * App 主组件
 * ============================================
 * 整合所有模块，构建完整的识谱训练界面。
 *
 * 四种应用模式：
 * - training: 识谱训练（单音/和弦出题，判定对错）
 * - freeplay: 自由弹奏（实时显示音符、识别和弦与转位）
 * - rhythm: 节奏训练（节拍器 + 节奏型 + 敲击评分）
 * - song: 乐曲练习（内置曲库 + MIDI 导入 + 跟弹模式）
 *
 * 首次访问自动弹出新手引导。
 */

import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Staff } from './components/Staff';
import { StatsPanel } from './components/StatsPanel';
import { MidiSelector } from './components/MidiSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { Feedback } from './components/Feedback';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { FreePlay } from './components/FreePlay';
import { RhythmTrainer } from './components/RhythmTrainer';
import { SongPractice } from './components/SongPractice';
import { MilestoneModal } from './components/MilestoneModal';
import { GuideModal } from './components/GuideModal';
import { useTheme } from './hooks/useTheme';
import { useMidi } from './hooks/useMidi';
import { useTraining } from './hooks/useTraining';
import { useFreePlay } from './hooks/useFreePlay';
import { useSongPractice } from './hooks/useSongPractice';
import { usePianoSound } from './hooks/usePianoSound';
import { getKeySignatureConfig } from './lib/music';
import { loadGuideSeen, saveGuideSeen } from './lib/storage';
import type { AppMode } from './types';
import './App.css';

function App() {
  const { theme } = useTheme();
  const midi = useMidi();
  const training = useTraining();
  const freePlay = useFreePlay();
  const songPractice = useSongPractice();
  const pianoSound = usePianoSound();

  const [appMode, setAppMode] = useState<AppMode>('training');
  const [guideVisible, setGuideVisible] = useState(false);

  useEffect(() => {
    if (!loadGuideSeen()) {
      setGuideVisible(true);
    }
  }, []);

  const handleGuideClose = () => {
    setGuideVisible(false);
    saveGuideSeen();
  };

  // 使用 ref 始终持有最新状态，避免 MIDI 回调闭包过期
  const trainingRef = useRef(training);
  trainingRef.current = training;
  const freePlayRef = useRef(freePlay);
  freePlayRef.current = freePlay;
  const songPracticeRef = useRef(songPractice);
  songPracticeRef.current = songPractice;
  const pianoSoundRef = useRef(pianoSound);
  pianoSoundRef.current = pianoSound;
  const appModeRef = useRef(appMode);
  appModeRef.current = appMode;

  // 注册 MIDI 按键回调（仅注册一次）
  useEffect(() => {
    midi.onNote((note, velocity, isNoteOn) => {
      const mode = appModeRef.current;
      // 所有模式：MIDI 按键均发声（自由弹奏用持续音，其他用短促音）
      if (isNoteOn) {
        if (mode === 'freeplay') {
          pianoSoundRef.current.noteOn(note, velocity || 0.7);
        } else {
          pianoSoundRef.current.playNote(note, velocity || 0.7);
        }
      } else if (mode === 'freeplay') {
        pianoSoundRef.current.noteOff(note);
      }

      if (mode === 'freeplay') {
        if (isNoteOn) {
          freePlayRef.current.handleNoteOn(note);
        } else {
          freePlayRef.current.handleNoteOff(note);
        }
      } else if (mode === 'song') {
        if (isNoteOn) {
          songPracticeRef.current.submitAnswer(note);
        }
      } else {
        // training mode
        if (isNoteOn && trainingRef.current.isTraining) {
          trainingRef.current.submitAnswer(note);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 虚拟键盘按键处理
  const handleVirtualKeyPress = (midiNote: number) => {
    if (appMode === 'freeplay') {
      if (freePlay.activeNotes.includes(midiNote)) {
        // 松开：停止声音
        pianoSound.noteOff(midiNote);
        freePlay.handleNoteOff(midiNote);
      } else {
        // 按下：播放持续音
        pianoSound.noteOn(midiNote);
        freePlay.handleNoteOn(midiNote);
      }
    } else if (appMode === 'song') {
      // 乐曲模式：短促音
      pianoSound.playNote(midiNote);
      songPractice.submitAnswer(midiNote);
    } else {
      // 训练模式：短促音
      pianoSound.playNote(midiNote);
      training.submitAnswer(midiNote);
    }
  };

  // 获取调号的 VexFlow 格式
  const keySigVex = training.config.keySignature
    ? getKeySignatureConfig(training.config.keySignature).vexKey
    : 'C';

  return (
    <div className="app" data-theme={theme}>
      <Header
        onShowGuide={() => setGuideVisible(true)}
        soundEnabled={pianoSound.enabled}
        onToggleSound={pianoSound.toggle}
      />

      <main className="app-main">
        {/* 左侧：主练习区域 */}
        <section className="app-practice">
          {/* 模式切换 */}
          <div className="mode-toggle">
            <button
              className={`mode-toggle__btn ${appMode === 'training' ? 'mode-toggle__btn--active' : ''}`}
              onClick={() => setAppMode('training')}
            >
              🎵 识谱训练
            </button>
            <button
              className={`mode-toggle__btn ${appMode === 'freeplay' ? 'mode-toggle__btn--active' : ''}`}
              onClick={() => setAppMode('freeplay')}
            >
              🎹 自由弹奏
            </button>
            <button
              className={`mode-toggle__btn ${appMode === 'rhythm' ? 'mode-toggle__btn--active' : ''}`}
              onClick={() => setAppMode('rhythm')}
            >
              🥁 节奏训练
            </button>
            <button
              className={`mode-toggle__btn ${appMode === 'song' ? 'mode-toggle__btn--active' : ''}`}
              onClick={() => setAppMode('song')}
            >
              🎼 乐曲练习
            </button>
          </div>

          {appMode === 'training' && (
            <>
              {/* —— 训练模式 —— */}
              <div className="staff-wrapper">
                <Staff
                  note={training.currentNote}
                  chord={training.currentChord}
                  playedIndices={training.playedIndices}
                  answerState={training.answerState}
                  clefMode={training.config.clef}
                  showLabel={training.answerState === 'revealed'}
                  alwaysShowLabel={training.config.showNoteLabel}
                  flashLabel={training.flashLabel}
                  theme={theme}
                  keySignature={keySigVex}
                />
              </div>

              <Feedback
                answerState={training.answerState}
                currentNote={training.currentNote}
                currentChord={training.currentChord}
                pressedNote={training.pressedNote}
                mode={training.config.mode}
                playedIndices={training.playedIndices}
                wrongNote={training.wrongNote}
                hintLevel={training.hintLevel}
                hintText={training.hintText}
                onReveal={training.revealAnswer}
                onNext={training.nextQuestion}
                onRetry={training.retry}
                onHint={training.requestHint}
              />

              <div className="practice-controls">
                {!training.isTraining ? (
                  <button className="btn-primary btn-large" onClick={training.startTraining}>
                    开始训练
                  </button>
                ) : (
                  <div className="practice-controls__active">
                    <button className="btn-secondary" onClick={training.skipQuestion}>
                      跳过
                    </button>
                    <button className="btn-secondary btn-danger" onClick={training.stopTraining}>
                      停止训练
                    </button>
                  </div>
                )}
              </div>

              <VirtualKeyboard
                currentNote={training.currentNote}
                currentChord={training.currentChord}
                answerState={training.answerState}
                pressedNote={training.pressedNote}
                playedIndices={training.playedIndices}
                wrongNote={training.wrongNote}
                mode={training.config.mode}
                range={{ low: training.config.lowNote, high: training.config.highNote }}
                onKeyPress={training.submitAnswer}
                disabled={!training.isTraining}
              />
            </>
          )}

          {appMode === 'freeplay' && (
            <FreePlay
              activeNotes={freePlay.activeNotes}
              displayedNotes={freePlay.displayedNotes}
              chordInfo={freePlay.chordInfo}
              theme={theme}
              onVirtualKeyPress={handleVirtualKeyPress}
              onClear={freePlay.clearAll}
            />
          )}

          {appMode === 'rhythm' && (
            <RhythmTrainer onVirtualKeyPress={handleVirtualKeyPress} />
          )}

          {appMode === 'song' && (
            <SongPractice onVirtualKeyPress={handleVirtualKeyPress} />
          )}
        </section>

        {/* 右侧：统计 + 设置 + MIDI */}
        <aside className="app-sidebar">
          {appMode === 'training' && (
            <>
              <StatsPanel
                stats={training.stats}
                allTimeBestStreak={training.allTimeBestStreak}
                onReset={training.resetStats}
              />
              <SettingsPanel config={training.config} onUpdate={training.updateConfig} />
            </>
          )}

          <MidiSelector
            supported={midi.supported}
            connected={midi.connected}
            connecting={midi.connecting}
            error={midi.error}
            devices={midi.devices}
            selectedDeviceId={midi.selectedDeviceId}
            lastNote={midi.lastNote}
            onConnect={midi.connect}
            onSelect={midi.selectDevice}
          />

          {appMode === 'freeplay' && (
            <div className="freeplay-sidebar-info">
              <h3>自由弹奏说明</h3>
              <ul>
                <li>弹奏 MIDI 键盘，音符实时显示在五线谱上</li>
                <li>同时按下多个音，自动识别和弦名称与转位</li>
                <li>点击虚拟键盘可切换音符的按下/松开</li>
                <li>支持三和弦、七和弦、挂留和弦等识别</li>
                <li>转位判定基于最低音（贝斯音）</li>
              </ul>
            </div>
          )}

          {appMode === 'rhythm' && (
            <div className="freeplay-sidebar-info">
              <h3>节奏训练说明</h3>
              <ul>
                <li>调节 BPM 和拍号，开始节拍器</li>
                <li>练习模式：跟着节拍敲击（空格键或按钮）</li>
                <li>挑战模式：听一遍节奏型，然后凭记忆复现</li>
                <li>±100ms 完美 / ±200ms 良好 / ±300ms 一般</li>
                <li>统计准确率，追踪进步</li>
              </ul>
            </div>
          )}

          {appMode === 'song' && (
            <div className="freeplay-sidebar-info">
              <h3>乐曲练习说明</h3>
              <ul>
                <li>从乐曲库选择经典曲目，或导入 MIDI 文件</li>
                <li>跟弹模式：弹对当前音才前进</li>
                <li>自动播放：按节拍自动前进</li>
                <li>支持 0.5x / 0.75x / 1x 速度调节</li>
                <li>实时统计正确率和进度</li>
              </ul>
            </div>
          )}
        </aside>
      </main>

      <footer className="app-footer">
        <div className="app-footer__meta">
          <span>Edition: Vol 1.0</span>
          <span className="app-footer__divider">·</span>
          <span>基于 Web MIDI API + VexFlow 构建</span>
          <span className="app-footer__divider">·</span>
          <span>识谱 / 自由弹奏 / 节奏 / 乐曲</span>
        </div>
        <p className="app-footer__copyright">© {new Date().getFullYear()} 识谱大师 — All Rights Reserved</p>
      </footer>

      {/* 100 题里程碑弹窗 */}
      <MilestoneModal
        visible={training.milestoneReached}
        value={training.milestoneValue}
        onClose={training.dismissMilestone}
      />

      {/* 新手引导弹窗 */}
      <GuideModal visible={guideVisible} onClose={handleGuideClose} />
    </div>
  );
}

export default App;
