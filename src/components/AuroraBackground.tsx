/**
 * AuroraBackground — Canvas 动态粒子背景
 * ============================================
 * Nocturne 的视觉底座：在深邃的暗色画布上，
 * 漂浮着金色的微光粒子，如同月光下的尘埃。
 *
 * 特征：
 * - Canvas 2D 渲染，高性能 requestAnimationFrame 循环
 * - 粒子有随机大小、速度、透明度
 * - 鼠标移动时粒子产生轻微的视差偏移
 * - 金色调，低透明度，不干扰前景内容
 */

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  opacity: number;
  phase: number;
}

export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();

    // 生成粒子
    const particleCount = Math.min(80, Math.floor((width * height) / 18000));
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: Math.random() * 1.5 + 0.3,
      baseOpacity: Math.random() * 0.4 + 0.1,
      opacity: 0,
      phase: Math.random() * Math.PI * 2,
    }));

    mouseRef.current = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.tx = e.clientX;
      mouseRef.current.ty = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const draw = () => {
      time += 0.003;

      // 平滑鼠标位置
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.03;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.03;

      ctx.clearRect(0, 0, width, height);

      // 绘制径向渐变背景 (light theme: soft warm glow)
      const grad = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        Math.max(width, height) * 0.6,
      );
      grad.addColorStop(0, 'rgba(184, 149, 74, 0.05)');
      grad.addColorStop(0.5, 'rgba(74, 127, 168, 0.02)');
      grad.addColorStop(1, 'rgba(246, 242, 234, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 更新和绘制粒子
      const parallaxX = (mouseRef.current.x - width / 2) * 0.01;
      const parallaxY = (mouseRef.current.y - height / 2) * 0.01;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.01;

        // 边界环绕
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // 呼吸透明度
        p.opacity = p.baseOpacity * (0.5 + 0.5 * Math.sin(p.phase));

        // 视差偏移
        const drawX = p.x + parallaxX;
        const drawY = p.y + parallaxY;

        // 绘制粒子（带光晕）— warm gold on light background
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184, 149, 74, ${p.opacity * 0.6})`;
        ctx.fill();

        // 光晕
        if (p.radius > 1) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.radius * 3, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.radius * 3);
          glow.addColorStop(0, `rgba(184, 149, 74, ${p.opacity * 0.12})`);
          glow.addColorStop(1, 'rgba(184, 149, 74, 0)');
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="aurora-canvas" />
      <div className="aurora-vignette" />
    </>
  );
}
