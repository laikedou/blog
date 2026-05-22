# Homepage & Experiments Immersive Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-layout and re-style the homepage and experiments pages with immersive cinematic effects (particle backgrounds, cursor-aware glows, 3D depth, scroll-triggered reveals, lab-themed atmospheres) without modifying any API calls, data logic, component interfaces, or i18n keys.

**Architecture:** Append new CSS keyframes and utility classes (the existing ones already cover float, pulse-glow, shimmer, spin-slow, breathe, gradient-shift). Then enhance shared components (PostCard deeper tilt, PerspectiveCard top stripe + inset panels). Then rewrite page layouts top-to-bottom keeping all hooks and data flow exactly as-is.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, animejs, shadcn/ui, lucide-react, next-intl

---

### Task 1: CSS Foundation — New Immersive Keyframes and Utilities

**Files:**
- Modify: `frontend/src/app/[locale]/globals.css`

**Note:** Many keyframes already exist (float, pulse-glow, shimmer, spin-slow, breathe, gradient-shift, draw-line, count-up, node-pulse, chain-glow). Many utilities already exist (.shimmer, .animate-float, .gradient-text, .gradient-border-glow, .wireframe-sphere, .scroll-progress, .back-to-top, etc.). Only add what's new.

- [ ] **Step 1: Add new keyframes after the chain-glow block**

Find `@keyframes chain-glow {` block (currently lines 275-278) and append after it:

```css
@keyframes particle-float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
  25% { transform: translate(15px, -20px) scale(1.2); opacity: 0.6; }
  50% { transform: translate(-10px, -40px) scale(0.8); opacity: 0.4; }
  75% { transform: translate(-20px, -10px) scale(1.1); opacity: 0.5; }
}

@keyframes particle-float-slow {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
  33% { transform: translate(30px, -30px) scale(1.3); opacity: 0.5; }
  66% { transform: translate(-20px, -50px) scale(0.7); opacity: 0.3; }
}

@keyframes orbit-rotate {
  from { transform: rotateX(60deg) rotateZ(0deg); }
  to { transform: rotateX(60deg) rotateZ(360deg); }
}

@keyframes stripe-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes lab-float-1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(20px, -15px) rotate(5deg); }
}

@keyframes lab-float-2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-15px, -25px) rotate(-3deg); }
}

@keyframes lab-float-3 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(25px, -10px) rotate(8deg); }
}
```

- [ ] **Step 2: Add new utility classes at end of file**

Append after the `.back-to-top.visible` block (currently at line 915):

