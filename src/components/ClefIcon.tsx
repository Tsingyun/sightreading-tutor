/**
 * ClefIcon 组件
 * ============================================
 * 使用 Noto Music 字体渲染高音谱号（𝄞）和低音谱号（𝄢）。
 * 字体通过 Google Fonts 在 index.html 中加载。
 */

interface ClefIconProps {
  type: 'treble' | 'bass';
  size?: number;
  className?: string;
}

export function ClefIcon({ type, size = 24, className }: ClefIconProps) {
  // 𝄞 = U+1D11E (高音谱号/G clef)
  // 𝄢 = U+1D122 (低音谱号/F clef)
  const char = type === 'treble' ? '𝄞' : '𝄢';

  return (
    <span
      className={className}
      style={{
        fontFamily: "'Noto Music', 'Bravura', serif",
        fontSize: `${size}px`,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {char}
    </span>
  );
}
