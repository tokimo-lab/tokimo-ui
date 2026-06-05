# Tokimo UI — Style Guide

> **Authoritative reference for the Tokimo design token system.**
> Single source of truth: [`src/theme.css`](./src/theme.css) (values) +
> [`src/tokens.ts`](./src/tokens.ts) (TypeScript) + this guide (rules).

---

## TL;DR

1. **Use Tailwind utilities** (`bg-surface-base`, `text-fg-primary`, `border-border-base`). Don't hand-write `var(--color-*)` in JSX/CSS unless on the [whitelist](#var---whitelist).
2. **One namespace only**: every design token starts with `--color-*` / `--shadow-*` / `--radius-*` / `--motion-*`. Anything else (`--bg-*`, `--text-*`, `--border-*`) is **dead** — fix it on sight.
3. **Pair surfaces with their foreground**: every `surface-*` has a matching `fg-on-*`. Don't put `text-fg-primary` on `bg-surface-inverted`; use `text-fg-on-inverted`.
4. **Add a token** = edit `theme.css` (light + dark) → add to `tokens.ts` → add to this guide. All three or none.
5. **Bundle mode (third-party apps)** uses `@tokimo/ui/bundle.css`, not the full Tailwind entry. Same utility names, no theme re-emission.

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  packages/ui/src/theme.css                                       │
│  • Defines every --color-* token literal (light defaults)        │
│  • .dark overrides for dark mode                                 │
│  • [data-accent="X"] overrides for accent palettes               │
│  • Shadow / radius / motion / glass tokens                       │
│  Emitted EXACTLY ONCE per page (by the shell).                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  @import
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  packages/ui/src/tailwind.css                                    │
│  • @import "./theme.css"                                         │
│  • @theme inline { --color-*: var(--color-*) }  ← identity map   │
│    (so utilities resolve at runtime, not bundle-time)            │
│  • @custom-variant dark (.dark &)                                │
│  • @source scans @tokimo/ui's own components                     │
│  Consumed by: packages/web (host) via index.css                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  @reference (NO emission)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  packages/ui/src/bundle.css                                      │
│  • @reference "./tailwind.css"  ← compiler sees tokens,          │
│                                    NOTHING is emitted            │
│  • @import "tailwindcss/utilities.css" layer(utilities)          │
│  • @import "tailwindcss/theme.css"  layer(theme)  (breakpoints)  │
│  Consumed by: every apps/tokimo-app-*/ui/src/index.css.          │
│  Apps emit ONLY the utilities they use — no token block,         │
│  no accent palettes, no preflight.                               │
└─────────────────────────────────────────────────────────────────┘
```

**Why this layout matters:**

- A re-emitted `:root { --color-accent: ... }` in an app bundle is a **global declaration** that would clobber the shell's tokens by cascade order. `@reference` solves this: the compiler reads tokens for type info but emits nothing.
- Tailwind v4's `@theme inline` is critical — without `inline`, v4 would substitute the literal hex into every utility at build time, freezing light-mode values into the bundle and breaking `.dark` / `[data-accent]` overrides.

### shadcn-style foreground/background pairing

Every surface ships with an explicit `fg-on-*` companion so contributors never "forget to set text color":

| Background utility           | Default foreground utility |
| ---------------------------- | -------------------------- |
| `bg-surface-base`            | `text-fg-primary`          |
| `bg-surface-raised`          | `text-fg-on-raised`        |
| `bg-surface-overlay[-hover]` | `text-fg-on-overlay`       |
| `bg-surface-sunken`          | `text-fg-primary`          |
| `bg-surface-inverted`        | `text-fg-on-inverted`      |
| `bg-accent[-hover\|-active]` | `text-fg-on-accent`        |

The `fg-on-*` value is computed to give correct contrast in **both** themes, so the same class works under `.dark` without thinking.

---

## 2. Complete token reference

All variables live in the `--color-*` namespace **except** `--window-*`, `--glass-*`, `--shadow-*`, `--radius-*`, `--motion-*`, `--aurora-*`, `--gradient-*`, `--scrollbar-*`, `--input-bg`, `--modal-bg`, `--header-bg`, `--overlay-blur` and `--card-top-line-opacity` (non-color tokens).

### 2.1 Surfaces — `bg-surface-*`

| Token                            | Tailwind utility               | Use for                                              | Light                       | Dark                              |
| -------------------------------- | ------------------------------ | ---------------------------------------------------- | --------------------------- | --------------------------------- |
| `--color-surface-base`           | `bg-surface-base`              | Page / canvas background, the bottom of the z-stack  | `#f8fafc`                   | `#0a0a0f`                         |
| `--color-surface-raised`         | `bg-surface-raised`            | Cards, panels, anything visually "lifted"            | `#ffffff`                   | `rgba(255,255,255,.03)`           |
| `--color-surface-overlay`        | `bg-surface-overlay`           | Floating UI: dropdowns, popovers, command palette    | `rgba(255,255,255,.7)`      | `rgba(15,15,25,.85)`              |
| `--color-surface-overlay-hover`  | `bg-surface-overlay-hover`     | Hover state for an overlay row                       | `rgba(255,255,255,.85)`     | `rgba(255,255,255,.06)`           |
| `--color-surface-sunken`         | `bg-surface-sunken`            | Inputs, code blocks (a "recessed" feeling)           | `rgba(255,255,255,.92)`     | `rgba(255,255,255,.07)`           |
| `--color-surface-sidebar`        | `bg-surface-sidebar`           | App sidebars / nav rails                             | `rgba(255,255,255,.3)`      | `rgba(10,10,15,.3)`               |
| `--color-surface-inverted`       | `bg-surface-inverted`          | Tooltips, toasts, anything inverted vs current theme | `#0a0a0f`                   | `#ffffff`                         |