```css
/* ── New immersive utilities ── */

/* Particle field */
.particle-field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.particle-dot {
  position: absolute;
  border-radius: 50%;
}
.particle-dot.fast { animation: particle-float 5s ease-in-out infinite; }
.particle-dot.slow { animation: particle-float-slow 8s ease-in-out infinite; }

/* Orbiting accent rings */
.orbit-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(76, 215, 246, 0.06);
  animation: orbit-rotate 35s linear infinite;
  pointer-events: none;
  top: 50%;
  left: 50%;
  transform-origin: center center;
}

/* Cursor glow */
.cursor-glow {
  position: fixed;
  width: 450px;
  height: 450px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 215, 246, 0.05) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

/* Magnetic button */
.magnetic-btn {
  transition: transform 0.2s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.3s ease;
}
.magnetic-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 0 28px rgba(76, 215, 246, 0.15);
}

/* Topic zone backgrounds */
.topic-bg-ai {
  background-image:
    radial-gradient(circle at 20% 30%, rgba(175, 198, 255, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 60% 70%, rgba(175, 198, 255, 0.04) 1px, transparent 1px),
    radial-gradient(circle at 80% 20%, rgba(221, 183, 255, 0.05) 1px, transparent 1px);
  background-size: 30px 30px, 50px 50px, 40px 40px;
}
.topic-bg-web3 {
  background-image:
    radial-gradient(circle at 30% 40%, rgba(76, 215, 246, 0.05) 1.5px, transparent 1.5px),
    radial-gradient(circle at 70% 60%, rgba(76, 215, 246, 0.03) 1px, transparent 1px);
  background-size: 45px 45px, 60px 60px;
}
.topic-bg-blockchain {
  background-image:
    linear-gradient(rgba(255, 180, 171, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 180, 171, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Section heading underline */
.heading-underline {
  position: relative;
  display: inline-block;
}
.heading-underline::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #4cd7f6, #afc6ff);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.heading-underline:hover::after {
  width: 100%;
}

/* Filter pill */
.filter-pill {
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #8c90a0;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;
}
.filter-pill:hover {
  border-color: rgba(76, 215, 246, 0.2);
  color: #dae2fd;
}
.filter-pill.active {
  background: rgba(76, 215, 246, 0.12);
  border-color: rgba(76, 215, 246, 0.25);
  color: #4cd7f6;
  box-shadow: 0 0 14px rgba(76, 215, 246, 0.1);
}

/* Perspective card top stripe */
.perspective-stripe {
  height: 3px;
  background-size: 200% 100%;
}
.group:hover .perspective-stripe {
  animation: stripe-shift 3s linear infinite;
}

/* Perspective row inside card */
.perspective-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background 0.2s ease;
}
.perspective-row:hover {
  background: rgba(23, 31, 51, 0.6);
}
.perspective-arrow {
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}
.perspective-row:hover .perspective-arrow {
  opacity: 1;
}

/* Lab floating shapes */
.lab-shape {
  position: absolute;
  border: 2px solid rgba(76, 215, 246, 0.05);
  pointer-events: none;
}
.lab-shape.square {
  border-radius: 16px;
  animation: lab-float-1 8s ease-in-out infinite;
}
.lab-shape.circle {
  border-radius: 50%;
  animation: lab-float-2 10s ease-in-out infinite;
}
.lab-shape.hex {
  border-radius: 10px;
  animation: lab-float-3 9s ease-in-out infinite;
}

/* Stats counter */
.stat-number {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

/* Pill switcher (for experiment detail tabs) */
.pill-switcher {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: rgba(23, 31, 51, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.pill-tab {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #8c90a0;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}
.pill-tab:hover {
  color: #dae2fd;
}
.pill-tab.active {
  background: rgba(76, 215, 246, 0.12);
  color: #4cd7f6;
  box-shadow: 0 0 14px rgba(76, 215, 246, 0.12);
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/[locale]/globals.css
git commit -m "feat: add immersive CSS keyframes and utilities for cinematic homepage/experiments redesign"
```

---

### Task 2: Enhance PostCard — Deeper 3D Tilt

**Files:**
- Modify: `frontend/src/components/PostCard.tsx`

**Logic preserved:** PostCardProps interface, date formatting, all link hrefs, image onError, animejs entrance animation, featured variant.

- [ ] **Step 1: Update handleMouseMove for deeper perspective + shadow**

Find `handleMouseMove` (around line 45-54) and replace the `setTiltStyle` call:

```tsx
const handleMouseMove = useCallback((e: React.MouseEvent) => {
  const el = cardRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  setTiltStyle({
    transform: `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`,
    boxShadow: `${x * 6}px ${y * 6}px 24px rgba(0,0,0,0.25)`,
    transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
  });
}, []);
```

This changes `x * 4` to `x * 6` (deeper rotation) and adds `boxShadow`.

- [ ] **Step 2: Update handleMouseLeave to reset shadow**

Replace `handleMouseLeave`:

```tsx
const handleMouseLeave = useCallback(() => {
  setTiltStyle({
    transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
    boxShadow: 'none',
    transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
  });
}, []);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PostCard.tsx
git commit -m "feat: deepen PostCard 3D tilt with shadow lift on mouse move"
```

---

### Task 3: Enhance PerspectiveCard — Top Stripe + Inset Panels

**Files:**
- Modify: `frontend/src/components/Visualizations/PerspectiveCard.tsx`

**Logic preserved:** Props interface, conceptColors map, animejs entrance animation, perspective fetching, all links.

- [ ] **Step 1: Replace left border stripe with top animated gradient stripe**

Find the left stripe div (around line 62-63):
```tsx
<div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientColor} opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 group-hover:w-1.5 group-focus-within:w-1.5 transition-all duration-300`} />
```

Replace with top stripe:
```tsx
<div className={`perspective-stripe absolute top-0 left-0 right-0 bg-gradient-to-r ${gradientColor}`} />
```

- [ ] **Step 2: Add icon container in card header**

Replace the h3+p block (lines 66-67):
```tsx
<div className="flex items-center gap-3 mb-1">
  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shrink-0 opacity-80`}>
    {concept === 'math' ? <BookOpen className="h-5 w-5 text-white/90" /> : <Atom className="h-5 w-5 text-white/90" />}
  </div>
  <div>
    <h3 className="font-display text-display-xs text-ink group-hover:text-clay transition-colors">{experiment.title}</h3>
    <span className="text-caption-sm text-ink-faint capitalize">{concept}</span>
  </div>
</div>
```

