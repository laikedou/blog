'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'firework' | 'confetti' | 'sparkle';
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  friction: number;
}

interface Burst {
  particles: Particle[];
  age: number;
}

const PALETTES = [
  ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#F8B500'],
  ['#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FBBF24'],
  ['#FF6B6B', '#FF8E72', '#FFA07A', '#FFD93D', '#6BCB77'],
  ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#818CF8'],
  ['#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3', '#FFE4E6'],
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createFireworkBurst(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  const palette = randomFrom(PALETTES);
  const count = 40 + Math.floor(Math.random() * 40);

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const speed = 3 + Math.random() * 7;
    const color = randomFrom(palette);
    const life = 40 + Math.random() * 40;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color,
      type: 'firework',
      rotation: 0,
      rotationSpeed: 0,
      gravity: 0.06,
      friction: 0.985,
    });
  }

  // Add sparkle core
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 15 + Math.random() * 15,
      maxLife: 20,
      size: 1.5 + Math.random() * 2,
      color: '#FFFFFF',
      type: 'sparkle',
      rotation: 0,
      rotationSpeed: 0,
      gravity: 0,
      friction: 0.95,
    });
  }

  return particles;
}

function createConfettiBurst(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  const palette = randomFrom(PALETTES);
  const count = 30 + Math.floor(Math.random() * 20);

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 5 + Math.random() * 10;
    const color = randomFrom(palette);

    particles.push({
      x: x + (Math.random() - 0.5) * 200,
      y: y - Math.random() * 100,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: Math.sin(angle) * speed,
      life: 50 + Math.random() * 50,
      maxLife: 100,
      size: 4 + Math.random() * 6,
      color,
      type: 'confetti',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      gravity: 0.08,
      friction: 0.99,
    });
  }

  return particles;
}

export interface CelebrationHandle {
  firework: (x?: number, y?: number) => void;
  confetti: (x?: number, y?: number) => void;
  celebrate: (x?: number, y?: number) => void;
}

export const CelebrationEffect = forwardRef<CelebrationHandle>(function CelebrationEffect(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstsRef = useRef<Burst[]>([]);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    burstsRef.current = burstsRef.current.filter(b => {
      b.age++;
      return b.particles.some(p => p.life > 0);
    });

    for (const burst of burstsRef.current) {
      for (const p of burst.particles) {
        if (p.life <= 0) continue;
        p.life--;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        const alpha = p.life / p.maxLife;
        const size = p.size * (0.4 + alpha * 0.6);

        ctx.save();
        ctx.globalAlpha = alpha;

        if (p.type === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-size, -size / 3, size * 2, size / 1.5);
        } else if (p.type === 'sparkle') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = size * 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // firework particle with trail
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(0.4, p.color);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Bright core
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    if (burstsRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const addBurst = useCallback((burst: Burst) => {
    burstsRef.current.push(burst);
    if (burstsRef.current.length === 1) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const firework = useCallback((x?: number, y?: number) => {
    const cx = x ?? window.innerWidth / 2;
    const cy = y ?? window.innerHeight / 2;
    addBurst({ particles: createFireworkBurst(cx, cy), age: 0 });
    // Add secondary bursts with slight delay
    setTimeout(() => {
      addBurst({
        particles: createFireworkBurst(
          cx + (Math.random() - 0.5) * 150,
          cy + (Math.random() - 0.5) * 100 - 50,
        ),
        age: 0,
      });
    }, 120);
    setTimeout(() => {
      addBurst({
        particles: createFireworkBurst(
          cx + (Math.random() - 0.5) * 200,
          cy + (Math.random() - 0.5) * 80 - 30,
        ),
        age: 0,
      });
    }, 250);
  }, [addBurst]);

  const confetti = useCallback((x?: number, y?: number) => {
    const cx = x ?? window.innerWidth / 2;
    const cy = y ?? window.innerHeight * 0.3;
    addBurst({ particles: createConfettiBurst(cx, cy), age: 0 });
    setTimeout(() => {
      addBurst({
        particles: createConfettiBurst(cx + (Math.random() - 0.5) * 80, cy),
        age: 0,
      });
    }, 150);
  }, [addBurst]);

  const celebrate = useCallback((x?: number, y?: number) => {
    firework(x, y);
    setTimeout(() => confetti(x, y), 200);
  }, [firework, confetti]);

  useImperativeHandle(ref, () => ({ firework, confetti, celebrate }), [firework, confetti, celebrate]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
});
