# OMS Design System — Agent Instructions

> **Open Microservice Specification** · Brand & UI Guidelines
> Feed this file to any frontend agent, Cursor, Copilot, or AI code assistant.
> These rules are non-negotiable. Follow them exactly when building any UI for this platform.

---

## 1. Identity

| Property     | Value                                            |
| ------------ | ------------------------------------------------ |
| Product name | Open Microservice Specification                  |
| Short name   | OMS                                              |
| Tagline      | Design for precision. Built for developers.      |
| Tone         | Technical, minimal, precise. No marketing fluff. |
| Audience     | Software developers, DevOps, platform engineers  |

---

## 2. Color System

Use these exact hex values. Do not approximate or substitute.

### Primary Palette

```css
/* Action & brand */
--color-blue-primary: #2563eb; /* Primary buttons, links, active tabs, focus rings */
--color-blue-dark: #1d4ed8; /* Hover state on primary blue */
--color-blue-tint: #eff6ff; /* Blue backgrounds, chips, code highlights */
--color-blue-mid: #bfdbfe; /* Blue borders, selected state outlines */

/* Semantic */
--color-success: #16a34a; /* Completeness indicator, success badges ONLY */
--color-success-light: #dcfce7; /* Success badge background */
--color-warning: #f59e0b; /* Warning states */
--color-warning-light: #fffbeb; /* Warning badge background */
--color-danger: #ef4444; /* Error states, destructive actions */
--color-danger-light: #fef2f2; /* Danger badge background */

/* Neutrals — slate scale */
--color-ink: #0f172a; /* Dark panels (YAML bg, code blocks) */
--color-gray-900: #1e293b; /* Primary text */
--color-gray-700: #334155; /* Secondary text, button labels */
--color-gray-500: #64748b; /* Muted labels, metadata, placeholders */
--color-gray-400: #94a3b8; /* Disabled text, tertiary info */
--color-gray-300: #cbd5e1; /* Input borders, dividers */
--color-gray-200: #e2e8f0; /* Panel borders, table borders */
--color-gray-100: #f1f5f9; /* Secondary button bg, tag bg */
--color-gray-50: #f8fafc; /* Sidebar bg, panel bg, page bg */
--color-white: #ffffff; /* Card bg, editor bg, result panel bg */

/* Code syntax (inside dark panels only) */
--code-key: #93c5fd; /* YAML keys, property names */
--code-value: #86efac; /* Numbers, booleans */
--code-string: #fca5a5; /* String values */
--code-muted: rgba(255, 255, 255, 0.35); /* Indentation, comments */
```

### Color Rules