- [ ] **Step 3: Wrap perspective links in inset panel with perspective-row classes**

Replace the `space-y-2` div containing perspective links (lines 69-103):

```tsx
<div className="space-y-1 bg-surface-tile/40 rounded-xl p-1 mt-4">
  {experiment.perspectives.slice(0, 3).map((p) => (
    <Link
      key={p.id}
      href={`/experiments/${experiment.id}?p=${p.id}`}
      className="perspective-row group/perspective"
    >
      <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center shrink-0 opacity-60`}>
        {p.visualization.subject === 'math' ? (
          <BookOpen className="h-4 w-4 text-white/80" />
        ) : (
          <Atom className="h-4 w-4 text-white/80" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-label-sm text-label-sm text-ink group-hover/perspective:text-clay transition-colors">
          {p.perspectiveName}
        </p>
        <p className="text-caption-sm text-ink-muted truncate">{p.subtitle}</p>
      </div>
      <span className="perspective-arrow shrink-0">{t('common.view')} →</span>
    </Link>
  ))}

  {experiment.perspectives.length > 3 && (
    <Link
      href={`/experiments/${experiment.id}`}
      className="block text-center text-caption-sm text-ink-muted hover:text-clay transition-colors py-2"
    >
      +{experiment.perspectives.length - 3} {t('viz.experiment.morePerspectives')}
    </Link>
  )}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Visualizations/PerspectiveCard.tsx
git commit -m "feat: enhance PerspectiveCard with top gradient stripe, icon header, and inset perspective panels"
```

---

### Task 4: Redesign Homepage Hero with Particle Field and Cursor Glow

**Files:**
- Modify: `frontend/src/app/[locale]/HomePageClient.tsx`

**Logic preserved:** All useState, useEffect, data fetching, TOPICS constant, scroll handlers.

- [ ] **Step 1: Update imports — add ChevronDown**

Find the lucide import (line 14):
```tsx
import { ArrowRight, Sparkles, Cpu, Globe, Database, ChevronRight } from 'lucide-react';
```
Replace with:
```tsx
import { ArrowRight, Sparkles, Cpu, Globe, Database, ChevronRight, ChevronDown } from 'lucide-react';
```

- [ ] **Step 2: Replace hero section JSX (lines 132-197)**

Replace the entire hero `<section>` block (from `{/* ── Hero Section ── */}` comment through the closing `</section>` + scroll indicator + bottom gradient):

```tsx
{/* ── Hero Section ── */}
<section
  className="relative overflow-hidden bg-cream-200 border-b border-border min-h-[85vh] flex items-center"
  aria-labelledby="hero-heading"
  onMouseMove={(e) => {
    const glow = document.getElementById('hero-cursor-glow');
    if (glow) {
      const rect = e.currentTarget.getBoundingClientRect();
      glow.style.left = `${e.clientX - rect.left}px`;
      glow.style.top = `${e.clientY - rect.top}px`;
      glow.style.opacity = '1';
    }
  }}
  onMouseLeave={() => {
    const glow = document.getElementById('hero-cursor-glow');
    if (glow) glow.style.opacity = '0';
  }}
