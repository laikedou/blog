# Visualizations Pages UI Redesign Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Redesign `/visualizations` listing and `/visualizations/[id]` detail pages with high-quality product UI. Keep all logic, change only layout/interactions/visual effects.

**Architecture:** Modify existing page files + sub-components. No new files. CSS-only animations. Mixed dark/light contrast style with glass morphism, staggered entrance animations, hover glow effects.

**Tech Stack:** Next.js, Tailwind CSS v4, React, existing design tokens

---

### Task 1: Listing Page - Hero & Search Redesign

**Files:**
- Modify: `frontend/src/app/[locale]/visualizations/page.tsx`

- [ ] **Step 1: Add animated particle background to hero**

Replace the static hero div with one containing floating particles (CSS animation keyframes). Add to the hero section's className and insert particle dots as absolutely-positioned spans.

- [ ] **Step 2: Upgrade search input with glow effect**

Add `focus-within:shadow-[0_0_20px_rgba(76,215,246,0.2)]` transition to the search wrapper. Add a keyboard shortcut badge (`/`) inside the input.

- [ ] **Step 3: Refine filter pills with sweep-light hover**

Update subject filter buttons with a `hover:bg-white/20` sweep effect using a pseudo-element gradient overlay.

- [ ] **Step 4: Add stats banner between hero and grid**

Insert a glass-card stats row: total viz count, math count, physics count, today's new. Compute counts from data. Add a subtle shimmer hover effect.

- [ ] **Step 5: Commit**

### Task 2: Listing Page - Card Grid & CTA

**Files:**
- Modify: `frontend/src/app/[locale]/visualizations/page.tsx`

- [ ] **Step 1: Add staggered fade-up entrance animation**

Apply `animate-fade-up` with inline `animation-delay` based on card index. Use `opacity-0` with the animate class.

- [ ] **Step 2: Redesign card with light-card-on-dark contrast**

Change card to use light background (`bg-surface-container-high` or white-tinted). Update hover effects: `hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]` with transition.

- [ ] **Step 3: Add grid-line texture overlay on card images**

Use a CSS background pattern (repeating-linear-gradient) as an overlay pseudo-element on the image area.

- [ ] **Step 4: Add CTA banner section at bottom**

Gradient background (`from-clay to-tertiary`), floating geometric shapes (CSS transforms on absolutely positioned divs), two buttons linking to create/browse.

- [ ] **Step 5: Enhance empty state with SVG illustration**

Replace the simple icon with a more elaborate illustration using multiple layered icons.

- [ ] **Step 6: Commit**

### Task 3: Detail Page - Top Area & Breadcrumb

**Files:**
- Modify: `frontend/src/app/[locale]/visualizations/[id]/page.tsx`
- Modify: `frontend/src/components/Visualizations/VizMetadataSection.tsx`

- [ ] **Step 1: Add breadcrumb navigation**

Add a breadcrumb row above the metadata section: `可视化 > [Subject] > [Title]`. Use small text with arrow separators.

- [ ] **Step 2: Add subject-based gradient title**

Apply gradient text to the title: math gets `from-blue-400 to-purple-400`, physics gets `from-cyan-400 to-green-400`. Use `bg-gradient-to-r bg-clip-text text-transparent`.

- [ ] **Step 3: Refine metadata badges**

Update version/AI badges to use refined capsule styling with subtle background and border.

- [ ] **Step 4: Commit**

### Task 4: Detail Page - Sticky Header & Reading Progress

**Files:**
- Modify: `frontend/src/components/Visualizations/VizStickyHeader.tsx`

- [ ] **Step 1: Add scroll-aware glass transition**

Change static background to use `bg-surface/60 backdrop-blur-xl` that transitions from transparent on scroll. Add a CSS class toggle via useEffect with scroll listener.

- [ ] **Step 2: Add reading progress bar**

Add a 2px-high div at the header bottom with gradient fill (`from-clay to-tertiary`), width controlled by scroll position percentage (useState + useEffect scroll listener).

- [ ] **Step 3: Refine toolbar buttons**

Make desktop buttons icon-only (remove text labels except share). Add `title` attributes for native tooltips. Add `hover:bg-white/10` transition.

- [ ] **Step 4: Commit**

### Task 5: Detail Page - Renderer Card & Content Tabs

**Files:**
- Modify: `frontend/src/components/Visualizations/VizRendererCard.tsx`
- Modify: `frontend/src/components/Visualizations/VizContentTabs.tsx`

- [ ] **Step 1: Add corner accents and inner glow to renderer card**

Add CSS pseudo-elements for L-shaped corner lines. Add `inner-glow` class for top border light effect.

- [ ] **Step 2: Add sliding tab indicator**

Replace static TabsList with one that has an animated underline (a div positioned absolutely under the active tab, with CSS transition on `left` and `width`).

- [ ] **Step 3: Enhance content transitions**

Add `animate-fade-up` to TabContent panels for crossfade + slide effect on tab switch.

- [ ] **Step 4: Style knowledge points list**

Add colored left border accent and icon per item in knowledge summary. Math: blue accent + 📐, Physics: green accent + ⚛️.

- [ ] **Step 5: Add card-flip animation to quiz**

Add a CSS 3D transform flip animation when user selects an answer option.

- [ ] **Step 6: Commit**

### Task 6: Detail Page - Right Sidebar & Social Area

**Files:**
- Modify: `frontend/src/app/[locale]/visualizations/[id]/page.tsx`
- Modify: `frontend/src/components/Visualizations/VizSocialTabs.tsx`
- Modify: `frontend/src/components/Visualizations/RelatedVisualizations.tsx`
- Modify: `frontend/src/components/Visualizations/VisualizationComments.tsx`

- [ ] **Step 1: Merge sidebar into tabbed card**

Replace the two separate sidebar panels (ClassroomPanel + AITutorSidebar) with a single glass-card containing tab switching between "Classroom" and "AI Tutor".

- [ ] **Step 2: Add sliding tab indicator to social tabs**

Same pattern as content tabs - animated underline under active tab.

- [ ] **Step 3: Style comment avatars with online ring**

Add a subtle ring/border effect to user avatars. Own comments get a faint accent left-border.

- [ ] **Step 4: Add parallax hover to related viz cards**

Add `group-hover:scale-110` to card images with `overflow-hidden` on the image container for a zoom effect.

- [ ] **Step 5: Commit**

### Task 7: Detail Page - FAB Group & Mobile Bar

**Files:**
- Modify: `frontend/src/app/[locale]/visualizations/[id]/page.tsx`
- Modify: `frontend/src/components/Visualizations/VizMobileBottomBar.tsx`

- [ ] **Step 1: Add FAB group for desktop**

Add fixed bottom-right floating action buttons: main button (Sparkles/AI Tutor icon) with expand/collapse to reveal sub-buttons (Classroom, Narration, Share). Use CSS transition for expand animation.

- [ ] **Step 2: Add pulse animation to unused features**

Add `animate-pulse` with a custom keyframe to highlight features the user hasn't tried yet (check localStorage for "hasUsed" flags).

- [ ] **Step 3: Upgrade mobile bottom bar**

Add `backdrop-blur-xl bg-surface/80` to mobile bottom bar. Add subtle border-top glow.

- [ ] **Step 4: Add micro-interactions**

Like button: scale bounce on click (`active:scale-125 transition-transform`). Share: add a brief checkmark animation after copy.

- [ ] **Step 5: Commit**
