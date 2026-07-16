/**
 * App 主组件
 * ============================================
 * 整合所有模块，构建完整的识谱训练界面。
 *
 * 布局结构：
 * ┌──────────────────────────────────────────────┐
 * │  Header（标题 + 帮助 + 主题切换）               │
 * ├──────────────────────────────────────────────┤
 * │                                              │
 * │         Staff（五线谱渲染区域）                 │
 * │                                              │
 * ├──────────────────┬───────────────────────────┤
 * │  Feedback        │  StatsPanel（统计）        │
 * │  Controls        │  SettingsPanel（设置）     │
 * │  VirtualKeyboard │  MidiSelector（MIDI）      │
 * └──────────────────┴───────────────────────────┘
 *
 * 支持单音训练和和弦训练两种模式。
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
import { MilestoneModal } from './components/MilestoneModal';
import { GuideModal } from './components/GuideModal';
import { useTheme } from './hooks/useTheme';
import { useMidi } from './hooks/useMidi';
import { useTraining } from './hooks/useTraining';
import { loadGuideSeen, saveGuideSeen } from './lib/storage';
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const midi = useMidi();
  const training = useTraining();

  // 新手引导状态：首次访问自动弹出
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

  // 使用 ref 始终持有最新的 training 状态，避免回调闭包过期
  const trainingRef = useRef(training);
  trainingRef.current = training;

  // 注册 MIDI 按键回调（仅注册一次）
  useEffect(() => {
    midi.onNote((note, _velocity, isNoteOn) => {
      if (isNoteOn && trainingRef.current.isTraining) {
        trainingRef.current.submitAnswer(note);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app" data-theme={theme}>
      <Header theme={theme} onToggleTheme={toggleTheme} onShowGuide={() => setGuideVisible(true)} />

      <main className="app-main">
        {/* 左侧：五线谱 + 反馈 + 控制 */}
        <section className="app-practice">
          <div className="staff-wrapper">
            <Staff
              note={training.currentNote}
              chord={training.currentChord}
              playedIndices={training.playedIndices}
              answerState={training.answerState}
              clefMode={training.config.clef}
              showLabel={training.answerState === 'revealed'}
              alwaysShowLabel={training.config.showNoteLabel}
              theme={theme}
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
            onReveal={training.revealAnswer}
            onNext={training.nextQuestion}
            onRetry={training.retry}
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

          {/* 虚拟键盘（无 MIDI 设备时的备选方案） */}
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
        </section>

        {/* 右侧：统计 + 设置 + MIDI */}
        <aside className="app-sidebar">
          <StatsPanel
            stats={training.stats}
            allTimeBestStreak={training.allTimeBestStreak}
            onReset={training.resetStats}
          />

          <SettingsPanel config={training.config} onUpdate={training.updateConfig} />

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
        </aside>
      </main>

      <footer className="app-footer">
        <p>识谱大师 · 基于 Web MIDI API + VexFlow 构建 · 支持单音/和弦训练，后续可扩展音程、节奏等模块</p>
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