>
  {/* Particle field */}
  <div className="particle-field" aria-hidden="true">
    <div className="particle-dot fast" style={{ width: 4, height: 4, background: 'rgba(76,215,246,0.4)', top: '15%', left: '10%', animationDelay: '0s', boxShadow: '0 0 8px rgba(76,215,246,0.3)' }} />
    <div className="particle-dot slow" style={{ width: 3, height: 3, background: 'rgba(175,198,255,0.45)', top: '25%', left: '75%', animationDelay: '1s' }} />
    <div className="particle-dot fast" style={{ width: 5, height: 5, background: 'rgba(76,215,246,0.2)', top: '60%', left: '18%', animationDelay: '2s', boxShadow: '0 0 10px rgba(76,215,246,0.15)' }} />
    <div className="particle-dot slow" style={{ width: 3, height: 3, background: 'rgba(221,183,255,0.4)', top: '40%', left: '85%', animationDelay: '0.5s' }} />
    <div className="particle-dot fast" style={{ width: 4, height: 4, background: 'rgba(175,198,255,0.3)', top: '70%', left: '50%', animationDelay: '1.5s', boxShadow: '0 0 6px rgba(175,198,255,0.2)' }} />
    <div className="particle-dot slow" style={{ width: 6, height: 6, background: 'rgba(76,215,246,0.12)', top: '8%', left: '45%', animationDelay: '3s' }} />
    <div className="particle-dot fast" style={{ width: 2, height: 2, background: 'rgba(221,183,255,0.5)', top: '80%', left: '65%', animationDelay: '0.8s' }} />
    <div className="particle-dot slow" style={{ width: 3, height: 3, background: 'rgba(76,215,246,0.3)', top: '35%', left: '32%', animationDelay: '2.5s' }} />
    <div className="particle-dot fast" style={{ width: 5, height: 5, background: 'rgba(175,198,255,0.18)', top: '55%', left: '55%', animationDelay: '1.2s', boxShadow: '0 0 8px rgba(175,198,255,0.12)' }} />
    <div className="particle-dot slow" style={{ width: 2, height: 2, background: 'rgba(76,215,246,0.35)', top: '90%', left: '15%', animationDelay: '3.5s' }} />
  </div>

  {/* Orbiting rings — right side on desktop */}
  <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 hidden lg:block" aria-hidden="true">
    <div className="orbit-ring" style={{ width: 480, height: 480, marginLeft: -240, marginTop: -240 }} />
    <div className="orbit-ring" style={{ width: 360, height: 360, marginLeft: -180, marginTop: -180, animationDuration: '45s', animationDirection: 'reverse' }} />
    <div className="orbit-ring" style={{ width: 240, height: 240, marginLeft: -120, marginTop: -120, animationDuration: '38s' }} />
  </div>

  {/* Cursor glow — positioned inside hero */}
  <div id="hero-cursor-glow" className="cursor-glow" style={{ opacity: 0 }} aria-hidden="true" />

  {/* Grid background */}
  <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" aria-hidden="true" />
  {/* Radial ambient glow */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-clay/4 via-primary/2 to-transparent blur-[150px] pointer-events-none" aria-hidden="true" />

  <div className="section-container py-section-sm md:py-section w-full relative z-10">
    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
      {/* Left: Text */}
      <div className="flex-1 text-center lg:text-left max-w-xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clay opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-clay" />
          </span>
          <span className="text-ink-muted text-body-sm">{t('home.role')}</span>
        </div>

        <h1 id="hero-heading" className="font-display text-hero text-ink mb-6 text-balance leading-[1.1]">
          {t.rich('home.heroTitle', {
            clay: (chunks) => <span className="gradient-text">{chunks}</span>,
            br: () => <br />
          })}
        </h1>

        <p className="text-lead text-ink-soft max-w-xl mb-10 lg:mb-12">
          {t('home.heroDescription')}
        </p>

        <nav className="flex items-center gap-4 justify-center lg:justify-start" aria-label="Homepage actions">
          <Link href="#posts">
            <Button size="lg" className="magnetic-btn group relative overflow-hidden bg-gradient-to-r from-primary to-primary-container hover:from-primary-container hover:to-primary">
              <span className="relative z-10 text-primary-foreground">{t('home.browseArticles')}</span>
            </Button>
          </Link>
          <Link href="/category/ai">
            <Button variant="outline" size="lg" className="magnetic-btn group border-clay/20 hover:border-clay/40">
              {t('home.exploreAI')}
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </nav>
      </div>

      {/* Right: Wireframe sphere — enlarged */}
      <div className="hidden lg:flex items-center justify-center flex-shrink-0">
        <div className="wireframe-sphere animate-spin-slow" aria-hidden="true" style={{ width: 360, height: 360 }} />
      </div>
    </div>

    {/* Scroll indicator */}
    <div className="flex justify-center mt-16 lg:mt-24">
      <button
        onClick={() => document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' })}
        className="flex flex-col items-center gap-2 text-ink-muted hover:text-clay transition-colors animate-bounce"
        aria-label="Scroll to content"
      >
        <span className="text-caption-sm">{t('home.scrollDown')}</span>
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  </div>

  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream-200 to-transparent pointer-events-none" aria-hidden="true" />
</section>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/[locale]/HomePageClient.tsx
git commit -m "feat: redesign hero with particle field, orbiting rings, cursor-aware glow, and magnetic buttons"
```

---

### Task 5: Redesign Homepage Topic Zones with Branded Backgrounds

**Files:**
- Modify: `frontend/src/app/[locale]/HomePageClient.tsx`

**Logic preserved:** TOPICS mapping, topicPosts data, category lookup, conditional rendering.

- [ ] **Step 1: Replace topic zones section (lines 200-271)**

Replace the entire topic zones mapping block (from `{/* ── Topic Sections ── */}` through the closing `})` of the TOPICS.map):

```tsx
{/* ── Topic Sections ── */}
{TOPICS.map((topic, ti) => {
  const Icon = topic.icon;
  const postsForTopic = topicPosts[topic.slug] || [];
  const cat = categories.find((c: any) => c.slug === topic.slug);
  if (postsForTopic.length === 0 && !cat) return null;

  const isAI = topic.slug === 'ai';
  const isWeb3 = topic.slug === 'web3';
  const isBlockchain = topic.slug === 'blockchain';
  const bgClass = isAI ? 'topic-bg-ai' : isWeb3 ? 'topic-bg-web3' : 'topic-bg-blockchain';

  return (
    <SectionReveal key={topic.slug}>
      <section
        className={`relative ${ti % 2 === 0 ? 'bg-cream-100' : 'bg-cream-200'} border-b border-border overflow-hidden`}
        aria-labelledby={`topic-heading-${topic.slug}`}
      >
        {/* Branded background pattern */}
        <div className={`absolute inset-0 ${bgClass} opacity-50 pointer-events-none`} aria-hidden="true" />
        {/* Corner accent glow */}
        <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-br ${topic.color} blur-[120px] opacity-15 pointer-events-none`} aria-hidden="true" />

        <div className="section-container py-section-sm relative z-10">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center ${isAI ? 'animate-pulse-glow' : ''}`} aria-hidden="true">
                <Icon className="h-7 w-7 text-ink" />
              </div>
              <div>
                <h2 id={`topic-heading-${topic.slug}`} className="font-display text-display-md text-ink heading-underline">
                  {topic.label}
                </h2>
                <p className="text-body-sm text-ink-muted mt-1">{topic.desc}</p>
              </div>
            </div>
            {cat && (
              <Link href={`/category/${cat.slug}`}>
                <Button variant="ghost" size="sm" className="group hover:text-clay">
                  {t('common.viewAll')}
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>

          {/* Posts Grid */}
          {postsForTopic.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {postsForTopic.slice(0, 4).map((post: any, idx: number) =>
                isAI && idx === 0 ? (
                  <div key={post.id} className="md:col-span-2 gradient-border-glow rounded-editorial">
                    <PostCard post={post} featured />
                  </div>
                ) : (
                  <PostCard key={post.id} post={post} index={idx} />
                )
              )}
            </div>
          ) : (
            <div className="text-center py-16 rounded-editorial border border-border border-dashed bg-surface/10">
              <Icon className="h-10 w-10 mx-auto mb-3 text-ink-faint opacity-40 animate-breathe" />
              <p className="text-body text-ink-muted">{t('home.noArticlesTopic')}</p>
            </div>
          )}
        </div>
      </section>
    </SectionReveal>
  );
})}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/[locale]/HomePageClient.tsx
git commit -m "feat: redesign topic zones with branded backgrounds, accent glows, and animated underlines"
```

---

### Task 6: Redesign Homepage Latest Posts + About Section

**Files:**
- Modify: `frontend/src/app/[locale]/HomePageClient.tsx`

**Logic preserved:** Loading state, posts data, pagination, postsRef for stagger animation.

- [ ] **Step 1: Replace the Latest Posts section (lines 276-337)**

Replace the entire Latest Posts section:

```tsx
<BannerCarousel zone="inline" />