### 2.2 Foreground — `text-fg-*`

| Token                       | Tailwind utility       | Use for                                            |
| --------------------------- | ---------------------- | -------------------------------------------------- |
| `--color-fg-primary`        | `text-fg-primary`      | Body copy, headings on neutral surfaces            |
| `--color-fg-secondary`      | `text-fg-secondary`    | Captions, secondary copy                           |
| `--color-fg-muted`          | `text-fg-muted`        | Placeholder, helper text, low-emphasis copy        |
| `--color-fg-disabled`       | `text-fg-disabled`     | Disabled controls / text                           |
| `--color-fg-on-raised`      | `text-fg-on-raised`    | Text on `bg-surface-raised`                        |
| `--color-fg-on-overlay`     | `text-fg-on-overlay`   | Text on `bg-surface-overlay`                       |
| `--color-fg-on-inverted`    | `text-fg-on-inverted`  | Text on `bg-surface-inverted`                      |
| `--color-fg-on-accent`      | `text-fg-on-accent`    | Text on solid accent backgrounds (`bg-accent`)     |

### 2.3 Borders — `border-border-*` *or* `border-*`

Tailwind v4 short aliases (`border-base`) and full names (`border-border-base`) both work — pick whichever reads better.

| Token                       | Utility (short / full)              | Use for                                        |
| --------------------------- | ----------------------------------- | ---------------------------------------------- |
| `--color-border-subtle`     | `border-subtle` / `border-border-subtle`   | Hairlines inside cards, dividers in dense UIs |
| `--color-border-base`       | `border-base` / `border-border-base`       | Default 1px borders for cards, inputs, panels |
| `--color-border-strong`     | `border-strong` / `border-border-strong`   | Hover / focus emphasis, callouts              |
| `--color-border-accent`     | `border-accent` / `border-border-accent`   | Accent-colored borders (selected states)      |

Same names work for `divide-*` and `ring-*` utilities (`divide-base`, `ring-strong`, `ring-accent`, …).

### 2.4 Fills — `bg-fill-*`

Translucent fills for chips, skeletons, hover scrims. Distinct from `surface-*` (which are opaque-ish container backgrounds).

| Token                       | Tailwind utility         | Use for                                  |
| --------------------------- | ------------------------ | ---------------------------------------- |
| `--color-fill-tertiary`     | `bg-fill-tertiary`       | Faintest hover / chip background         |
| `--color-fill-secondary`    | `bg-fill-secondary`      | Medium hover / chip background           |
| `--color-fill-primary`      | `bg-fill-primary`        | Strongest neutral fill                   |
| `--color-fill-skeleton`     | `bg-fill-skeleton`       | Loading skeletons                        |

### 2.5 Accent — `bg-accent`, `text-accent-*`

The accent palette swaps wholesale via `<html data-accent="emerald | amber | rose | violet | blue | cyan | orange | pink | indigo | teal | lime | fuchsia | sky | slate | red | custom">`.