- `--color-blue-primary` is used **only** for interactive elements (buttons, links, active tab underline, focus rings).
- `--color-success` (#16A34A) is used **only** for the Completeness indicator and success states. Do NOT use green for decoration.
- Elevation is expressed through **background contrast only** — white cards on gray-50 surfaces, gray-50 panels on white. **Never use box-shadows.**
- Dark panels (`--color-ink`: #0F172A) are reserved for YAML editors, code output, and log consoles.

---

## 3. Typography

### Font Stack

```css
/* UI font — system sans-serif stack */
--font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;

/* Monospace — for ALL code, paths, YAML, IDs, routes */
--font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code", "Menlo", monospace;
```

### Type Scale

| Token               | Size | Weight | Line-height | Usage                                               |
| ------------------- | ---- | ------ | ----------- | --------------------------------------------------- |
| `text-page-title`   | 20px | 500    | 1.3         | Top-level page/product name                         |
| `text-section-head` | 16px | 500    | 1.4         | Panel headers, section titles                       |
| `text-body`         | 14px | 400    | 1.6         | All body copy, descriptions                         |
| `text-small`        | 12px | 400    | 1.5         | Timestamps, IDs, history items                      |
| `text-overline`     | 11px | 500    | 1           | Section labels (uppercase + letter-spacing: 0.08em) |
| `text-code`         | 13px | 400    | 1.7         | Inline code, YAML, routes (font-mono)               |
| `text-log`          | 12px | 400    | 1.6         | Console output (font-mono)                          |

### Typography Rules

- **Only two font weights**: 400 (regular) and 500 (medium). Never use 600, 700, or bold.
- **Sentence case** everywhere. Never ALL CAPS in headings. Overline labels use `text-transform: uppercase` via CSS only.
- All code, paths (`/health`, `/getAllUsers`), action names, YAML keys/values, port numbers, and route strings **must** use `--font-mono`.
- UI sans-serif font is used for everything else: labels, body, buttons, badges, tabs.

---

## 4. Spacing System

Base unit: **4px**. All spacing values must be multiples of 4.

```css
--space-1: 4px; /* Icon gaps, tight inline padding */
--space-2: 8px; /* Button internal padding, badge padding */
--space-3: 12px; /* Card padding (compact), tab gaps */
--space-4: 16px; /* Default card/panel padding, form field gaps */
--space-6: 24px; /* Section spacing, sidebar unit */
--space-8: 32px; /* Large section gaps */
--space-10: 40px; /* Page margins, major panel separation */
```

---

## 5. Border Radius

```css
--radius-xs: 2px; /* Tags, inline chips */
--radius-sm: 4px; /* Inputs, code blocks, dropdowns */
--radius-md: 6px; /* Buttons, small panels */
--radius-lg: 10px; /* Cards, modals, popovers */
--radius-full: 9999px; /* Status pills, badges */
```

---

## 6. Border Style

```css
/* Standard border — use on all panels, cards, inputs */
border: 0.5px solid #e2e8f0; /* --color-gray-200 */

/* Emphasis border — hover states, focused containers */
border: 0.5px solid #cbd5e1; /* --color-gray-300 */

/* Active border — selected items, active panels */
border: 1px solid #2563eb; /* --color-blue-primary */
```

**Rule**: Use 0.5px borders everywhere except active/selected states which use 1px.

---

## 7. Elevation

OMS uses **zero drop shadows**. Depth is communicated through layered background colors only.

| Layer             | Background                        | Used for                        |
| ----------------- | --------------------------------- | ------------------------------- |
| Page / base       | `#F8FAFC` (gray-50)               | App background                  |
| Sidebar           | `#F8FAFC` (gray-50)               | Left navigation panel           |
| Panel / card      | `#FFFFFF` (white)                 | Main content areas, cards       |
| Topbar            | `#FFFFFF` (white) + bottom border | Fixed navigation bar            |
| Code / dark panel | `#0F172A` (ink)                   | YAML editor, result panel, logs |
| Overlay (modal)   | `#FFFFFF` (white) + 1px border    | Dialogs, popovers               |

**Never add `box-shadow` to any element.**

---

## 8. Component Specifications

### 8.1 Buttons

```css
/* Primary */
.btn-primary {
  background: #2563eb;
  color: #ffffff;
  padding: 7px 16px;
  border-radius: 6px; /* --radius-md */
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
.btn-primary:hover {
  background: #1d4ed8;
}

/* Secondary */
.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: 0.5px solid #e2e8f0;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #e2e8f0;
}

/* Ghost / text button */
.btn-ghost {
  background: transparent;
  color: #2563eb;
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: 0.5px solid #bfdbfe;
  cursor: pointer;
}
.btn-ghost:hover {
  background: #eff6ff;
}

/* Danger */
.btn-danger {
  background: #fef2f2;
  color: #991b1b;
  border: 0.5px solid #fecaca;
  /* same sizing as secondary */
}

/* Small variant — subtract 2px vertical padding, reduce font to 13px */
.btn-sm {
  padding: 5px 12px;
  font-size: 13px;
}
```

**Button rules:**

- Primary blue buttons: reserved for the single most important action per panel (Send, Build, Contribute).
- Never use more than one primary button per panel.
- Icon + text buttons: icon must be 16px, gap between icon and text is 6px.

---

### 8.2 Tabs

```css
.tab-bar {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  gap: 0;
}

.tab {
  padding: 9px 16px;
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  user-select: none;
}

.tab:hover {
  color: #334155;
}

.tab.active {
  color: #2563eb;
  border-bottom: 2px solid #2563eb;
  font-weight: 500;
}

/* Add tab button */
.tab-add {
  padding: 6px 12px;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
}
.tab-add:hover {
  color: #64748b;
}
```

---

### 8.3 Badges / Status Pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

/* Variants */
.badge-blue {
  background: #eff6ff;
  color: #1d4ed8;
}
.badge-green {
  background: #dcfce7;
  color: #15803d;
}
.badge-amber {
  background: #fffbeb;
  color: #92400e;
}
.badge-gray {
  background: #f1f5f9;
  color: #334155;
}
.badge-red {
  background: #fef2f2;
  color: #991b1b;
}
.badge-teal {
  background: #e0f2fe;
  color: #0e7490;
}
```

---

### 8.4 Inputs & Form Fields

```css
.input {
  width: 100%;
  padding: 7px 12px;
  font-size: 14px;
  font-family: var(--font-ui);
  color: #0f172a;
  background: #ffffff;
  border: 0.5px solid #cbd5e1;
  border-radius: 4px; /* --radius-sm */
  outline: none;
  transition: border-color 150ms ease;
}

.input:hover {
  border-color: #94a3b8;
}
.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #eff6ff;
}

/* Search input in sidebar — smaller */
.input-sm {
  padding: 5px 10px;
  font-size: 13px;
}

/* Path/action input — use monospace */
.input-path {
  font-family: var(--font-mono);
  font-size: 13px;
}
```

---

### 8.5 Dropdown / Select

```css
.select {
  /* Same sizing as .input */
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron-down */
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
}
```

---

### 8.6 Code / YAML Panel

```css
.code-panel {
  background: #0f172a; /* --color-ink */
  border-radius: 4px;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
}

/* Syntax tokens */
.token-key {
  color: #93c5fd;
} /* YAML keys */
.token-value {
  color: #86efac;
} /* Numbers, booleans */
.token-string {
  color: #fca5a5;
} /* String values */
.token-muted {
  color: rgba(255, 255, 255, 0.35);
} /* Comments, indent guides */
```

---

### 8.7 Log Console

```css
.log-console {
  background: #f8fafc;
  border-top: 0.5px solid #e2e8f0;
  padding: 10px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
  overflow-y: auto;
  max-height: 160px;
}

.log-error {
  color: #dc2626;
}
.log-warn {
  color: #d97706;
}
.log-info {
  color: #2563eb;
}
.log-muted {
  color: #94a3b8;
}
```

---

### 8.8 Status Indicators (dot)

```css
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green {
  background: #16a34a;
} /* Running */
.dot-blue {
  background: #2563eb;
} /* Rebuilding / in-progress */
.dot-amber {
  background: #f59e0b;
} /* Degraded / warning */
.dot-red {
  background: #ef4444;
} /* Error / stopped */
.dot-gray {
  background: #94a3b8;
} /* Inactive / unknown */
```

Animated pulse for "rebuilding" state:

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.dot-blue.rebuilding {
  animation: pulse 1.5s ease-in-out infinite;
}
```

---

### 8.9 Sidebar History Item

```css
.history-item {
  padding: 5px 10px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item:hover {
  background: #f1f5f9;
  color: #334155;
}
.history-item.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.history-group-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  padding: 10px 10px 4px;
}
```

---

## 9. Layout System

### 9.1 App Shell Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR  (height: 52px, white bg, border-bottom: 0.5px gray-200)│
├──────────────┬──────────────────────────────────────────────────┤
│              │  TAB BAR  (height: 40px)                         │
│   SIDEBAR    ├──────────────────────────────────────────────────┤
│  (width:     │  TOOLBAR  (height: 44px, send/save controls)     │
│   200px,     ├─────────────────────┬────────────────────────────┤
│   gray-50    │                     │                            │
│   bg,        │   EDITOR PANEL      │   RESULT PANEL             │
│   border-    │   (YAML / input)    │   (output / response)      │
│   right:     │   white bg          │   white bg                 │
│   0.5px)     │   flex: 1           │   flex: 1                  │
│              │                     │                            │
│              ├─────────────────────┴────────────────────────────┤
│              │  LOG DRAWER  (collapsible, gray-50 bg)           │
└──────────────┴──────────────────────────────────────────────────┘
```

### 9.2 Layout CSS

```css
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8fafc;
}