{/* ── Latest Posts ── */}
<section id="posts" className="relative bg-cream-200" aria-labelledby="latest-heading">
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-clay/15 to-transparent pointer-events-none" aria-hidden="true" />
  <div className="section-container py-section-sm">
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 id="latest-heading" className="font-display text-display-md text-ink">{t('home.latestPosts')}</h2>
        <p className="text-body-sm text-ink-muted mt-1">{t('home.recentPostsDesc')}</p>
      </div>
      {totalPages > page && (
        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="group hidden md:inline-flex">
          {t('common.loadMore')}
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      )}
    </div>

    {/* Filter pills */}
    <div className="flex flex-wrap gap-2 mb-10">
      {categories.filter((c: any) => ['ai','web3','blockchain'].includes(c.slug)).map((cat: any) => (
        <button key={cat.id} className="filter-pill">{cat.name}</button>
      ))}
    </div>

    {loading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[4/3] rounded-editorial shimmer" />
            <Skeleton className="h-4 w-1/3 shimmer" />
            <Skeleton className="h-6 w-full shimmer" />
            <Skeleton className="h-4 w-2/3 shimmer" />
          </div>
        ))}
      </div>
    ) : posts.length === 0 ? (
      <div className="text-center py-24">
        <h2 className="font-display text-display-lg text-ink mb-3">{t('home.noPosts')}</h2>
        <p className="text-body text-ink-muted">{t('home.checkBackLater')}</p>
      </div>
    ) : (
      <>
        <div ref={postsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {posts.map((post, idx) => (
            <PostCard key={post.id} post={post} index={idx} />
          ))}
        </div>
        {totalPages > page && (
          <div className="flex justify-center mt-12 md:hidden">
            <Button variant="outline" size="lg" onClick={() => setPage(p => p + 1)} className="group">
              {t('common.loadMore')}
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        )}
      </>
    )}
  </div>