| Token                              | Tailwind utility            | Use for                                       |
| ---------------------------------- | --------------------------- | --------------------------------------------- |
| `--color-accent`                   | `bg-accent`                 | Solid accent: primary button, slider fill     |
| `--color-accent-hover`             | `bg-accent-hover`           | Solid accent hover state                      |
| `--color-accent-active`            | `bg-accent-active`          | Solid accent active/pressed state             |
| `--color-accent-subtle`            | `bg-accent-subtle`          | Tinted chip / selected row background         |
| `--color-accent-subtle-hover`      | `bg-accent-subtle-hover`    | Hover for accent-subtle                       |
| `--color-accent-muted`             | `bg-accent-muted`           | 50% alpha — focus rings, dividers             |
| `--color-accent-text`              | `text-accent-text`          | Accent-colored text on neutral background     |
| `--color-accent-contrast`          | `text-accent-contrast`      | Text/icon on `bg-accent`                      |
| `--color-accent-secondary`         | `bg-accent-secondary`       | Secondary accent (gradients, badges)          |
| `--color-accent-secondary-text`    | `text-accent-secondary-text`| Secondary accent text                         |

### 2.6 State colors — `text-state-*`, `bg-state-*`

| Token                                 | Tailwind utility                  | Use for                            |
| ------------------------------------- | --------------------------------- | ---------------------------------- |
| `--color-state-success-base`          | `bg-state-success-base`           | Success icon background, dot       |
| `--color-state-success-subtle`        | `bg-state-success-subtle`         | Success banner background          |
| `--color-state-success-text`          | `text-state-success-text`         | Success message text               |
| `--color-state-warning-{base,subtle,text}` | `bg-state-warning-*` / `text-state-warning-text` | Warning |
| `--color-state-danger-{base,subtle,text}`  | `bg-state-danger-*` / `text-state-danger-text`   | Errors  |
| `--color-state-info-{base,subtle,text}`    | `bg-state-info-*` / `text-state-info-text`       | Info / neutral notifications |

### 2.7 Window & glass (non-color tokens)

| Token              | Default value | Use for                                                |
| ------------------ | ------------- | ------------------------------------------------------ |
| `--window-blur`    | `24px`        | Floating-window backdrop blur — `backdrop-blur-window` |
| `--window-opacity` | `85` (%)      | Window background opacity (consumed by inline style)   |
| `--window-radius`  | `10px`        | Floating-window corner radius                          |
| `--glass-blur`     | `20px`        | Generic frosted glass — `backdrop-blur-glass`          |
| `--glass-saturate` | `150%`        | Saturation boost for glass surfaces                    |
| `--overlay-blur`   | `4px`         | Backdrop blur behind modals                            |

`backdrop-blur-window` and `backdrop-blur-glass` are first-class Tailwind utilities.

### 2.8 Shell-only aliases

These are convenience pointers used by the shell — apps should prefer the surface tokens they alias to.

| Alias            | Equivalent to                              |
| ---------------- | ------------------------------------------ |
| `--input-bg`     | `--color-surface-sunken`                   |
| `--modal-bg`     | overlay-strength surface (varies in dark)  |
| `--header-bg`    | overlay-strength surface (varies in dark)  |
| `--sidebar-bg`   | `--color-surface-sidebar`                  |

### 2.9 Decorative & misc

`--aurora-1/2/3`, `--aurora-opacity`, `--gradient-from`, `--gradient-to`, `--card-top-line-opacity`, `--scrollbar-thumb[-hover]`. Driven by the active accent palette; consumed by the shell's aurora background, gradient cards, custom scrollbar.

### 2.10 Shadows, radius, motion

| Tailwind utility | Token              |
| ---------------- | ------------------ |
| `shadow-sm`      | `--shadow-sm`      |
| `shadow-md`      | `--shadow-md`      |
| `shadow-lg`      | `--shadow-lg`      |
| `shadow-glass`   | `--shadow-glass`   |
| `rounded-sm`     | `--radius-sm` (4px)|
| `rounded-md`     | `--radius-md` (8px)|
| `rounded-lg`     | `--radius-lg` (12px)|
| `rounded-xl`     | `--radius-xl` (16px)|
| `rounded-pill`   | `--radius-pill` (9999px) |
| `duration-fast`  | `--motion-duration-fast` (120ms) |
| `duration-normal`| `--motion-duration-normal` (200ms) |
| `duration-slow`  | `--motion-duration-slow` (320ms) |
| `ease-in`/`out`/`in-out` | `--motion-ease-*`         |

---

## 3. Utility cheat sheet — "I want X → use Y"

