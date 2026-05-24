# README Redesign — Design Spec

**Date:** 2026-05-23  
**Status:** Approved

---

## Goal

Enhance the GitHub profile README with color and visual richness without changing any of the existing copy, structure, or minimalist essence.

---

## Palette — Generative Art

| Role | Color | Hex |
|---|---|---|
| Background (GitHub dark) | Near-black | `#0d1117` |
| Hot pink (Java, Generative Art) | Electric pink | `#f72585` |
| Deep violet (Spring) | Purple | `#7209b7` |
| Electric cyan (AI/ML) | Cyan | `#4cc9f0` |
| Blue (Piano) | Indigo-blue | `#4361ee` |
| Gold (Books) | Warm yellow | `#f4d03f` |

---

## Structure (unchanged copy)

All original text is preserved word-for-word. No new sections are added.

```
[gradient line: pink → violet → cyan]
[ASCII art: AMY — inside code block, unchanged]
[gradient line: cyan → violet → pink]

· · · · · · · · · · · · ·

dev based in brazil.
building backend (java/spring) & ai/ml by day.
leading teams — the stressful, beautiful two sides of the same coin.

[tech badges: java | spring | ai/ml]

outside the terminal:
piano keys, generative art, and the art of living.
finding focus in books; i build for work, but i create for myself.

[interest badges: piano | generative art | books]

· · · · · · · · · · · · ·

the best code i write is the code nobody asked for.
```

---

## Components

### Gradient Lines
- **Tool:** `capsule-render.vercel.app`
- **Type:** `rect`, height 3px
- **Top line:** pink → violet → cyan  
- **Bottom line:** cyan → violet → pink (reversed direction)
- Placed directly above and below the code block containing the ASCII art

### Tech Badges (after backend line)
- **Tool:** `shields.io` with `for-the-badge` or `flat-square` style
- `java` — pink `#f72585`, Spring/OpenJDK logo
- `spring` — violet `#7209b7`, Spring logo
- `ai/ml` — cyan `#4cc9f0`, no logo or sparkle icon

### Interest Badges (after outside-the-terminal section)
- `piano` — indigo-blue `#4361ee`
- `generative art` — pink `#f72585`
- `books` — gold `#f4d03f`

### Badge Style
- Outline pill style: dark background `#0d0d1a`, colored border and text
- Monospace font feel via label text only (no emoji)
- Uses shields.io `style=flat-square` with `color` and `labelColor` params

---

## What Does NOT Change
- Every word of the bio
- The ASCII art block (inside its code fence)
- The `· · · · · · · · · · · · ·` separators
- The closing italic quote
- The lowercase, minimalist tone

---

## Implementation Notes
- The entire current README is wrapped in one code block — this needs to be unwrapped
- Gradient lines use `<img>` tags pointing to capsule-render (GitHub renders these)
- Badges use `<img>` tags pointing to shields.io
- No HTML `<div>` wrappers needed — left-aligned layout works with the minimalist tone
- `.superpowers/` should be added to `.gitignore`
