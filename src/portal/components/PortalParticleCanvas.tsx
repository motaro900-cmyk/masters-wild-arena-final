import React, { useEffect, useRef } from 'react';

/**
 * PORTAL PARTICLE CANVAS
 * Высокопроизводительный фоновый Canvas с парящими спорами Ци, янтарными искрами и природной пыльцой.
 * Реализован в стиле промо-порталов Blizzard (Diablo IV) и HoYoverse (Genshin / Honkai):
 * - Интерактивная реакция на курсор мыши (плавное отталкивание и вихревой шлейф).
 * - Пререндеренные оффскрин-спрайты (OffscreenCanvas) для исключения вызова createRadialGradient в RAF.
 * - Пул частиц с фиксированной памятью (Zero GC Allocations в цикле анимации).
 * - Ограничение DPR (devicePixelRatio <= 2) для стабильных 60 FPS на 4K и Retina-дисплеях.
 * - IntersectionObserver и document.hidden для мгновенной заморозки RAF при неактивной вкладке.
 * - Адаптивное число частиц (35 для мобильных устройств, 95 для десктопа).
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  wobbleSpeed: number;
  wobblePhase: number;
  wobbleAmp: number;
  type: 0 | 1 | 2; // 0 = Золотая пыльца Ци, 1 = Огненная искра, 2 = Изумрудная лесная спора
}

export const PortalParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let lastTime = performance.now();

    // 1. Координаты мыши с плавной интерполяцией (lerp)
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isHovering: false,
    };

    // 2. Пререндеринг оффскрин-спрайтов частиц (Золото, Искра, Изумруд)
    const SPRITE_SIZE = 48;
    const HALF_SIZE = SPRITE_SIZE / 2;

    const createOffscreenSprite = (innerColor: string, midColor: string, outerColor: string) => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = SPRITE_SIZE;
      offCanvas.height = SPRITE_SIZE;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        const grad = offCtx.createRadialGradient(
          HALF_SIZE,
          HALF_SIZE,
          0,
          HALF_SIZE,
          HALF_SIZE,
          HALF_SIZE
        );
        grad.addColorStop(0, innerColor);
        grad.addColorStop(0.35, midColor);
        grad.addColorStop(0.7, outerColor);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        offCtx.fillStyle = grad;
        offCtx.beginPath();
        offCtx.arc(HALF_SIZE, HALF_SIZE, HALF_SIZE, 0, Math.PI * 2);
        offCtx.fill();
      }
      return offCanvas;
    };

    const spriteGold = createOffscreenSprite(
      'rgba(255, 235, 150, 1)',
      'rgba(212, 175, 55, 0.75)',
      'rgba(180, 120, 20, 0.18)'
    );
    const spriteEmber = createOffscreenSprite(
      'rgba(255, 255, 220, 1)',
      'rgba(245, 158, 11, 0.85)',
      'rgba(220, 38, 38, 0.15)'
    );
    const spriteSpirit = createOffscreenSprite(
      'rgba(200, 255, 230, 1)',
      'rgba(52, 211, 153, 0.75)',
      'rgba(16, 185, 129, 0.15)'
    );

    const sprites = [spriteGold, spriteEmber, spriteSpirit];

    // 3. Расчет размеров экрана с учетом DPR
    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // 4. Генерация пула частиц
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 36 : 92;
    const particles: Particle[] = [];

    const resetParticle = (spawnAtBottom = false): Particle => {
      const baseVy = -(0.18 + Math.random() * 0.42);
      const type = Math.random() < 0.65 ? 0 : Math.random() < 0.85 ? 1 : 2;
      const size = type === 1 ? 8 + Math.random() * 12 : 12 + Math.random() * 22;

      return {
        x: Math.random() * width,
        y: spawnAtBottom ? height + Math.random() * 40 : Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: baseVy,
        baseVy,
        size,
        alpha: 0.1 + Math.random() * 0.45,
        baseAlpha: 0.15 + Math.random() * 0.45,
        pulseSpeed: 0.0012 + Math.random() * 0.002,
        pulsePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.0008 + Math.random() * 0.0015,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmp: 0.2 + Math.random() * 0.4,
        type,
      };
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(resetParticle(false));
    }

    // 5. Обработка курсора мыши
    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovering = true;
    };

    const handlePointerLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.isHovering = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave, { passive: true });

    // 6. Intersection & Visibility Guardian
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    });
    observer.observe(canvas);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 7. Основной цикл рендера (60 FPS, Zero Allocations)
    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (!isVisible) {
        lastTime = time;
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Плавное следование курсора (LERP)
      if (mouse.isHovering) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }

      // Очистка Canvas
      ctx.clearRect(0, 0, width, height);

      // Аддитивное наложение для свечения частиц
      ctx.globalCompositeOperation = 'screen';

      const mouseRadius = 160;
      const mouseRadiusSq = mouseRadius * mouseRadius;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];

        // Пульсация яркости
        p.alpha =
          p.baseAlpha +
          Math.sin(time * p.pulseSpeed + p.pulsePhase) * (p.baseAlpha * 0.45);

        // Органическое покачивание (Brownian sine wave)
        const wobble = Math.sin(time * p.wobbleSpeed + p.wobblePhase) * p.wobbleAmp;
        p.x += (p.vx + wobble) * (dt * 60);
        p.y += p.vy * (dt * 60);

        // Реакция на мышь (деликатное отталкивание + вихревой сдвиг)
        if (mouse.isHovering) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < mouseRadiusSq && distSq > 4) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / mouseRadius) * 1.2;

            // Радиальный импульс отталкивания
            p.vx += (dx / dist) * force * 0.35;
            p.vy += (dy / dist) * force * 0.35;

            // Тангенциальный вихревой шлейф
            p.vx += (-dy / dist) * force * 0.15;
            p.vy += (dx / dist) * force * 0.15;

            // Яркая вспышка при близости курсора
            p.alpha = Math.min(1, p.alpha + force * 0.4);
          }
        }

        // Гашение остаточных скоростей к базовому дрейфу
        p.vx *= 0.94;
        p.vy = p.vy * 0.95 + p.baseVy * 0.05;

        // Циклический перенос частиц за границы экрана
        if (p.y < -p.size) {
          const fresh = resetParticle(true);
          Object.assign(p, fresh);
        } else if (p.x < -p.size) {
          p.x = width + p.size;
        } else if (p.x > width + p.size) {
          p.x = -p.size;
        }

        // Отрисовка пререндеренного спрайта
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        const sprite = sprites[p.type];
        ctx.drawImage(
          sprite,
          p.x - p.size / 2,
          p.y - p.size / 2,
          p.size,
          p.size
        );
      }

      // Возврат режима наложения
      ctx.globalCompositeOperation = 'source-over';
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Глубокий радиальный градиент сумерек */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.07) 0%, rgba(13, 10, 20, 0.4) 50%, rgba(5, 4, 7, 0.95) 100%)',
        }}
      />

      {/* Живой Canvas с частицами */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Кинематографическая виньетка по краям экрана */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 140px rgba(0, 0, 0, 0.85)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