.topbar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #ffffff;
  border-bottom: 0.5px solid #e2e8f0;
  flex-shrink: 0;
  z-index: 10;
}

.body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #f8fafc;
  border-right: 0.5px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-bar-wrapper {
  height: 40px;
  flex-shrink: 0;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.toolbar {
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 0.5px solid #e2e8f0;
}

.split-panels {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-panel,
.result-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
}

.editor-panel {
  border-right: 0.5px solid #e2e8f0;
}

.log-drawer {
  height: 160px; /* collapsible — 0 when closed */
  flex-shrink: 0;
  background: #f8fafc;
  border-top: 0.5px solid #e2e8f0;
  overflow-y: auto;
  transition: height 300ms ease-in-out;
}

.log-drawer.collapsed {
  height: 36px;
  overflow: hidden;
}
```

---

## 10. Motion & Transitions

```css
/* Token definitions */
--duration-instant: 0ms; /* Cursor changes, active press */
--duration-micro: 100ms; /* Button press feedback, badge appear */
--duration-standard: 150ms; /* Hover states, tab transitions */
--duration-enter: 200ms; /* Panel open, result appear */
--duration-layout: 300ms; /* Sidebar expand/collapse, drawer toggle */

--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Usage */
.btn:hover {
  transition: background var(--duration-standard) var(--ease-out);
}
.tab {
  transition: color var(--duration-standard) var(--ease-out);
}
.panel-enter {
  transition: opacity var(--duration-enter) var(--ease-out);
}
.sidebar,
.log-drawer {
  transition: width/height var(--duration-layout) var(--ease-in-out);
}
```

**Motion rules:**

- No entrance animations on page load.
- No parallax, no scroll animations.
- Transition only `background`, `color`, `border-color`, `opacity`, `width`, `height` — never `all`.

---

## 11. Iconography

- Icon library: **Lucide** (recommended) or Heroicons — both match the flat, minimal aesthetic.
- Icon size: **16px** for inline/button icons, **20px** for standalone action icons.
- Icon color: inherits text color of its context. Never use a different color than surrounding text.
- Icon stroke-width: **1.5px** (default Lucide) — do not change to 2px.
- No filled icons. Stroke-only icons only.
- No icon-only buttons without a tooltip.

---

## 12. Writing & Content Rules

| Rule             | Detail                                                                               |
| ---------------- | ------------------------------------------------------------------------------------ |
| Case             | Sentence case everywhere. Headings, buttons, labels, tabs.                           |
| Code & paths     | Always monospace: `/health`, `eamodio.gitlens`, `1.0.1`                              |
| Numbers          | Port numbers, versions, counts always in `--font-mono`                               |
| Dates in history | `Today`, `Yesterday`, `23 Dec 2019` — no ISO timestamps in UI                        |
| Button copy      | Verb-first: `Send`, `Save`, `Build`, `Browse`, `Clear all`, `Add`                    |
| Empty states     | Short and helpful: `No history yet.` — no decorative illustrations                   |
| Error messages   | Plain, specific: `Cannot read property 'isRunning' of undefined` — show actual error |
| Tooltips         | Under 6 words. No punctuation.                                                       |

---

## 13. Accessibility Baseline

- All interactive elements must have a `:focus-visible` ring: `box-shadow: 0 0 0 3px #EFF6FF, 0 0 0 5px #2563EB`
- Minimum touch target: 36×36px
- Color contrast: all text must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- `aria-label` required on all icon-only buttons
- Status dots must have `aria-label` or accompanying text — never color-only status communication
- Log console must be `role="log"` with `aria-live="polite"`

---

## 14. Anti-Patterns — Never Do These

```
✗ box-shadow on any element
✗ gradient backgrounds
✗ font-weight 600, 700, or bold
✗ ALL CAPS headings
✗ Non-monospace font for code, paths, or YAML
✗ Green color for anything except success/completeness
✗ More than one primary (blue) button per panel
✗ Drop shadows for elevation
✗ Border-radius > 10px on panels/cards
✗ Animations on page load
✗ Colored backgrounds on body text sections
✗ Custom scroll styling
✗ Multiple accent colors — blue is the only action color
✗ Decorative icons or illustrations in empty states
✗ Inline styles overriding design tokens
```

---

## 15. Quick Reference Cheatsheet

```
ACTIONS    → #2563EB (blue-primary)
SUCCESS    → #16A34A (green)   — completeness only
BODY TEXT  → #334155 (gray-700)
MUTED TEXT → #64748B (gray-500)
BORDERS    → #E2E8F0 (gray-200) at 0.5px
SURFACE    → #F8FAFC (gray-50)
CARD BG    → #FFFFFF (white)
DARK BG    → #0F172A (ink)     — code/YAML only
MONO FONT  → JetBrains Mono / Fira Code
WEIGHTS    → 400 regular, 500 medium — nothing else
SHADOWS    → none
RADIUS     → 4px inputs · 6px buttons · 10px cards · full pills
SPACING    → multiples of 4px
```

---

_Last updated from UI screenshot analysis · OMS Design System v1.0_
