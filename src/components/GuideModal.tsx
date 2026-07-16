/**
 * GuideModal 组件
 * ============================================
 * 新手引导弹窗：分步介绍五线谱基础知识。
 * 首次访问时自动弹出，之后可通过"帮助"按钮重新打开。
 */

import { useEffect, useState } from 'react';
import { ClefIcon } from './ClefIcon';

interface GuideModalProps {
  visible: boolean;
  onClose: () => void;
}

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

/** 高音谱号线上音名口诀 */
const TREBLE_LINES = ['E', 'G', 'B', 'D', 'F'];
/** 高音谱号间内音名 */
const TREBLE_SPACES = ['F', 'A', 'C', 'E'];

const STEPS: GuideStep[] = [
  {
    icon: '🎵',
    title: '欢迎使用识谱大师！',
    content: (
      <>
        <p>这是一个帮助你<strong>学习五线谱识谱</strong>的互动工具。</p>
        <p>通过反复练习，你将逐步掌握在五线谱上快速认出音符的能力。</p>
        <p>接下来，让我们花 1 分钟了解五线谱的基础知识。</p>
      </>
    ),
  },
  {
    icon: <ClefIcon type="treble" size={48} />,
    title: '五线谱的构成',
    content: (
      <>
        <p>五线谱由<strong>五条线</strong>和四个<strong>间</strong>组成。</p>
        <div className="guide-staff-demo">
          <svg viewBox="0 0 300 120" className="guide-svg">
            {/* 五条线 */}
            {[30, 45, 60, 75, 90].map((y, i) => (
              <line key={i} x1="20" y1={y} x2="280" y2={y} stroke="currentColor" strokeWidth="1.5" />
            ))}
            {/* 标注线和间 */}
            <text x="285" y="34" fontSize="11" fill="var(--text-secondary)">第1线</text>
            <text x="285" y="49" fontSize="11" fill="var(--text-secondary)">第1间</text>
            <text x="285" y="64" fontSize="11" fill="var(--text-secondary)">第3线</text>
            <text x="285" y="79" fontSize="11" fill="var(--text-secondary)">第3间</text>
            <text x="285" y="94" fontSize="11" fill="var(--text-secondary)">第5线</text>
            {/* 高音谱号 - Noto Music 字体 */}
            <text x="18" y="88" fontSize="56" fill="var(--accent)" style={{ fontFamily: "'Noto Music', serif" }}>𝄞</text>
          </svg>
        </div>
        <p>从<strong>下往上</strong>数：最下面是第 1 线，最上面是第 5 线。</p>
        <p>音符可以画在<strong>线上</strong>，也可以画在<strong>线与线之间的间内</strong>。</p>
      </>
    ),
  },
  {
    icon: '📝',
    title: '高音谱号：线上的音',
    content: (
      <>
        <p>高音谱号（<span style={{ fontFamily: "'Noto Music', serif" }}>𝄞</span>）五条线上的音，从下到上依次是：</p>
        <div className="guide-staff-demo">
          <svg viewBox="0 0 300 120" className="guide-svg">
            {[30, 45, 60, 75, 90].map((y, i) => (
              <line key={i} x1="20" y1={y} x2="280" y2={y} stroke="currentColor" strokeWidth="1.5" />
            ))}
            {/* 高音谱号 - Noto Music 字体 */}
            <text x="18" y="88" fontSize="56" fill="var(--accent)" style={{ fontFamily: "'Noto Music', serif" }}>𝄞</text>
            {/* 线上的音符 */}
            {TREBLE_LINES.map((note, i) => {
              const y = 90 - i * 15;
              return (
                <g key={i}>
                  <ellipse cx={80 + i * 45} cy={y} rx="8" ry="6" fill="var(--accent)" />
                  <text x={80 + i * 45 - 5} y={y - 12} fontSize="14" fontWeight="bold" fill="var(--accent)">{note}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <p>口诀：<strong>Every Good Boy Does Fine</strong></p>
        <p>（E G B D F —— 每个好男孩都做得好）</p>
      </>
    ),
  },
  {
    icon: '📝',
    title: '高音谱号：间内的音',
    content: (
      <>
        <p>四个间内的音，从下到上依次是：</p>
        <div className="guide-staff-demo">
          <svg viewBox="0 0 300 120" className="guide-svg">
            {[30, 45, 60, 75, 90].map((y, i) => (
              <line key={i} x1="20" y1={y} x2="280" y2={y} stroke="currentColor" strokeWidth="1.5" />
            ))}
            {/* 高音谱号 - Noto Music 字体 */}
            <text x="18" y="88" fontSize="56" fill="var(--accent)" style={{ fontFamily: "'Noto Music', serif" }}>𝄞</text>
            {/* 间内的音符 */}
            {TREBLE_SPACES.map((note, i) => {
              const y = 82 - i * 15;
              return (
                <g key={i}>
                  <ellipse cx={80 + i * 45} cy={y} rx="8" ry="6" fill="var(--accent)" />
                  <text x={80 + i * 45 - 5} y={y - 12} fontSize="14" fontWeight="bold" fill="var(--accent)">{note}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <p>口诀：<strong>FACE</strong>（即英文单词"面孔"）</p>
        <p>（F A C E —— 最容易记的音名口诀）</p>
      </>
    ),
  },
  {
    icon: '🎹',
    title: '开始练习吧！',
    content: (
      <>
        <p>现在你已经知道了五线谱的基本知识！</p>
        <div className="guide-tips">
          <div className="guide-tip">
            <span className="guide-tip-icon">🎚️</span>
            <span><strong>从入门难度开始</strong>：先只练 C D E F G 五个音，熟练后逐步升级</span>
          </div>
          <div className="guide-tip">
            <span className="guide-tip-icon">🏷️</span>
            <span><strong>开启音名提示</strong>：练习时在五线谱上显示音名，帮助建立对应关系</span>
          </div>
          <div className="guide-tip">
            <span className="guide-tip-icon">🎹</span>
            <span><strong>没有 MIDI 键盘？</strong>可以用页面下方的虚拟键盘点击练习</span>
          </div>
          <div className="guide-tip">
            <span className="guide-tip-icon">🔄</span>
            <span><strong>答错没关系</strong>：选择"允许继续尝试"模式，错了可以重新弹</span>
          </div>
        </div>
        <p>准备好了吗？点击"开始训练"即可出发！</p>
      </>
    ),
  },
];

export function GuideModal({ visible, onClose }: GuideModalProps) {
  const [step, setStep] = useState(0);

  // 弹窗打开时重置到第一步
  useEffect(() => {
    if (visible) setStep(0);
  }, [visible]);

  // 按 ESC 键关闭
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* 步骤指示器 */}
        <div className="guide-progress">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`guide-dot ${i === step ? 'guide-dot--active' : ''} ${i < step ? 'guide-dot--done' : ''}`}
            />
          ))}
        </div>

        {/* 关闭按钮 */}
        <button className="guide-close" onClick={onClose} aria-label="关闭">×</button>

        {/* 内容区 */}
        <div className="guide-content">
          <div className="guide-icon">{current.icon}</div>
          <h2 className="guide-title">{current.title}</h2>
          <div className="guide-body">{current.content}</div>
        </div>

        {/* 底部按钮 */}
        <div className="guide-footer">
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>
              上一步
            </button>
          )}
          <div className="guide-footer-spacer" />
          {isLast ? (
            <button className="btn-primary btn-large" onClick={onClose}>
              开始学习
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
