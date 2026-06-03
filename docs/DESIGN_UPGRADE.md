# Genesis AI Micro-Game Engine — Visual Upgrade Design Document

> **Style**: Cyberpunk/Neon Tech + Huawei Brand (Red #CF0A2C, Gold #FFD700)
> **Target**: Transform the functional but plain demo into a visually stunning, fun, and polished experience
> **Last Updated**: 2026-06-03

---

## Table of Contents

1. [Design Tokens & Color Palette](#1-design-tokens--color-palette)
2. [Typography](#2-tography)
3. [Animated Background System](#3-animated-background-system)
4. [Main Menu Screen Overhaul](#4-main-menu-screen-overhaul)
5. [AI Lab Panel Overhaul](#5-ai-lab-panel-overhaul)
6. [Game Play UI Overhaul](#6-game-play-ui-overhaul)
7. [Tab-Specific Visual Enhancements](#7-tab-specific-visual-enhancements)
8. [Micro-Interactions & Animation Library](#8-micro-interactions--animation-library)
9. [Toast Notification System](#9-toast-notification-system)
10. [Responsive Breakpoints](#10-responsive-breakpoints)
11. [Implementation Priority & Phasing](#11-implementation-priority--phasing)

---

## 1. Design Tokens & Color Palette

### 1.1 CSS Custom Properties — Replace the existing `:root` block

**Current** (line 9):
```css
:root{--bg:#1A1A2E;--bg2:#16213E;--accent:#CF0A2C;--gold:#FFD700;--text:#E0E0E0;--card:#0F3460;--dim:#8A8A9A}
```

**Replace with**:
```css
:root {
  /* === Background Layers === */
  --bg-primary: #0a0a1a;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #0d1b2a;
  --bg-card: rgba(26, 26, 46, 0.7);
  --bg-card-solid: #1a1a2e;
  --bg-elevated: rgba(15, 15, 35, 0.85);
  --bg-glass: rgba(26, 26, 46, 0.55);
  --bg-old: #1A1A2E;
  --bg2: #16213E;

  /* === Neon Palette === */
  --neon-red: #CF0A2C;
  --neon-red-bright: #ff1a47;
  --neon-gold: #FFD700;
  --neon-gold-dim: rgba(255, 215, 0, 0.5);
  --neon-cyan: #00f5ff;
  --neon-purple: #b026ff;
  --neon-green: #39ff14;
  --neon-pink: #ff6f91;

  /* === Semantic Aliases (backward compat) === */
  --accent: #CF0A2C;
  --gold: #FFD700;
  --text: #ffffff;
  --text-secondary: #a0a0b0;
  --dim: #8A8A9A;
  --card: #0F3460;

  /* === Border Glow === */
  --border-glow: rgba(0, 245, 255, 0.3);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-medium: rgba(255, 255, 255, 0.12);

  /* === Shadows === */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-neon-red: 0 0 20px rgba(207, 10, 44, 0.4);
  --shadow-neon-gold: 0 0 20px rgba(255, 215, 0, 0.4);
  --shadow-neon-cyan: 0 0 20px rgba(0, 245, 255, 0.4);

  /* === Animation Timing === */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 0.15s;
  --duration-normal: 0.3s;
  --duration-slow: 0.6s;

  /* === Glass === */
  --glass-blur: 16px;
  --glass-border: 1px solid rgba(255, 255, 255, 0.08);

  /* === Radius === */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}
```

### 1.2 Game Category Color Map

Each game tag gets a dedicated neon accent color for hover borders and category tags:

```css
.tag-match3   { --tag-color: #CF0A2C; }
.tag-rhythm   { --tag-color: #b026ff; }
.tag-memory   { --tag-color: #00f5ff; }
.tag-relax    { --tag-color: #39ff14; }
.tag-puzzle   { --tag-color: #FFD700; }
.tag-stroop   { --tag-color: #ff6f91; }
.tag-math     { --tag-color: #4B8BBE; }
.tag-action   { --tag-color: #FF9F43; }
.tag-word     { --tag-color: #6BCB77; }
.tag-reflex   { --tag-color: #ff1a47; }
```

---

## 2. Typography

### 2.1 Google Fonts Import — Add to `<head>` before `</head>`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 2.2 Font Usage Rules

| Element | Font | Weight | Notes |
|---------|------|--------|-------|
| `#menu-screen h1` (GENESIS logo) | Orbitron | 900 | Neon glow animation |
| `#menu-screen .subtitle` | Orbitron | 500 | Letter-spacing: 6px |
| `.game-card h2` | Orbitron | 700 | 15px |
| `.game-card .tag` | Inter | 600 | Uppercase, letter-spacing: 2px |
| `#game-title` | Orbitron | 700 | Neon glow |
| `#overlay h2` | Orbitron | 900 | Game Over text |
| `#ai-lab-header h2` | Orbitron | 900 | |
| `.ai-tab` | Inter | 500 | |
| `.ai-tab.active` | Inter | 700 | |
| All section headings (`h3`) | Inter | 700 | |
| Body text, descriptions, labels | Inter | 400-500 | |
| `.ai-lab-badge` | Orbitron | 700 | |

### 2.3 CSS Changes

```css
/* Update body font-family */
body {
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* Logo heading */
#menu-screen h1 {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(32px, 7vw, 56px);
  letter-spacing: 16px;
}

/* Subtitle */
#menu-screen .subtitle {
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  letter-spacing: 6px;
}

/* Game card titles */
.game-card h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 15px;
}

/* Category tags — uppercase + letter-spacing */
.game-card .tag {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  letter-spacing: 2px;
}

/* Game HUD title */
#game-title {
  font-family: 'Orbitron', sans-serif;
}

/* Overlay headings */
#overlay h2 {
  font-family: 'Orbitron', sans-serif;
}

/* AI Lab header */
#ai-lab-header h2 {
  font-family: 'Orbitron', sans-serif;
}

/* AI Lab badge */
.ai-lab-badge {
  font-family: 'Orbitron', sans-serif;
}
```

---

## 3. Animated Background System

### 3.1 Body Background Gradient

**Replace** body background (line 10):

```css
body {
  background: linear-gradient(
    135deg,
    #0a0a1a 0%,
    #1a1a2e 35%,
    #0d1b2a 70%,
    #0a0a1a 100%
  );
  background-size: 400% 400%;
  animation: bg-drift 20s ease infinite;
  position: relative;
}

@keyframes bg-drift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### 3.2 Particle Field (Floating Stars) — Add as `<div>` + CSS + JS

**HTML** — Insert right after `<body>`:
```html
<div id="particles" aria-hidden="true"></div>
<canvas id="grid-canvas" aria-hidden="true"></canvas>
```

**CSS**:
```css
#particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

#particles .particle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 245, 255, 0.8), rgba(0, 245, 255, 0));
  animation: particle-drift linear infinite;
  opacity: 0;
}

@keyframes particle-drift {
  0% {
    opacity: 0;
    transform: translateY(0) translateX(0);
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) translateX(30px);
  }
}

/* Grid overlay */
#grid-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.06;
}
```

**JS** — Insert inside `<script>` at the top (after `const $ = id => ...`):
```javascript
/* ========== PARTICLE SYSTEM ========== */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const COUNT = 50;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 1 + Math.random() * 3;
    const left = Math.random() * 100;
    const duration = 15 + Math.random() * 30;
    const delay = Math.random() * duration;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${left}%;
      bottom: -10px;
      animation-duration: ${duration}s;
      animation-delay: -${delay}s;
    `;
    // Random color from neon palette
    const colors = [
      'radial-gradient(circle, rgba(0,245,255,0.9), rgba(0,245,255,0))',
      'radial-gradient(circle, rgba(207,10,44,0.7), rgba(207,10,44,0))',
      'radial-gradient(circle, rgba(255,215,0,0.6), rgba(255,215,0,0))',
      'radial-gradient(circle, rgba(176,38,255,0.6), rgba(176,38,255,0))',
    ];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    container.appendChild(p);
  }
})();

/* ========== GRID OVERLAY ========== */
(function initGrid() {
  const cv = document.getElementById('grid-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  function draw() {
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 0.5;
    const spacing = 60;
    for (let x = 0; x < cv.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cv.height);
      ctx.stroke();
    }
    for (let y = 0; y < cv.height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cv.width, y);
      ctx.stroke();
    }
  }
  draw();
  window.addEventListener('resize', draw);
})();
```

### 3.3 Aurora / Nebula Effect (CSS-only overlay)

**Add** after `#particles` CSS:

```css
/* Optional aurora blobs — add as pseudo-element on body or a dedicated div */
body::before {
  content: '';
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(207, 10, 44, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 245, 255, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%, rgba(176, 38, 255, 0.03) 0%, transparent 50%);
  animation: aurora-rotate 60s linear infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes aurora-rotate {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 3.4 Z-index Layering

Ensure all interactive screens sit above the background:

```css
#menu-screen,
#game-screen,
#ai-lab-screen {
  position: relative;
  z-index: 1;
}
```

---

## 4. Main Menu Screen Overhaul

### 4.1 GENESIS Logo — Neon Glow Animation

**Replace** `#menu-screen h1` (line 14):

```css
#menu-screen h1 {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(32px, 7vw, 56px);
  letter-spacing: 16px;
  color: var(--neon-gold);
  margin: 20px 0 6px;
  text-transform: uppercase;
  font-weight: 900;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.8),
    0 0 20px rgba(255, 215, 0, 0.6),
    0 0 40px rgba(255, 215, 0, 0.4),
    0 0 80px rgba(255, 215, 0, 0.2);
  animation: neon-pulse 3s ease-in-out infinite;
}

@keyframes neon-pulse {
  0%, 100% {
    text-shadow:
      0 0 10px rgba(255, 215, 0, 0.8),
      0 0 20px rgba(255, 215, 0, 0.6),
      0 0 40px rgba(255, 215, 0, 0.4),
      0 0 80px rgba(255, 215, 0, 0.2);
  }
  50% {
    text-shadow:
      0 0 5px rgba(255, 215, 0, 0.6),
      0 0 10px rgba(255, 215, 0, 0.4),
      0 0 20px rgba(255, 215, 0, 0.2),
      0 0 40px rgba(255, 215, 0, 0.1);
  }
}
```

### 4.2 Subtitle — Typing Effect

**Replace** `#menu-screen .subtitle` (line 15):

```css
#menu-screen .subtitle {
  font-family: 'Orbitron', sans-serif;
  color: var(--text-secondary);
  font-size: 11px;
  letter-spacing: 6px;
  margin-bottom: 24px;
  overflow: hidden;
  border-right: 2px solid var(--neon-cyan);
  white-space: nowrap;
  width: 0;
  animation:
    typing 2.5s steps(30, end) forwards,
    blink-caret 0.75s step-end infinite;
  animation-delay: 0.5s;
}

@keyframes typing {
  from { width: 0; }
  to   { width: 340px; }  /* adjust to text width */
}

@keyframes blink-caret {
  from, to { border-color: transparent; }
  50%      { border-color: var(--neon-cyan); }
}
```

> **Note**: The typing effect works best with a fixed-width container. On very small screens, reduce `width` target or skip the animation.

### 4.3 Game Count Badge — Animated Counter

**Change** subtitle HTML (line 462) from:

```html
<div class="subtitle">MICRO-GAME ENGINE &bull; 25 GAMES</div>
```

To:

```html
<div class="subtitle">MICRO-GAME ENGINE &bull; <span id="game-counter" data-target="25">0</span> GAMES</div>
```

**Add CSS**:
```css
#game-counter {
  color: var(--neon-cyan);
  font-weight: 700;
  display: inline-block;
}
```

**Add JS** (at bottom of script):
```javascript
/* Animated game counter */
(function animateCounter() {
  const el = document.getElementById('game-counter');
  if (!el) return;
  const target = parseInt(el.dataset.target);
  let current = 0;
  const step = Math.ceil(target / 20);
  const interval = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(interval); }
    el.textContent = current;
  }, 60);
})();
```

### 4.4 AI Lab Banner — Animated Gradient Border + Floating

**Replace** `.ai-lab-banner` (lines 18-27):

```css
.ai-lab-banner {
  width: 100%;
  max-width: 900px;
  margin-bottom: 24px;
  padding: 18px 24px;
  background: var(--bg-card);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: none;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all var(--duration-normal) var(--ease-out-expo);
  position: relative;
  overflow: hidden;
  z-index: 1;
  animation: banner-float 6s ease-in-out infinite;
}

/* Animated rainbow border */
.ai-lab-banner::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: conic-gradient(
    from 0deg,
    var(--neon-red),
    var(--neon-gold),
    var(--neon-green),
    var(--neon-cyan),
    var(--neon-purple),
    var(--neon-pink),
    var(--neon-red)
  );
  animation: border-spin 3s linear infinite;
  z-index: -2;
}

/* Inner mask to create border-only effect */
.ai-lab-banner::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(207, 10, 44, 0.08), rgba(26, 26, 46, 0.95));
  z-index: -1;
}

@keyframes border-spin {
  to { transform: rotate(360deg); }
}

@keyframes banner-float {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-4px); }
}

.ai-lab-banner:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 12px 40px rgba(207, 10, 44, 0.3), 0 0 60px rgba(0, 245, 255, 0.1);
}
```

### 4.5 AI Lab Badge — Pulsing Enhancement

**Replace** `.ai-lab-badge` (lines 32-34):

```css
.ai-lab-badge {
  margin-left: auto;
  padding: 6px 16px;
  background: linear-gradient(135deg, var(--neon-red), #e0103a);
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  border-radius: 20px;
  letter-spacing: 2px;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(207, 10, 44, 0.5), 0 0 24px rgba(207, 10, 44, 0.2);
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(207, 10, 44, 0.5), 0 0 24px rgba(207, 10, 44, 0.2);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 20px rgba(207, 10, 44, 0.7), 0 0 40px rgba(207, 10, 44, 0.3);
  }
}
```

### 4.6 Game Cards — Glass-morphism + Neon Hover + Staggered Entrance

**Replace** `#game-grid` and `.game-card` (lines 36-43):

```css
#game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 900px;
  padding: 0 10px;
}

.game-card {
  background: var(--bg-card);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out-expo);
  position: relative;
  overflow: hidden;
  /* Staggered entrance */
  opacity: 0;
  transform: translateY(30px);
  animation: card-entrance 0.5s var(--ease-out-expo) forwards;
}

/* Staggered entrance — applied via nth-child or JS */
.game-card:nth-child(1)  { animation-delay: 0.05s; }
.game-card:nth-child(2)  { animation-delay: 0.10s; }
.game-card:nth-child(3)  { animation-delay: 0.15s; }
.game-card:nth-child(4)  { animation-delay: 0.20s; }
.game-card:nth-child(5)  { animation-delay: 0.25s; }
.game-card:nth-child(6)  { animation-delay: 0.30s; }
.game-card:nth-child(7)  { animation-delay: 0.35s; }
.game-card:nth-child(8)  { animation-delay: 0.40s; }
.game-card:nth-child(9)  { animation-delay: 0.45s; }
.game-card:nth-child(10) { animation-delay: 0.50s; }

@keyframes card-entrance {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Neon border glow on hover — uses category-specific color */
.game-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--neon-cyan);
  box-shadow:
    0 8px 32px rgba(0, 245, 255, 0.15),
    0 0 0 1px rgba(0, 245, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Per-game category glow — assign .tag-* class to each card */
.game-card[data-tag="Match-3"]:hover  { border-color: #CF0A2C; box-shadow: 0 8px 32px rgba(207,10,44,0.25), 0 0 0 1px rgba(207,10,44,0.3); }
.game-card[data-tag="Rhythm"]:hover   { border-color: #b026ff; box-shadow: 0 8px 32px rgba(176,38,255,0.25), 0 0 0 1px rgba(176,38,255,0.3); }
.game-card[data-tag="Memory"]:hover   { border-color: #00f5ff; box-shadow: 0 8px 32px rgba(0,245,255,0.25), 0 0 0 1px rgba(0,245,255,0.3); }
.game-card[data-tag="Relax"]:hover    { border-color: #39ff14; box-shadow: 0 8px 32px rgba(57,255,20,0.2), 0 0 0 1px rgba(57,255,20,0.3); }
.game-card[data-tag="Puzzle"]:hover   { border-color: #FFD700; box-shadow: 0 8px 32px rgba(255,215,0,0.25), 0 0 0 1px rgba(255,215,0,0.3); }
.game-card[data-tag="Stroop"]:hover   { border-color: #ff6f91; box-shadow: 0 8px 32px rgba(255,111,145,0.25), 0 0 0 1px rgba(255,111,145,0.3); }
.game-card[data-tag="Math"]:hover     { border-color: #4B8BBE; box-shadow: 0 8px 32px rgba(75,139,190,0.25), 0 0 0 1px rgba(75,139,190,0.3); }
.game-card[data-tag="Action"]:hover   { border-color: #FF9F43; box-shadow: 0 8px 32px rgba(255,159,67,0.25), 0 0 0 1px rgba(255,159,67,0.3); }
.game-card[data-tag="Word"]:hover     { border-color: #6BCB77; box-shadow: 0 8px 32px rgba(107,203,119,0.25), 0 0 0 1px rgba(107,203,119,0.3); }
.game-card[data-tag="Reflex"]:hover   { border-color: #ff1a47; box-shadow: 0 8px 32px rgba(255,26,71,0.25), 0 0 0 1px rgba(255,26,71,0.3); }

.game-card:active {
  transform: scale(0.97);
  transition-duration: 0.1s;
}
```

#### Card Number Badge — Gradient Fill

**Replace** `.game-card .card-num` (line 40):

```css
.game-card .card-num {
  position: absolute;
  top: 10px;
  right: 14px;
  font-family: 'Orbitron', sans-serif;
  font-size: 32px;
  font-weight: 900;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(207, 10, 44, 0.08));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### Category Tag — Neon Underline

**Replace** `.game-card .tag` (line 43):

```css
.game-card .tag {
  display: inline-block;
  margin-top: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(0, 245, 255, 0.08);
  color: var(--neon-cyan);
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 600;
  border: 1px solid rgba(0, 245, 255, 0.15);
  position: relative;
}

.game-card .tag::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20%;
  right: 20%;
  height: 1px;
  background: var(--neon-cyan);
  box-shadow: 0 0 6px var(--neon-cyan);
  opacity: 0;
  transition: opacity var(--duration-normal);
}

.game-card:hover .tag::after {
  opacity: 1;
}
```

#### JS — Add `data-tag` to game cards

**Change** card creation in JS (line 629):

```javascript
// FROM:
card.innerHTML = '<div class="card-num">'+String(i+1).padStart(2,'0')+'</div><h2>'+g.name+'</h2><p>'+g.desc+'</p><div class="tag">'+g.tag+'</div>';

// TO:
card.setAttribute('data-tag', g.tag);
card.innerHTML = '<div class="card-num">'+String(i+1).padStart(2,'0')+'</div><h2>'+g.name+'</h2><p>'+g.desc+'</p><div class="tag">'+g.tag+'</div>';
```

---

## 5. AI Lab Panel Overhaul

### 5.1 Tab Bar — Neon Underline on Active + Horizontal Scroll Glow

**Replace** `#ai-lab-tabs`, `.ai-tab`, `.ai-tab.active` (lines 68-73):

```css
#ai-lab-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 16px;
  overflow-x: auto;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-subtle);
  scrollbar-width: none;
  position: relative;
  background: linear-gradient(to right, var(--bg-primary), transparent 10%, transparent 90%, var(--bg-primary));
}

#ai-lab-tabs::-webkit-scrollbar { display: none; }

.ai-tab {
  background: none;
  border: 1px solid transparent;
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  white-space: nowrap;
  transition: all var(--duration-normal) var(--ease-in-out);
  letter-spacing: 0.5px;
  position: relative;
}

.ai-tab:hover {
  color: var(--text);
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.ai-tab.active {
  background: rgba(207, 10, 44, 0.15);
  border-color: var(--neon-red);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(207, 10, 44, 0.2);
}

/* Neon underline indicator */
.ai-tab.active::after {
  content: '';
  position: absolute;
  bottom: -11px;
  left: 16px;
  right: 16px;
  height: 2px;
  background: var(--neon-red);
  box-shadow: 0 0 8px var(--neon-red);
  border-radius: 1px;
}
```

### 5.2 Content Area — Glass Panel

**Replace** `#ai-lab-content` (line 74):

```css
#ai-lab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

### 5.3 Tab Panel Transitions — Fade + Slide

**Replace** `.ai-panel` (lines 75-76):

```css
.ai-panel {
  display: none;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  opacity: 0;
  transform: translateX(20px);
}

.ai-panel.active {
  display: block;
  animation: panel-enter 0.4s var(--ease-out-expo) forwards;
}

.ai-panel.exit {
  display: block;
  animation: panel-exit 0.2s var(--ease-in-out) forwards;
}

@keyframes panel-enter {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes panel-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}
```

**Update `switchAITab` function** (line 797) for smooth transitions:

```javascript
function switchAITab(tab) {
  const currentPanel = document.querySelector('.ai-panel.active');
  const nextPanel = document.getElementById('tab-' + tab);

  // Update tab buttons
  document.querySelectorAll('.ai-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

  // Animate out current panel
  if (currentPanel && currentPanel !== nextPanel) {
    currentPanel.classList.add('exit');
    currentPanel.classList.remove('active');
    setTimeout(() => { currentPanel.classList.remove('exit'); }, 200);
  }

  // Animate in new panel
  setTimeout(() => {
    nextPanel.classList.add('active');
  }, 100);

  // Initialize tab content
  if (tab === 'recommend') updateRecommendations();
  if (tab === 'profile') drawRadarChart();
  if (tab === 'leaderboard') renderLeaderboard();
  if (tab === 'achievements') renderAchievements();
  if (tab === 'social') renderSocial();
  if (tab === 'analytics') renderAnalytics();
  if (tab === 'monetization') renderMonetization();
  if (tab === 'experiments') renderExperiments();
  if (tab === 'i18n') renderI18n();
}
```

### 5.4 AI Lab Header — Enhancement

**Replace** `#ai-lab-header` (lines 63-67):

```css
#ai-lab-header {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  background: var(--bg-elevated);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

#ai-lab-header h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  color: var(--neon-gold);
  letter-spacing: 3px;
  font-weight: 900;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}
```

### 5.5 Back Buttons — Always-visible Glow

**Replace** `#back-btn` and `#ai-back-btn` (lines 48-49, 64-65):

```css
#back-btn,
#ai-back-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  transition: all var(--duration-normal) var(--ease-out-expo);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

#back-btn:hover,
#ai-back-btn:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: 0 0 12px rgba(0, 245, 255, 0.2);
  text-shadow: 0 0 8px rgba(0, 245, 255, 0.5);
}
```

### 5.6 Glass Card Base Class

Add a reusable glass card style. Apply to all card-like containers (`.radar-wrap`, `.diff-meter-wrap`, `.trigger-card`, `.ach-card`, `.soc-section`, `.anl-metric`, etc.):

```css
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
```

Apply by adding `glass-card` class to:
- `.radar-wrap` (line 81)
- `.diff-meter-wrap` (line 124)
- `.diff-sim` (line 136)
- `.trigger-card` (line 151)
- `.trigger-priority` (line 172)
- `.ach-card` (line 242)
- `.soc-section` (line 265)
- `.anl-metric` (line 310)
- `.anl-chart-section` (line 314)
- `.anl-gauge-card` (line 326)
- `.mon-section` (line 338)
- `.exp-section` (line 384)
- `.i18n-section` (line 418)
- `.rec-card` (line 104)

---

## 6. Game Play UI Overhaul

### 6.1 HUD — Glass Effect + Neon-bordered Stats

**Replace** `#game-hud` and `.hud-stat` (lines 47-52):

```css
#game-hud {
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 8px;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border-subtle);
}

#game-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  color: var(--neon-gold);
  letter-spacing: 2px;
  font-weight: 700;
  flex: 1;
  text-align: center;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.hud-stat {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 215, 0, 0.15);
  background: rgba(255, 215, 0, 0.05);
}

.hud-stat span {
  color: var(--neon-gold);
  font-weight: 700;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
}
```

### 6.2 Canvas Area — Glow Border

**Replace** `#canvas-wrap` and `canvas` (lines 53-54):

```css
#canvas-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  padding: 12px;
}

canvas {
  display: block;
  border-radius: var(--radius-lg);
  touch-action: none;
  box-shadow:
    0 0 1px rgba(0, 245, 255, 0.4),
    0 0 8px rgba(0, 245, 255, 0.1),
    inset 0 0 1px rgba(0, 245, 255, 0.2);
  border: 1px solid rgba(0, 245, 255, 0.15);
}
```

### 6.3 Game Over Overlay — Dramatic Reveal

**Replace** `#overlay` (lines 55-59):

```css
#overlay {
  position: absolute;
  inset: 0;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 26, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--radius-lg);
  z-index: 10;
  opacity: 0;
  transform: scale(0.9);
}

#overlay.show {
  animation: overlay-reveal 0.5s var(--ease-out-expo) forwards;
}

@keyframes overlay-reveal {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

#overlay h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 36px;
  color: var(--neon-gold);
  margin-bottom: 8px;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.8),
    0 0 20px rgba(255, 215, 0, 0.5),
    0 0 40px rgba(255, 215, 0, 0.3);
  letter-spacing: 6px;
}

#overlay p {
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
}

#overlay button {
  background: linear-gradient(135deg, var(--neon-red), #e0103a);
  color: #fff;
  border: none;
  padding: 14px 36px;
  border-radius: var(--radius-md);
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 2px;
  transition: all var(--duration-normal) var(--ease-out-expo);
  box-shadow: 0 0 20px rgba(207, 10, 44, 0.3);
}

#overlay button:hover {
  background: linear-gradient(135deg, #e0103a, #ff1a47);
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(207, 10, 44, 0.5);
}
```

**Update `showOverlay` function** (line 665):

```javascript
function showOverlay(title, msg, btnText, cb) {
  $('ov-title').textContent = title;
  $('ov-msg').textContent = msg;
  $('ov-btn').textContent = btnText;
  const overlay = $('overlay');
  overlay.style.display = 'flex';
  // Trigger animation
  requestAnimationFrame(() => overlay.classList.add('show'));
  $('ov-btn').onclick = cb;
}

function hideOverlay() {
  const overlay = $('overlay');
  overlay.classList.remove('show');
  setTimeout(() => { overlay.style.display = 'none'; }, 200);
}
```

### 6.4 Score Counting Animation

**Update `endGame` function** (line 670):

```javascript
function endGame() {
  cancelAnimationFrame(animId);
  clearInterval(timerInterval);
  currentGame && GAMES[currentGame].cleanup && GAMES[currentGame].cleanup();
  showOverlay('GAME OVER', '', 'Play Again', () => { hideOverlay(); launchGame(currentGame); });
  // Animate score count
  const msgEl = $('ov-msg');
  animateNumber(msgEl, 0, score, 800, (val) => 'Final Score: ' + val);
}

function animateNumber(el, from, to, duration, formatter) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(from + (to - from) * eased);
    el.textContent = formatter ? formatter(current) : current;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
```

---

## 7. Tab-Specific Visual Enhancements

### 7.1 User Profile (用户画像) — Radar Chart Glow

**Replace** `.radar-wrap` (line 81):

```css
.radar-wrap {
  background: var(--bg-card);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid rgba(0, 245, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.05);
}
```

**Enhance radar chart drawing** — update `drawRadarChart()` function (line 838):

In the gradient fill section, change:
```javascript
// Replace the fill gradient:
const fillGrad = c.createRadialGradient(cx, cy, 0, cx, cy, maxR);
fillGrad.addColorStop(0, 'rgba(0, 245, 255, 0.08)');
fillGrad.addColorStop(0.5, 'rgba(207, 10, 44, 0.15)');
fillGrad.addColorStop(1, 'rgba(207, 10, 44, 0.35)');

// Replace the stroke:
c.strokeStyle = '#00f5ff';
c.lineWidth = 2.5;
c.shadowColor = 'rgba(0, 245, 255, 0.5)';
c.shadowBlur = 8;
c.stroke();
c.shadowBlur = 0;
```

### 7.2 Leaderboard (排行榜) — Rank Badges with Glow

**Replace** `.lb-rank-header` (lines 196-199):

```css
.lb-rank-header {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(207, 10, 44, 0.06));
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.08);
}

.lb-rank-header .lb-rank-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 48px;
  font-weight: 900;
  color: var(--neon-gold);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}
```

**Enhance rank display** — in `renderLeaderboard()` (line 982), update the rank rendering:

```javascript
// Change rank display for top 3:
const rankDisplay = rank <= 3
  ? '<span style="font-size:20px;filter:drop-shadow(0 0 6px rgba(255,215,0,0.6))">' + medals[rank-1] + '</span>'
  : rank;
```

**Add animated row entrance CSS**:

```css
.lb-table tr {
  animation: row-slide-in 0.3s var(--ease-out-expo) forwards;
  opacity: 0;
  transform: translateX(-10px);
}

.lb-table tr:nth-child(1)  { animation-delay: 0.05s; }
.lb-table tr:nth-child(2)  { animation-delay: 0.10s; }
.lb-table tr:nth-child(3)  { animation-delay: 0.15s; }
.lb-table tr:nth-child(4)  { animation-delay: 0.20s; }
.lb-table tr:nth-child(5)  { animation-delay: 0.25s; }
.lb-table tr:nth-child(6)  { animation-delay: 0.30s; }
.lb-table tr:nth-child(7)  { animation-delay: 0.35s; }
.lb-table tr:nth-child(8)  { animation-delay: 0.40s; }
.lb-table tr:nth-child(9)  { animation-delay: 0.45s; }
.lb-table tr:nth-child(10) { animation-delay: 0.50s; }

/* Prevent thead from animating */
.lb-table thead tr {
  animation: none;
  opacity: 1;
  transform: none;
}

@keyframes row-slide-in {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### 7.3 Achievement Wall (成就墙) — Rarity-Specific Glow + Unlock Animation

**Enhance** `.ach-card` rarity styles (lines 242-261):

```css
/* Legendary golden pulse */
.ach-card.legendary-glow {
  animation: legendary-breathe 2s ease-in-out infinite;
}

@keyframes legendary-breathe {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.2), 0 0 20px rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.6);
  }
}

/* Epic purple glow */
.ach-card.unlocked .ach-rarity.epic {
  box-shadow: 0 0 12px rgba(132, 94, 194, 0.3);
  animation: epic-pulse 3s ease-in-out infinite alternate;
}

@keyframes epic-pulse {
  from { box-shadow: 0 0 8px rgba(132, 94, 194, 0.2); }
  to   { box-shadow: 0 0 16px rgba(132, 94, 194, 0.5); }
}

/* Achievement unlock animation */
.ach-card.just-unlocked {
  animation: ach-unlock 0.8s var(--ease-out-back) forwards;
}

@keyframes ach-unlock {
  0% {
    opacity: 0;
    transform: scale(0.5) rotateY(90deg);
    filter: brightness(3);
  }
  50% {
    filter: brightness(2);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateY(0deg);
    filter: brightness(1);
  }
}
```

**In `renderAchievements()`**, add `legendary-glow` class to legendary unlocked cards:

```javascript
// In the card HTML, modify for legendary:
const extraClass = (a.unlocked && a.rarity === 'legendary') ? ' legendary-glow' : '';
html += '<div class="ach-card ' + (a.unlocked ? 'unlocked' : 'locked') + extraClass + '">';
```

### 7.4 Social (社交) — Online Pulse + Avatar Ring Glow

**Replace** `.soc-online` (lines 274-277):

```css
.soc-online.on {
  background: var(--neon-green);
  box-shadow: 0 0 8px rgba(57, 255, 20, 0.6);
  animation: online-pulse 2s ease-in-out infinite;
}

.soc-online.off {
  background: #444;
}

@keyframes online-pulse {
  0%, 100% {
    box-shadow: 0 0 4px rgba(57, 255, 20, 0.4);
  }
  50% {
    box-shadow: 0 0 12px rgba(57, 255, 20, 0.8);
  }
}
```

**Avatar ring glow on hover**:

```css
.soc-friend-avatar {
  transition: box-shadow var(--duration-normal);
}

.soc-friend:hover .soc-friend-avatar {
  box-shadow: 0 0 12px rgba(0, 245, 255, 0.4);
}
```

### 7.5 Data Analytics (数据分析) — Neon Chart Bars + Metric Pulse

**Enhance** `.anl-metric` (line 310):

```css
.anl-metric {
  background: var(--bg-card);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  transition: all var(--duration-normal);
  position: relative;
}

.anl-metric::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--neon-red), var(--neon-gold));
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  opacity: 0;
  transition: opacity var(--duration-normal);
}

.anl-metric:hover::before {
  opacity: 1;
}

.anl-metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.anl-metric .anl-metric-val {
  font-family: 'Orbitron', sans-serif;
  font-size: 22px;
  font-weight: 900;
  color: var(--neon-gold);
  margin-bottom: 4px;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.anl-metric .anl-metric-label {
  font-size: 10px;
  color: var(--text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
}
```

**Chart bars — Neon gradient fills** — update `drawPopChart()` (line 1177):

```javascript
// Replace bar gradient:
const grad = c.createLinearGradient(padL, 0, padL + barW, 0);
grad.addColorStop(0, '#00f5ff');
grad.addColorStop(0.5, '#b026ff');
grad.addColorStop(1, '#CF0A2C');
```

Update `drawPeakChart()` (line 1214):
```javascript
// Replace bar gradient:
grad.addColorStop(0, '#00f5ff');
grad.addColorStop(1, 'rgba(176, 38, 255, 0.5)');
```

---

## 8. Micro-Interactions & Animation Library

### 8.1 Button Hover — Scale + Glow

**Universal button enhancement**:

```css
button,
.diff-btn,
.soc-challenge-btn,
.mon-shop-btn,
.mon-ad-btn,
.lb-time-btn,
.ach-filter-btn,
.i18n-lang-btn {
  transition: all var(--duration-normal) var(--ease-out-expo);
}

button:hover,
.diff-btn:hover,
.soc-challenge-btn:hover {
  transform: translateY(-1px) scale(1.03);
  filter: brightness(1.1);
}

button:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}
```

### 8.2 Count-Up Animation Utility

Already covered in section 6.4 (score counting). The `animateNumber()` utility can be reused for any metric:

```javascript
// Usage examples:
animateNumber(element, 0, 12458, 1000, (v) => v.toLocaleString());
animateNumber(element, 0, 78, 600, (v) => v + '%');
```

### 8.3 Slide-in from Bottom (for new items)

```css
.slide-in-up {
  animation: slide-in-up 0.4s var(--ease-out-back) forwards;
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Apply to:
- Recommendation cards (`.rec-card`) — add `slide-in-up` class with staggered delays
- Social feed items (`.soc-feed-item`)
- New achievement unlocks

### 8.4 Confidence Bar Animation — Shimmer

Add to `.confidence-fill`:

```css
.confidence-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
  background: linear-gradient(90deg, var(--neon-red), var(--neon-gold));
  position: relative;
  overflow: hidden;
}

.confidence-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { left: -100%; }
  100% { left: 100%; }
}
```

---

## 9. Toast Notification System

### 9.1 HTML Structure

Add to `<body>` before `</body>`:

```html
<div id="toast-container"></div>
```

### 9.2 CSS

```css
#toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;
}

.toast {
  padding: 12px 20px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--border-medium);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: toast-in 0.4s var(--ease-out-back) forwards;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 320px;
}

.toast.toast-out {
  animation: toast-out 0.3s var(--ease-in-out) forwards;
}

.toast-success { border-left: 3px solid var(--neon-green); }
.toast-info    { border-left: 3px solid var(--neon-cyan); }
.toast-warning { border-left: 3px solid var(--neon-gold); }
.toast-error   { border-left: 3px solid var(--neon-red); }

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(60px);
  }
}
```

### 9.3 JS API

```javascript
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  const icons = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' };
  toast.innerHTML = '<span style="font-size:16px">' + (icons[type] || 'ℹ') + '</span><span>' + message + '</span>';

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
```

### 9.4 Integration Points

Replace all `alert()` calls with toasts:

| Current | Replace With |
|---------|-------------|
| `alert('Challenge sent to '+f.name+'!')` | `showToast('Challenge sent to ' + f.name + '!', 'success')` |
| `alert('Accepting challenge from '+c.from+'!')` | `showToast('Challenge accepted!', 'info')` |
| `alert('Pick a friend to challenge!')` | `showToast('Select a friend first', 'warning')` |
| `alert('Result shared!')` | `showToast('Result shared!', 'success')` |
| `alert('Purchased: '+item.name)` | `showToast('Purchased: ' + item.name + ' (' + item.price + ')', 'success')` |
| `alert('Requires Bronze tier or above')` | `showToast('Requires Bronze tier or above', 'error')` |

---

## 10. Responsive Breakpoints

### 10.1 Mobile Adaptations

```css
@media (max-width: 600px) {
  /* Reduce particle count */
  #particles .particle:nth-child(n+20) { display: none; }

  /* Logo smaller */
  #menu-screen h1 {
    font-size: 28px;
    letter-spacing: 8px;
  }

  /* Subtitle — skip typing animation */
  #menu-screen .subtitle {
    animation: none;
    width: auto;
    border-right: none;
  }

  /* Single column cards */
  #game-grid {
    grid-template-columns: 1fr;
  }

  /* Tighter padding */
  #game-hud {
    padding: 8px 10px;
  }

  #game-title {
    font-size: 12px;
    letter-spacing: 1px;
  }

  /* Profile single column */
  .profile-layout {
    grid-template-columns: 1fr;
  }

  /* Triggers single column */
  .trigger-grid {
    grid-template-columns: 1fr;
  }

  /* Achievements 2-col */
  .ach-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Analytics 2-col metrics */
  .anl-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 400px) {
  .ach-grid {
    grid-template-columns: 1fr;
  }

  .anl-metrics {
    grid-template-columns: 1fr 1fr;
  }

  /* Smaller toast */
  .toast {
    font-size: 12px;
    padding: 10px 14px;
    max-width: 260px;
  }
}
```

---

## 11. Implementation Priority & Phasing

### Phase 1 — Foundation (Highest Impact, ~30 min)

| # | Task | Section Ref |
|---|------|-------------|
| 1 | Replace `:root` with new design tokens | 1.1 |
| 2 | Add Google Fonts (Orbitron + Inter) | 2.1 |
| 3 | Update body background gradient + `bg-drift` animation | 3.1 |
| 4 | Add particle system + grid overlay | 3.2 |
| 5 | Add z-index layering for screens | 3.4 |
| 6 | Neon glow on GENESIS logo | 4.1 |
| 7 | Glass-morphism on game cards + staggered entrance | 4.6 |
| 8 | Per-tag neon hover glow on cards | 4.6 |

### Phase 2 — AI Lab Polish (~20 min)

| # | Task | Section Ref |
|---|------|-------------|
| 9 | AI Lab banner animated border + float | 4.4 |
| 10 | Tab bar neon underline + smooth transition | 5.1, 5.3 |
| 11 | Glass card base class applied to all panels | 5.6 |
| 12 | Back button glow effect | 5.5 |

### Phase 3 — Game HUD + Overlay (~15 min)

| # | Task | Section Ref |
|---|------|-------------|
| 13 | HUD glass effect + neon stat boxes | 6.1 |
| 14 | Canvas glow border | 6.2 |
| 15 | Game Over overlay dramatic reveal | 6.3 |
| 16 | Score counting animation | 6.4 |

### Phase 4 — Tab Enhancements (~25 min)

| # | Task | Section Ref |
|---|------|-------------|
| 17 | Radar chart glow upgrade | 7.1 |
| 18 | Leaderboard rank glow + row entrance | 7.2 |
| 19 | Achievement rarity glow + unlock animation | 7.3 |
| 20 | Social online pulse + avatar glow | 7.4 |
| 21 | Analytics neon chart bars + metric hover | 7.5 |

### Phase 5 — Polish & Interactions (~15 min)

| # | Task | Section Ref |
|---|------|-------------|
| 22 | Toast notification system | 9 |
| 23 | Replace all `alert()` with `showToast()` | 9.4 |
| 24 | Universal button hover glow | 8.1 |
| 25 | Confidence bar shimmer | 8.4 |
| 26 | Responsive breakpoint adjustments | 10 |
| 27 | Subtitle typing effect | 4.2 |
| 28 | Game count animated counter | 4.3 |
| 29 | Aurora nebula background | 3.3 |

---

## Appendix A: Quick Reference — Complete CSS Variable Map

```
Token                    Value                           Usage
────────────────────────────────────────────────────────────────
--bg-primary             #0a0a1a                         Body gradient start
--bg-secondary           #1a1a2e                         Body gradient mid
--bg-tertiary            #0d1b2a                         Body gradient end
--bg-card                rgba(26, 26, 46, 0.7)           All card backgrounds
--bg-glass               rgba(26, 26, 46, 0.55)          HUD, tab content
--bg-elevated            rgba(15, 15, 35, 0.85)          Header backgrounds
--neon-red               #CF0A2C                         Accent, active states
--neon-gold              #FFD700                          Scores, titles, badges
--neon-cyan              #00f5ff                          Borders, particles, grid
--neon-purple            #b026ff                          Accent variety
--neon-green             #39ff14                          Online status, success
--neon-pink              #ff6f91                          Accent variety
--text                   #ffffff                          Primary text
--text-secondary         #a0a0b0                          Dimmed text
--border-glow            rgba(0, 245, 255, 0.3)          Neon border effect
--glass-blur             16px                             Backdrop-filter blur
--radius-lg              16px                             Card radius
```

## Appendix B: Font Loading Fallback

If Google Fonts fail to load, ensure fallbacks are graceful:

```css
/* System font fallback stack */
font-family: 'Orbitron', 'Rajdhani', 'Share Tech Mono', monospace;  /* headings */
font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;  /* body */
```

## Appendix C: Performance Considerations

1. **Particles**: Limit to 50 on desktop, 20 on mobile. Use CSS transforms only (no layout triggers).
2. **Backdrop-filter**: Apply only to elements that are visible on screen. Avoid on elements inside scrollable containers.
3. **Animations**: Use `will-change: transform, opacity` on animated elements. Remove after animation completes for heavy elements.
4. **Canvas rendering**: Keep existing game loop optimizations. The grid overlay canvas is drawn once and only redrawn on resize.
5. **Box-shadow glow**: Multiple layered shadows are GPU-friendly but avoid more than 3 per element at rest.

---

*End of Design Document*
