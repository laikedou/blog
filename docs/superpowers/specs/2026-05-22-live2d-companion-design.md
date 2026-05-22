# Live2D Companion System — Design Spec

## Overview

Integrate the `l2d-widget` library into the frontend as a product-grade Live2D companion. The character serves a hybrid role: site mascot on general pages, learning guide on visualization pages, and AI avatar face for the existing ChatBot. Page-aware positioning and deep ChatBot state sync make it feel native rather than tacked on.

## Character Identity

- **Style:** Anime-style girl with lab coat aesthetic — "your smart lab partner"
- **Name:** "Koko" (configurable via env/settings)
- **Library:** `l2d-widget` (npm, ~500 lines, zero runtime deps, MIT licensed)
- **Model:** Start with 1 free Live2D model (e.g., `cat-black` default or a curated anime model from a free model repository). Extensible to 2-3 themed variants later via multi-model support.

## Page-Aware Behavior

| Page Type | Position | Size | Role |
|---|---|---|---|
| Homepage (`/`) | Hero section, right-aligned | 380px | Greeter — welcomes visitors, promotes features |
| Blog Posts (`/posts/*`) | Bottom-left fixed | 260px | Reading companion — subtle presence, occasional tips |
| Visualizations (`/visualizations/*`) | Bottom-left fixed | 300px | Learning guide — context-aware explanations |
| Category/Tag/Search | Bottom-left fixed | 260px | Mascot |
| Admin (`/admin/*`) | Hidden | — | — |
| Embed (`/embed/*`) | Hidden | — | — |
| Mobile (< 768px) | Hidden | — | Preserve screen real estate |

Position transitions smoothly when navigating between page types (CSS transition on the container).

## ChatBot Deep Integration

The character is the ChatBot's face. Five synced states:

| State | Trigger | Character Behavior |
|---|---|---|
| `idle` | Default | Subtle breathing animation, cycling tips |
| `listening` | User focuses chat input | Tilt head, attentive expression |
| `thinking` | After user sends message | "..." bubble, pondering animation |
| `speaking` | AI streaming response | Mouth typing animation, live text bubble |
| `sleeping` | 5 min inactivity | Eyes closed, sleep pose. Click to wake. |

States are communicated via a React context (`Live2DContext`). ChatBot publishes state changes; Live2DWidget subscribes. No direct coupling between components.

## Tips & Messages

All messages live in i18n JSON files (`messages/{locale}.json`) under a `live2d` namespace. Structured as:

```json
{
  "live2d": {
    "homepage": {
      "welcome": ["Welcome to the lab! 👋", "Explore interactive visualizations!"],
      "featureHint": ["Try asking me a question!", "Check out the latest experiments."]
    },
    "blog": {
      "reading": ["Enjoying this post?", "Want me to explain anything?"]
    },
    "visualization": {
      "guide": ["Try adjusting the parameters!", "Click the AI button for an explanation."]
    },
    "timeGreeting": {
      "morning": "Good morning! Ready to learn?",
      "afternoon": "Good afternoon! How's the exploration going?",
      "evening": "Good evening! Time to wind down with some knowledge."
    },
    "chatbot": {
      "listening": "I'm listening...",
      "thinking": "Let me think...",
      "greeting": "Hi! What would you like to know?"
    }
  }
}
```

Tips cycle with configurable `duration` (3500ms) and `interval` (5000ms).

## Character Menu

Custom menu items (via `extraItems`):

| Icon | Label (i18n key) | Action |
|---|---|---|
| `mdi:robot` | Ask AI | Opens ChatBot, sets state to `listening` |
| `mdi:volume-off` / `mdi:volume-high` | Mute / Unmute | Toggles tips visibility |
| `mdi:eye-off` | Hide | Dismisses character (persisted in localStorage) |

Default l2d-widget items (model switch) remain when multi-model is active.

## Technical Architecture

### Package
- `l2d-widget` — npm package, pure DOM + CSS, no framework dependency

### New Files
```
src/
  components/
    Live2DWidget.tsx        # Main wrapper component ('use client')
  contexts/
    Live2DContext.tsx        # State/event bus for ChatBot ↔ Character
  lib/
    live2d-config.ts         # Model URLs, tips config, page detection, widget options
```

### Modified Files
```
src/app/[locale]/layout.tsx   # Mount <Live2DWidget /> alongside <ChatBot />
src/components/ChatBot.tsx    # Publish state events via useLive2D() context hook
messages/{en,zh-CN,zh-TW,ja}.json  # Add live2d tips keys
package.json                  # Add l2d-widget dependency
```

### Live2DWidget Component Design

```tsx
'use client';
// Dynamically imports l2d-widget, wrapped in useEffect for browser-only
// Reads Live2DContext for chatbot state
// Detects page type from usePathname()
// Loads config from live2d-config.ts
// Creates widget instance on mount, destroys on unmount
// Handles sleep timer (5 min inactivity via pointer/touch events)
```

### Live2DContext Design

```tsx
type CharacterState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'sleeping';

interface Live2DContextValue {
  state: CharacterState;
  setState: (state: CharacterState) => void;
  streamingText: string;
  setStreamingText: (text: string) => void;
  openChat: () => void;          // callback registered by Live2DWidget
  registerOpenChat: (fn: () => void) => void;
}
```

### Key Constraints

- **No SSR:** Live2D requires canvas/WebGL. Wrapped in `dynamic(() => import(...), { ssr: false })` at the layout level or internally uses `useEffect` guards.
- **Mobile hidden:** `useMediaQuery('(min-width: 768px)')` gates rendering.
- **Admin/Embed hidden:** `usePathname()` checks path prefix.
- **Memory:** Single widget instance. Destroy on unmount to release WebGL context.

## Implementation Phases

### Phase 1 — Core Widget (this PR)
- Install `l2d-widget`, create `Live2DWidget` with basic rendering
- Single model, bottom-left on all non-admin/embed pages
- `Live2DContext` with idle state only
- Basic tips from i18n messages
- Menu: Hide + basic items

### Phase 2 — Page Awareness & ChatBot Tie-In
- Page-type detection and positioning
- ChatBot state sync (listening/thinking/speaking)
- Sleep/wake behavior

### Phase 3 — Polish
- Multi-model support
- Homepage hero placement
- Time-of-day greetings
- Smooth page transitions
- Visual refinement (primaryColor matching site theme)

## Testing

- Widget mounts/destroys cleanly across page navigations
- SSR does not throw (canvas code gated behind useEffect)
- Mobile breakpoint hides widget
- Admin/embed routes do not render widget
- localStorage persists hide/mute preferences
- ChatBot state changes propagate correctly
- i18n messages render in current locale

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Model file hosting (CORS) | Host model `.json` + textures on our own CDN or use proxy API route |
| WebGL context loss on navigation | Destroy/recreate via useEffect cleanup |
| Performance on low-end devices | 260px default size, skip on mobile, `will-change: transform` hint |
| l2d-widget API changes | Pin version, wrap in our own abstraction |
