# Visualizations Pages UI Redesign

## Summary
Redesign `/visualizations` (listing) and `/visualizations/[id]` (detail) with high-quality product UI. Keep all logic intact; only change layout, interaction effects, and visual design. Mixed dark/light contrast style.

## Approach: Progressive Immersion (方案A)
Deep dark base with bright card layers floating above, glass morphism, particle animations, glow effects, staggered entrance animations.

---

## Listing Page (`/visualizations`)

### Hero
- Animated particle/grid background (CSS-only, ~20 floating dots)
- Gradient text highlight on title keywords
- Search input: pill shape, focus glow ring animation, keyboard shortcut badge ("/")
- Filter pills: hover sweep-light effect, active state with tertiary gradient + micro scale-down

### Stats Banner (NEW)
- glass-card container between hero and grid
- 4 stat items: total visualizations, math count, physics count, today's new
- Count-up animation on scroll into view
- Hover: subtle shimmer sweep across the row

### Card Grid
- Staggered fade-up entrance (animation-delay per card index)
- Light cards (`bg-surface-container-high`) on dark background for contrast
- Image area: subtle grid-line texture overlay, hover play-button glow
- Card hover: translateY(-4px) + shadow expansion + subtle border glow
- Subject badge: refined dot+label, title gradient-to-clay on hover
- Metadata row: compact icon-only labels

### CTA Banner (NEW)
- Gradient background (clay→tertiary), floating geometric shapes
- "Create your own visualization" message
- Two buttons: Browse More + Start Creating

### Empty State
- SVG illustration instead of just icon
- Actionable "Create One" button

---

## Detail Page (`/visualizations/[id]`)

### Top Area
- Breadcrumb nav replacing back link: Viz → Subject → Title
- Title with subject-based gradient (math: blue-purple, physics: cyan-green)
- Version/AI badges as refined capsules beside title

### Sticky Header (VizStickyHeader)
- Transparent→glass-panel transition on scroll
- Cleaner icon-only buttons with tooltips
- 2px reading progress bar at header bottom (gradient, left→right)

### Viz Renderer Card (VizRendererCard)
- inner-glow top border
- Corner L-shaped accent lines (CSS pseudo-elements)
- Floating fullscreen button on hover
- Subtle noise texture on renderer background

### Content Tabs (VizContentTabs)
- Sliding tab indicator (animated underline)
- Crossfade + slight slide-up on tab content switch
- Knowledge points list: icon per item, colored left accent line
- Quiz: card-flip animation on answer

### Right Sidebar
- Merged ClassroomPanel + AITutorSidebar into single tabbed card
- Tabs: "Classroom" | "AI Tutor"
- glass-card style, sticky positioning
- AI chat bubbles: typewriter animation

### Social Area (VizSocialTabs)
- Sliding tab indicator matching content tabs
- Comments: author avatar with online-status ring, own-comment accent line
- Related cards: parallax image zoom on hover

### FAB Group (NEW, desktop)
- Bottom-right floating action buttons
- Main button (AI Tutor) + expand/collapse sub-buttons (Classroom, Narration, Share)
- Pulse animation on unused features

### Micro-interactions
- Staggered section entrance on page load
- Like button: heart particle burst
- Share: ripple effect
- Classroom created: typewriter join code + checkmark copy animation

---

## Constraints
- Do NOT modify any data-fetching, state management, or business logic
- Use existing design tokens (CSS variables, Tailwind theme)
- No new dependencies
- CSS animations only (no JS animation libraries)
- Both pages remain `'use client'` components