</section>
```

- [ ] **Step 2: Replace the About Author section (lines 342-376)**

```tsx
<BannerCarousel zone="sidebar" />

{/* ── About Author ── */}
<section className="relative bg-cream-100 border-t border-border overflow-hidden" aria-labelledby="about-heading">
  <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full bg-clay/5 blur-[120px] pointer-events-none" aria-hidden="true" />
  <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" aria-hidden="true" />
  <div className="section-container py-section-sm relative z-10">
    <div className="max-w-content mx-auto text-center mb-12">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-clay to-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-clay/25 animate-pulse-glow" aria-hidden="true">
        <span className="font-display text-display-md text-white">F</span>
      </div>
      <h2 id="about-heading" className="font-display text-display-md text-ink mb-4">{t('home.aboutAuthor')}</h2>
      <p className="text-body text-ink-soft max-w-2xl mx-auto leading-relaxed">{t('home.aboutDesc')}</p>
    </div>

    {/* Stats counters */}
    <SectionReveal>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-10">
        <div className="text-center">
          <div className="stat-number text-clay">128+</div>
          <div className="text-caption-sm text-ink-muted mt-1">{t('home.topicFrontend')}</div>
        </div>
        <div className="text-center">
          <div className="stat-number text-primary">42K+</div>
          <div className="text-caption-sm text-ink-muted mt-1">{t('home.topicAI')}</div>
        </div>
        <div className="text-center">
          <div className="stat-number text-secondary">3</div>
          <div className="text-caption-sm text-ink-muted mt-1">{t('home.topicWeb3')}</div>
        </div>
      </div>
    </SectionReveal>

    {/* Skill chips */}
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
      {[
        { label: t('home.topicFrontend'), icon: Cpu, color: 'text-clay' },
        { label: t('home.topicAI'), icon: Sparkles, color: 'text-primary' },
        { label: t('home.topicWeb3'), icon: Globe, color: 'text-secondary' },
        { label: t('home.topicBlockchain'), icon: Database, color: 'text-tertiary' },
      ].map((skill, i) => (
        <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card hover:border-clay/25 transition-all duration-300">
          <skill.icon className={`h-4 w-4 ${skill.color}`} aria-hidden="true" />
          <span className="text-label-sm">{skill.label}</span>
        </div>
      ))}
    </div>

    {/* Quote */}
    <div className="max-w-xl mx-auto text-center p-8 rounded-2xl glass-card">
      <p className="text-body text-ink-soft italic leading-relaxed">&ldquo;{t('home.aboutQuote')}&rdquo;</p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/[locale]/HomePageClient.tsx
