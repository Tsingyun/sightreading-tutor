/**
 * MilestoneModal 组件（Toast 模式）
 * ============================================
 * 完成 100 题（及每 100 题的倍数）时在右下角弹出 Toast 提示。
 * 自动淡出，不打断练习节奏。
 */

import { useEffect, useState } from 'react';

interface MilestoneModalProps {
  /** 是否显示 */
  visible: boolean;
  /** 里程碑题数（如 100, 200...） */
  value: number;
  /** 关闭（由自动定时器触发） */
  onClose: () => void;
}

/** Toast 自动消失时间（毫秒） */
const TOAST_DURATION = 4000;

export function MilestoneModal({ visible, value, onClose }: MilestoneModalProps) {
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setRender(true);
      // 下一帧触发进入动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShow(true));
      });
      // 自动消失
      const timer = setTimeout(() => {
        setShow(false);
        // 等淡出动画完成后卸载
        setTimeout(onClose, 400);
      }, TOAST_DURATION);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      const timer = setTimeout(() => setRender(false), 400);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!render) return null;

  return (
    <div className={`milestone-toast ${show ? 'milestone-toast--visible' : ''}`}>
      <div className="milestone-toast__emoji">🎉</div>
      <div className="milestone-toast__body">
        <div className="milestone-toast__title">里程碑达成！</div>
        <div className="milestone-toast__desc">
          已完成 <strong>{value}</strong> 道练习题
        </div>
      </div>
    </div>
  );
}
