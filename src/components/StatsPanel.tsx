/**
 * StatsPanel 组件
 * ============================================
 * 显示训练统计数据：正确率、题数、连击、平均反应时间、历史最高连击。
 */

import type { TrainingStats } from '../types';

interface StatsPanelProps {
  stats: TrainingStats;
  allTimeBestStreak: number;
  onReset: () => void;
}

export function StatsPanel({ stats, allTimeBestStreak, onReset }: StatsPanelProps) {
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const avgReaction =
    stats.reactionCount > 0 ? Math.round(stats.totalReactionTime / stats.reactionCount) : 0;

  const items = [
    {
      label: '正确率',
      value: `${accuracy}%`,
      icon: 'target',
      highlight: accuracy >= 80,
    },
    {
      label: '已完成',
      value: `${stats.total}`,
      sub: `正确 ${stats.correct}`,
      icon: 'check',
    },
    {
      label: '当前连击',
      value: `${stats.streak}`,
      icon: 'fire',
      highlight: stats.streak >= 5,
      animate: stats.streak > 0,
    },
    {
      label: '平均反应',
      value: `${avgReaction}ms`,
      icon: 'clock',
    },
    {
      label: '历史最高',
      value: `${allTimeBestStreak}`,
      icon: 'trophy',
      highlight: true,
    },
  ];

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h3>训练统计</h3>
        <button className="btn-reset" onClick={onReset} title="重新开始统计">
          重置
        </button>
      </div>
      <div className="stats-grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`stat-card ${item.highlight ? 'stat-card--highlight' : ''} ${
              item.animate ? 'stat-card--animate' : ''
            }`}
          >
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
            {item.sub && <div className="stat-sub">{item.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