| I want…                                | Use this                                    |
| -------------------------------------- | ------------------------------------------- |
| A page background                      | `bg-surface-base`                           |
| A card                                 | `bg-surface-raised border border-base rounded-md shadow-sm` |
| A dropdown / popover                   | `bg-surface-overlay backdrop-blur-glass border border-base rounded-md shadow-md` |
| A text input                           | `bg-surface-sunken border border-base text-fg-primary placeholder:text-fg-muted` |
| A tooltip                              | `bg-surface-inverted text-fg-on-inverted rounded-sm shadow-md` |
| Body text                              | `text-fg-primary`                           |
| Caption / secondary                    | `text-fg-secondary`                         |
| Placeholder / helper                   | `text-fg-muted`                             |
| Disabled label                         | `text-fg-disabled`                          |
| Primary button                         | `bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-active` |
| Subtle accent chip                     | `bg-accent-subtle text-accent-text hover:bg-accent-subtle-hover` |
| Focus ring                             | `ring-2 ring-accent-muted` or `ring-accent` |
| Hairline divider                       | `divide-y divide-subtle`                    |
| Default border                         | `border border-base`                        |
| Hover-emphasized border                | `border border-strong`                      |
| Skeleton row                           | `bg-fill-skeleton animate-pulse`            |
| Success banner                         | `bg-state-success-subtle text-state-success-text` |
| Error text                             | `text-state-danger-text`                    |
| Window backdrop                        | `backdrop-blur-window`                      |
| Gradient (driven by accent)            | `bg-gradient-accent`                        |

---

## 4. `var(--*)` whitelist

**Default rule:** never type `var(--color-*)` in `className` / JSX / CSS. Use the Tailwind utility.

**Allowed exceptions:**

1. **`@keyframes`** that need to interpolate themed colors:
   ```css
   @keyframes pulse-accent {
     0%, 100% { box-shadow: 0 0 0 0 var(--color-accent-muted); }
     50%      { box-shadow: 0 0 0 8px transparent; }
   }
   ```
2. **Dynamic inline `style={}`** where the value is computed at runtime — use the typed helper:
   ```tsx
   import { cssVar, TOKEN } from "@tokimo/ui";
   <div style={{ borderColor: cssVar(TOKEN.borderBase) }} />
   ```
3. **Non-color tokens** that have no Tailwind utility today: `--window-blur`, `--window-opacity`, `--window-radius`, `--glass-saturate`, `--aurora-1/2/3`, `--scrollbar-thumb`. Wrap in `style={{ }}` and add a comment why.
4. **Third-party CSS overrides** (e.g. CodeMirror, Monaco, swiper) where you patch their internal selectors — the override file is the right place.

Everything else gets flagged by `scripts/lint/check-css-vars.ts` (run via `bun lint:web`). Build will fail.

---

## 5. Adding a new token

1. **Edit `packages/ui/src/theme.css`** — add the variable in both the light block (`:root`) and the dark block (`.dark`). If the token depends on the accent, add an override in every `[data-accent="*"]` block.
2. **Edit `packages/ui/src/tailwind.css`** — add an identity entry in `@theme inline { … }` so Tailwind generates a utility for it.
3. **Edit `packages/ui/src/tokens.ts`** — append to the `TOKEN` const so TypeScript knows the name.
4. **Edit this guide** — add a row to the appropriate table in §2 and a "I want…" entry in §3 if relevant.
5. **Verify**: `cd packages/ui && bun lint` then host visual test (toggle light/dark + every accent).

Naming rules: `--color-<category>-<role>[-<state>]`. Categories: `surface`, `fg`, `border`, `fill`, `accent`, `state`. Avoid two-word categories. Don't introduce a new category without an architectural reason — `fg` + `surface` + `fill` cover ~95% of needs.

---

## 6. Anti-patterns (what NOT to do)

### 6.1 Using a non-existent token (silent fallback)

```tsx
// ❌ --text-tertiary was removed. var() falls back to nothing → inherits whatever.
<p className="text-[var(--text-tertiary)]">…</p>

// ✅
<p className="text-fg-muted">…</p>
```

### 6.2 Arbitrary `var()` value where a utility exists

```tsx
// ❌
<div className="border-[var(--color-border-base)] bg-[var(--color-surface-raised)]" />

// ✅
<div className="border border-base bg-surface-raised" />
```

### 6.3 Mismatched fg/bg pairing

```tsx
// ❌ Reads fine in light, invisible in dark (inverted swaps to white bg)
<div className="bg-surface-inverted text-fg-primary">Toast</div>

// ✅
<div className="bg-surface-inverted text-fg-on-inverted">Toast</div>
```

