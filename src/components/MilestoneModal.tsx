/**
 * MilestoneModal 组件
 * ============================================
 * 完成 100 题（及每 100 题的倍数）时弹出庆祝弹窗。
 * 显示已完成的题数和正确率，可关闭继续训练。
 */

import { useEffect } from 'react';

interface MilestoneModalProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 里程碑题数（如 100, 200...） */
  value: number;
  /** 关闭弹窗 */
  onClose: () => void;
}

export function MilestoneModal({ visible, value, onClose }: MilestoneModalProps) {
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

  return (
    <div className="milestone-overlay" onClick={onClose}>
      <div className="milestone-modal" onClick={(e) => e.stopPropagation()}>
        <div className="milestone-emoji">🎉</div>
        <h2 className="milestone-title">恭喜达成里程碑！</h2>
        <p className="milestone-desc">
          你已经完成了 <strong>{value}</strong> 道练习题
        </p>
        <p className="milestone-subdesc">继续努力，识谱能力正在不断提升！</p>
        <button className="btn-primary btn-large milestone-btn" onClick={onClose}>
          继续训练
        </button>
      </div>
    </div>
  );
}