git commit -m "feat: redesign latest posts grid with filter pills and about section with stats counters"
```

---

### Task 7: Redesign Experiments List Page

**Files:**
- Modify: `frontend/src/app/[locale]/experiments/page.tsx`

**Logic preserved:** experiments.list() API call, loading/empty/data states, data/loading useState.

- [ ] **Step 1: Add imports — Beaker, Binary, Dna**

Replace lucide import line:
```tsx
import { ChevronLeft, Layers } from 'lucide-react';
```
With:
```tsx
import { ChevronLeft, Layers, Beaker, Binary, Atom, Dna } from 'lucide-react';
```

- [ ] **Step 2: Add concept filter state**

After the existing `useEffect` block (after `}, []);` around line 22), add:

```tsx
const [activeConcept, setActiveConcept] = useState<string | null>(null);

const CONCEPTS = [
  { slug: null, label: 'All', icon: Beaker },
  { slug: 'math', label: 'Mathematics', icon: Binary },
  { slug: 'physics', label: 'Physics', icon: Atom },
  { slug: 'biology', label: 'Biology', icon: Dna },
];

const filteredData = activeConcept
  ? data.filter((exp: any) => (exp.concept || 'math').toLowerCase() === activeConcept)
  : data;
```

- [ ] **Step 3: Replace the entire return JSX (lines 24-61)**

```tsx
return (
  <div className="min-h-screen bg-cream-200">
    {/* Lab Hero Header */}
    <section className="relative overflow-hidden bg-cream-100 border-b border-border">
      {/* Floating lab shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="lab-shape square" style={{ width: 60, height: 60, top: '15%', left: '8%' }} />
        <div className="lab-shape circle" style={{ width: 45, height: 45, top: '60%', right: '12%' }} />
        <div className="lab-shape hex" style={{ width: 80, height: 80, top: '20%', right: '20%' }} />
        <div className="lab-shape square" style={{ width: 35, height: 35, top: '70%', left: '20%' }} />
        <div className="lab-shape circle" style={{ width: 55, height: 55, top: '10%', left: '55%' }} />
        {/* Glow dots */}
        <div className="particle-dot fast" style={{ width: 6, height: 6, background: 'rgba(76,215,246,0.25)', top: '30%', left: '40%', boxShadow: '0 0 12px rgba(76,215,246,0.15)' }} />
        <div className="particle-dot slow" style={{ width: 4, height: 4, background: 'rgba(175,198,255,0.35)', top: '50%', left: '60%' }} />
        <div className="particle-dot fast" style={{ width: 5, height: 5, background: 'rgba(76,215,246,0.2)', top: '72%', right: '30%', boxShadow: '0 0 10px rgba(76,215,246,0.1)' }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-clay/5 blur-[100px] pointer-events-none" aria-hidden="true" />

      <div className="max-w-grid mx-auto px-6 py-section-sm relative z-10">
        <Link href="/visualizations" className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />
          {t('viz.browseAll')}
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-clay/20 to-primary/10 border border-clay/10 flex items-center justify-center">
            <Layers className="h-7 w-7 text-clay" />
          </div>
          <div>
            <h1 className="font-display text-display-lg text-ink">{t('viz.experiment.title')}</h1>
            <p className="text-body-sm text-ink-muted">{t('viz.experiment.subtitle')}</p>
          </div>
        </div>

        {/* Concept filter pills */}
        <div className="flex flex-wrap gap-2">
          {CONCEPTS.map((concept) => {
            const Icon = concept.icon;
            const isActive = activeConcept === concept.slug;
            return (
              <button
                key={concept.slug || 'all'}
                onClick={() => setActiveConcept(concept.slug)}
                className={`filter-pill flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {concept.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>

    {/* Cards Grid */}
    <div className="max-w-grid mx-auto px-6 py-section-sm">
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl shimmer" />)}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-24">
          <div className="relative inline-block mb-6">
            <Layers className="h-16 w-16 mx-auto text-ink-faint animate-breathe" />
            <div className="absolute inset-0 rounded-full bg-clay/10 blur-2xl animate-pulse-glow" aria-hidden="true" />
          </div>
          <p className="text-body text-ink-muted">{t('viz.experiment.empty')}</p>
          {activeConcept && (
            <Button variant="ghost" size="sm" onClick={() => setActiveConcept(null)} className="mt-3">
              Clear Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredData.map((exp, idx) => (
            <PerspectiveCard key={exp.id} experiment={exp} index={idx} />
          ))}
        </div>
      )}
    </div>
  </div>
);
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/[locale]/experiments/page.tsx
git commit -m "feat: redesign experiments list page with lab header, concept filter pills, and enhanced grid"
```

---

### Task 8: Enhance Experiment Detail Page

**Files:**
- Modify: `frontend/src/app/[locale]/experiments/[id]/page.tsx`

**Logic preserved:** experiments.get() API call, activeIndex state, URL param reading, error handling, loading state.

- [ ] **Step 1: Remove ExperimentSwitcher import, add no new imports needed**

Remove `ExperimentSwitcher` from the import on line 9 (keep the rest):

```tsx
import { HtmlVisualizationRenderer } from '@/components/Visualizations/VisualizationRenderer';
```

- [ ] **Step 2: Replace ExperimentSwitcher + viz card + description (lines 81-109)**

Replace from the `<ExperimentSwitcher>` line through the closing description card:

```tsx
{/* Pill-style perspective switcher */}
<div className="pill-switcher mb-6" role="tablist">
  {group.perspectives.map((p: any, i: number) => (
    <button
      key={p.id}
      role="tab"
      aria-selected={i === activeIndex}
      onClick={() => setActiveIndex(i)}
      className={`pill-tab whitespace-nowrap ${i === activeIndex ? 'active' : ''}`}
    >
      {p.perspectiveName}
    </button>
  ))}
</div>

{/* Viz container with ambient glow */}
<div className="relative rounded-2xl border border-border bg-surface overflow-hidden shadow-card">
  <div className="absolute inset-0 bg-gradient-to-br from-clay/[0.02] via-transparent to-primary/[0.02] pointer-events-none" aria-hidden="true" />
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-clay/10 to-transparent pointer-events-none" aria-hidden="true" />
  <div className="relative min-h-[500px]">
    {activeViz ? (
      <HtmlVisualizationRenderer htmlContent={activeViz.htmlContent} visualizationId={activeViz.id} />
    ) : (
      <div className="flex items-center justify-center h-[500px] text-ink-muted">
        <Layers className="h-10 w-10 animate-breathe opacity-40" />
      </div>
    )}
  </div>
  {activeViz?.description && (
    <div className="px-6 py-5 border-t border-border bg-surface-warm/50">
      <h2 className="font-display text-display-xs text-ink mb-1">{activePerspective.perspectiveName}</h2>
      <p className="text-body-sm text-ink-muted">{activePerspective.subtitle}</p>
    </div>
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/[locale]/experiments/[id]/page.tsx
git commit -m "feat: enhance experiment detail with pill switcher, ambient glow viz container, and integrated description"
```

---

### Task 9: Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript type check**

```bash
cd "/Volumes/EXT SSD/works/blog/frontend" && npx tsc --noEmit 2>&1 | head -80
```

Expected: No new type errors. Fix any errors that appear.

- [ ] **Step 2: Verify build compiles**

```bash
cd "/Volumes/EXT SSD/works/blog/frontend" && npm run build 2>&1 | tail -30
```

Expected: Successful build.

- [ ] **Step 3: Verify key files untouched**

```bash
cd "/Volumes/EXT SSD/works/blog" && git diff HEAD -- frontend/src/lib/api/ frontend/src/components/Header.tsx frontend/src/components/Footer.tsx frontend/messages/
```

Expected: No diff (no changes to API layer, Header, Footer, or i18n messages).

---

## Task Order

1. **Task 1** — CSS foundation (all new keyframes + utilities)
2. **Task 2** — PostCard deeper 3D tilt
3. **Task 3** — PerspectiveCard top stripe + inset panels
4. **Task 4** — Homepage hero (particle field, rings, cursor glow)
5. **Task 5** — Homepage topic zones (branded backgrounds)
6. **Task 6** — Homepage latest posts + about (filter pills, stats)
7. **Task 7** — Experiments list page (lab header, concept filters)
8. **Task 8** — Experiment detail page (pill switcher, viz glow)
9. **Task 9** — Build verification

Tasks 1→2→3 must be sequential (foundation first, then shared components). Tasks 4→5→6 modify the same file sequentially. Tasks 7 and 8 are independent of each other but depend on Task 3 (PerspectiveCard). Task 9 runs last.