### 6.4 Hand-rolled accent color

```tsx
// ❌ Doesn't follow accent theme; doesn't change in dark
<button className="bg-emerald-500 text-white">…</button>

// ✅
<button className="bg-accent text-fg-on-accent hover:bg-accent-hover">…</button>
```

### 6.5 Re-emitting tokens from an app bundle

```css
/* ❌ apps/foo/ui/src/index.css */
@import "@tokimo/ui/tailwind.css";   /* re-emits :root tokens → clobbers shell */

/* ✅ */
@import "@tokimo/ui/bundle.css";
@source "./**/*.{ts,tsx}";
```

---

## 7. Foreground/background pairing — worked examples

The shadcn pattern: a "surface" token always ships with its "fg-on-surface" companion. Pick the surface; the foreground is named for you.

```tsx
// 1. Raised card
<div className="bg-surface-raised text-fg-on-raised rounded-md p-4 shadow-sm">
  <h3 className="text-fg-primary">Title</h3>      {/* on-raised == primary for raised */}
  <p className="text-fg-secondary">Subtitle</p>
</div>

// 2. Dropdown overlay
<div className="bg-surface-overlay text-fg-on-overlay backdrop-blur-glass rounded-md shadow-md">
  <button className="hover:bg-surface-overlay-hover px-3 py-2">…</button>
</div>

// 3. Tooltip (inverted)
<div className="bg-surface-inverted text-fg-on-inverted rounded-sm px-2 py-1 text-sm">
  Tip text
</div>

// 4. Primary CTA (accent)
<button className="bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-active rounded-md px-4 py-2">
  Save
</button>
```

---

## 8. Third-party app bundle notes

Apps in `apps/tokimo-app-*/ui/` are built as **standalone bundles** loaded into the host's `<head>` at runtime. They MUST follow these rules:

1. **Entry CSS imports `bundle.css`, never `tailwind.css`:**
   ```css
   @import "@tokimo/ui/bundle.css";
   @source "./**/*.{ts,tsx}";
   ```
2. **Don't import `tailwindcss` directly** — it would re-emit the theme tokens globally and clobber the host.
3. **Same utility names work** — `bg-surface-base`, `text-fg-primary`, `border-border-base`, `bg-accent`, `dark:bg-surface-inverted`, `sm:flex`, etc. All resolve to `var(--color-*)` provided by the shell.
4. **Don't define your own `:root { --color-* }`** — overriding the host's tokens at app-bundle level is per-document-global and breaks every other app.
5. **App-internal tokens are fine, in a private namespace** — e.g. `--ha-tile-accent` (home-assistant), `--tk-md-code-bg` (markdown renderer). They MUST NOT use the `--color-*` prefix.
6. **Arbitrary-value utilities** (`border-[var(--color-border-base)]`) — avoid; use `border-base`. If a v4 utility genuinely fails to generate in bundle mode, file an issue and document the workaround in the app's README.

---

## 9. Theme switching

The shell controls two orthogonal axes via `<html>` attributes:

| Axis        | Attribute                              | Reactive to       |
| ----------- | -------------------------------------- | ----------------- |
| Light/dark  | `<html class="dark">`                  | User toggle (no `prefers-color-scheme` fallback — explicit only) |
| Accent      | `<html data-accent="emerald">`         | User picker (15 built-in palettes + `custom`) |

Combination: `<html class="dark" data-accent="violet">`. All token cascading is handled by CSS specificity — no JS recomputation, no flash.

**Testing locally:**

```js
// In DevTools console
document.documentElement.classList.toggle("dark");
document.documentElement.setAttribute("data-accent", "rose");
```

When migrating an app, walk through these states at minimum:
1. `class="" data-accent="emerald"` (light + default)
2. `class="dark" data-accent="emerald"` (dark + default)
3. `class="" data-accent="rose"` (light + alt accent)
4. `class="dark" data-accent="rose"` (dark + alt accent)

If text becomes invisible in any combination → wrong fg pairing. If accent colors don't change → you hard-coded a hex.

---

## Index

- Token literals & overrides → [`src/theme.css`](./src/theme.css)
- TypeScript helpers (`TOKEN`, `cssVar`) → [`src/tokens.ts`](./src/tokens.ts)
- Tailwind v4 wiring → [`src/tailwind.css`](./src/tailwind.css)
- Bundle entry for apps → [`src/bundle.css`](./src/bundle.css)
- Migration playbook (for agents) → `.claude/skills/style-migration/SKILL.md`
