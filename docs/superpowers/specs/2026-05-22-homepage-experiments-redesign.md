# Homepage & Experiments Page UI Redesign — Immersive & Cinematic

**Date:** 2026-05-22
**Status:** Approved
**Scope:** Layout, styling, animations, interaction effects only. No logic/API/data changes.

## Design Direction

Immersive & Cinematic — rich depth effects, animated particle backgrounds, parallax scroll, 3D card tilts, cursor-aware glows, and cinematic scroll-triggered reveals. Each section has its own visual identity. The site should feel like an experience, not just a page.

## Tech Constraints

- CSS-only particle/3D effects (no Three.js/WebGL)
- animejs for scroll/stagger animations
- shadcn/ui + lucide-react for components
- Tailwind CSS v4 with existing design tokens
- IntersectionObserver for scroll-triggered reveals
- View Transition API for page transitions where applicable
- All existing component props and interfaces unchanged

---

## Homepage — 4 Immersive Zones

### 1. Hero Section (full viewport impact)
- **Particle field background** — CSS-animated floating dots of varying sizes orbiting slowly, with subtle color shifts (clay, primary, secondary)
- **Orbiting accent rings** — 2-3 translucent elliptical rings behind the content area, slowly rotating in 3D perspective (CSS transform rotateX)
- **Cursor-aware radial glow** — subtle radial gradient follows mouse position in hero area
- **Live badge** — pulsing dot with "Exploring the future of technology" label, glassmorphic pill
- **Headline** — gradient text on keywords ("AI", "imagination"), word-by-word staggered entrance via animejs
- **CTA buttons** — magnetic hover effect (subtle scale + glow on hover), primary with gradient fill, secondary outline
- **Scroll indicator** — bouncing chevron with animated label, smooth scrolls to #posts
- **Keep**: BannerCarousel zone="hero" placement above

### 2. Topic "Worlds" — Branded Section Zones
Each topic section gets distinct visual treatment while maintaining layout consistency:

**AI Zone** (neurons/particles):
- Background: neural dot pattern (radial-gradient dots at regular intervals), violet-tinted gradient overlay
- Card treatment: featured card gets gradient-border-glow, spans 2 columns on desktop
- Icon container: animate-pulse-glow on the AI icon
- Cards alternate layout rhythm (AI: featured-left, Web3: featured-right)

**Web3 Zone** (nodes/network):
- Background: node-connection dot grid, cyan-tinted
- Subtle top accent line: gradient from transparent → clay/20 → transparent
- Icon container: network mesh styling

**Blockchain Zone**:
- Background: chain-link visual motif, warm amber tint
- Sequential card highlight on section entry
- Icon container: geometric styling

**Common across all topic zones:**
- Staggered section reveal via IntersectionObserver + animejs (opacity 0→1, translateY 24→0)
- Section heading with animated underline (width 0→full on hover)
- View All link with chevron that slides on hover

### 3. Latest Posts Grid
- **Category filter pills** at top — animated active/inactive states with background color transition, glow on active pill
- **3D tilt cards** — perspective transform on mouse move (rotateX/Y), shadow elevation increase, image zoom on hover. Existing tilt behavior enhanced with deeper perspective and faster response
- **Staggered entrance** — cards cascade in via animejs stagger(80ms)
- **Shimmer skeleton** — loading state with animated gradient sweep
- **Load More button** — outline style, expands on hover, chevron icon bounce
- **Grid**: 3 columns on desktop, responsive, with gap-x-8 gap-y-16

### 4. About Author — Stats-Driven
- **Animated stat counters** — 3 large numbers (Articles, Readers, Topics) animate on scroll using count-up effect
- **Glowing avatar** — gradient-filled circle with box-shadow glow, pulsing on scroll entry
- **Skill chips** — icon + label in glass-style containers with border, hover shifts to clay border color
- **Quote card** — italic text in glass container with subtle border

### 5. Global Elements (existing, enhanced)
- **Scroll progress bar** — fixed top, gradient fill, smooth width transition
- **Back-to-top button** — circular, glassmorphic, with scroll-percentage ring indicator
- **Banner carousel** — fade+slide crossfade transitions, auto-rotate 6s, dot indicators with width animation

---

## Experiments List Page — Lab Experience

### 1. Hero Header
- **Lab atmosphere** — floating geometric shapes (squares, circles, hexagons) drifting in background via CSS animation
- **Glowing particles** — small dots with box-shadow glow scattered across the header
- **Title + icon** — large icon container with gradient fill + title/subtitle beside it
- **Breadcrumb** — "← Browse Visualizations" link preserved, styled muted
- **Concept filter pills** — Math/Physics/Biology/All chips with animated selection state, icon + label

### 2. Experiment Cards — Enhanced Perspective Cards
- **Top gradient stripe** (replaces left border stripe) — color-coded per concept (blue=math, violet=physics, green=biology), animates on hover (gradient-shift)
- **Card layout** — rounded-20px container, subtle border, background surface tint
- **Icon + title row** — rounded square icon container with concept gradient fill, title + concept label beside
- **Perspective list** — inset panel (darker surface container), perspective items are rows with:
  - Small rounded icon container per perspective
  - Name + subtitle text
  - "View →" text that fades in on row hover
- **"+N more perspectives" link** — centered, muted, hover turns clay color
- **Staggered entrance** — cards fade-up with per-index delay (100ms stagger)
- **Empty state** — animated floating icons with breathing opacity, centered message

### 3. Key Effects
- Card hover: subtle scale + shadow elevation + gradient stripe animation
- Perspective row hover: background highlight + arrow reveal
- Filter pill: background fill animation on selection
- Page entrance: staggered card cascade

---

## Experiment Detail Page — Minor Enhancements

- **Perspective switcher** — pill-style segmented tabs (replaces current tab bar), active pill gets filled background + glow, indicator slide animation on switch
- **Visualization container** — subtle radial glow behind the viz area, glassmorphic border treatment
- **Description panel** — flows seamlessly below viz container, shared border radius
- **Breadcrumb** — preserved, styled consistently with list page
- **Loading state** — skeleton for header + large skeleton for viz area

---

## Files Modified

| File | Changes |
|------|---------|
| `HomePageClient.tsx` | Hero particle field, topic zone backgrounds, enhanced card grids, stats counters, cursor glow |
| `experiments/page.tsx` | Lab header, concept filter pills, enhanced card grid, empty state |
| `experiments/[id]/page.tsx` | Pill-style switcher, viz container glow, description panel |
| `PostCard.tsx` | Enhanced 3D tilt (deeper perspective, faster response), shimmer variant |
| `PerspectiveCard.tsx` | Top gradient stripe, inset perspective panels, enhanced hover states |
| `BannerCarousel.tsx` | Enhanced slide transitions (already done in previous commits) |
| `globals.css` | New keyframes (particle-float, gradient-shift, count-up, etc.), utility classes for particle fields, cursor glow, etc. |

## What NOT to Change

- All API calls and data fetching logic (postsApi, categoriesApi, experiments, banners)
- All component prop interfaces and TypeScript types
- Translation/i18n keys (t() calls preserved)
- SEO metadata generation (generateListMetadata, jsonLd)
- Business logic (pagination, state management, error handling)
- BannerCarousel core logic (already enhanced)
- Header/Footer components
