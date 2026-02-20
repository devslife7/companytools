# Design System — Company Tools

Inferred from the existing codebase. All UI work must follow these conventions.

---

## Colors

### Brand

| Token | Value | Usage |
|---|---|---|
| `brand-primary` | `#F54A00` | Buttons, active states, links, accents |
| `brand-primary-hover` | `#D13F00` | Hover state for primary actions |
| `brand-primary-foreground` | `#ffffff` | Text on orange backgrounds |
| `brand-accent` | `#FFC107` / `#FFD54F` (dark) | Highlights, golden accents |

### Neutrals (Tailwind gray scale)

| Role | Class | Usage |
|---|---|---|
| Page background | `bg-white` / `bg-gray-50` | Page body, section backgrounds |
| Surface | `bg-white` | Cards, modals, inputs |
| Surface subtle | `bg-gray-50` | Table headers, modal headers/footers |
| Border | `border-gray-100` / `border-gray-200` / `border-gray-300` | Light → medium → strong borders |
| Text primary | `text-gray-900` | Body copy, headings |
| Text secondary | `text-gray-700` | Supporting text |
| Text muted | `text-gray-500` / `text-gray-400` | Placeholders, captions, tertiary labels |
| Text action | `text-orange-600` / `text-orange-700` | Clickable text, accent labels |

### Status

| State | Background | Border | Text |
|---|---|---|---|
| Success | `bg-green-50` | `border-green-200` | `text-green-800` |
| Error / Danger | `bg-red-50` | `border-red-200` | `text-red-800` |
| Warning | `bg-yellow-50` | `border-yellow-200` | `text-yellow-800` |
| Info | `bg-blue-50` | `border-blue-200` | `text-blue-800` |
| Amber alert | `bg-amber-50` | `border-amber-200` | `text-amber-800` |

### CSS Variables (defined in `app/brand.css` and `app/globals.css`)

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
  --brand-primary: #F54A00;
  --brand-primary-foreground: #ffffff;
  --brand-primary-hover: #D13F00;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

---

## Typography

### Font Families

| Role | Font | Tailwind |
|---|---|---|
| Primary (UI) | Geist Sans | `font-sans` (default) |
| Monospace (numbers, code) | Geist Mono | `font-mono` |

### Heading Scale

| Level | Classes | Usage |
|---|---|---|
| H1 | `text-4xl font-extrabold tracking-tight` | Page titles |
| H2 | `text-2xl font-extrabold tracking-tight` | Major section headings |
| H3 | `text-xl font-extrabold` or `text-2xl font-bold` | Card titles, sub-section headings |
| H4 | `text-lg font-bold` | Subsection labels |

### Body & Label Scale

| Role | Classes |
|---|---|
| Body | `text-base` (default) |
| Label / secondary | `text-sm font-semibold` |
| Small label | `text-xs font-bold` |
| Badge / tag | `text-[10px] font-extrabold uppercase tracking-wider` |
| Micro badge | `text-[8px] font-extrabold uppercase tracking-widest` |

### Rules
- Use **extrabold (800)** for primary headings, **bold (700)** for section headings.
- Use `uppercase tracking-wider` for small badge/tag text.
- Use `font-mono` for any numeric measurements or quantities in tables/cells.
- Use `leading-tight` on headings, `leading-relaxed` on body paragraphs.

---

## Spacing

All spacing follows Tailwind's 4px base unit.

### Page / Layout

| Context | Classes |
|---|---|
| Page horizontal padding | `px-4 sm:px-6 lg:px-8` |
| Section vertical gap | `mb-6` / `mb-8` |
| Content below heading | `mb-2 sm:mb-4` |

### Cards & Containers

| Context | Classes |
|---|---|
| Small card padding | `p-3 sm:p-5` |
| Standard card padding | `p-4 sm:p-6` |
| Large card padding | `p-5 sm:p-6` |
| Modal content padding | `p-4 md:p-6` |

### Components

| Context | Classes |
|---|---|
| Button (small) | `px-3 py-2` |
| Button (medium) | `px-4 py-2.5` |
| Button (large) | `px-6 py-3` |
| Input field | `px-4 py-2.5` |
| Inline icon + label | `gap-2` |
| Button group | `gap-2 sm:gap-3` |
| List items | `space-y-2` (compact) / `space-y-3` (standard) / `space-y-4` (spacious) |
| Grid gap | `gap-4` (standard) / `gap-6` (loose) |

---

## Border Radius

| Component | Classes |
|---|---|
| Buttons | `rounded-xl` |
| Inputs | `rounded-xl` |
| Cards (standard) | `rounded-xl` |
| Cards (large / modals) | `rounded-2xl` |
| Badges / pills / avatars | `rounded-full` |
| Feature badges (inline) | `rounded-md sm:rounded-lg` |
| Top-only (modal header) | `rounded-t-xl` |
| Bottom-only (modal footer) | `rounded-b-xl` |

---

## Shadows

| Context | Classes |
|---|---|
| Inputs, small elements | `shadow-sm` |
| Standard cards | `shadow-md` |
| Card on hover | `hover:shadow-xl` |
| Dropdowns / lifted cards | `shadow-lg` |
| Modals | `shadow-2xl` |
| Floating action bar | `shadow-[0_-10px_40px_rgba(0,0,0,0.1)]` |
| Brand-tinted shadow | `shadow-md shadow-orange-600/20` |

---

## Breakpoints

Standard Tailwind 4 breakpoints used throughout the project:

| Prefix | Min-width | Typical use |
|---|---|---|
| *(base)* | 0px | Mobile, single-column, full-width |
| `sm:` | 640px | Small tablets, increased padding/font sizes |
| `md:` | 768px | Tablets — sidebar becomes fixed, layout shifts |
| `lg:` | 1024px | Desktop — extra grid columns, larger containers |
| `xl:` | 1280px | Wide desktop — max grid columns |
| `2xl:` | 1536px | Extra-wide displays |

**Pattern:** Always write base styles for mobile first, then layer `sm:` / `md:` / `lg:` overrides.

---

## Components

### Button

```html
<!-- Primary -->
<button class="px-4 py-2.5 bg-[#F54A00] text-white text-sm font-bold rounded-xl
               hover:bg-[#D13F00] transition-all shadow-md">
  Label
</button>

<!-- Secondary -->
<button class="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold
               rounded-xl hover:bg-gray-50 transition-all">
  Label
</button>

<!-- Danger -->
<button class="px-4 py-2.5 bg-red-50 text-red-500 text-sm font-bold rounded-xl
               hover:bg-red-500 hover:text-white transition-all">
  Delete
</button>

<!-- Ghost / Icon -->
<button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
  <!-- icon -->
</button>
```

### Card

```html
<!-- Standard -->
<div class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-6">
  <!-- content -->
</div>

<!-- Selected state -->
<div class="bg-white rounded-xl border-2 border-[#F54A00] ring-2 ring-[#F54A00]/20 shadow-md p-4 sm:p-6">
  <!-- content -->
</div>

<!-- Large / prominent -->
<div class="bg-white rounded-2xl border border-gray-200 shadow-md p-5 sm:p-6">
  <!-- content -->
</div>
```

### Input

```html
<!-- Standard -->
<input class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500
              transition-all" />

<!-- With left icon -->
<div class="relative">
  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><!-- icon --></span>
  <input class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500
                transition-all" />
</div>

<!-- Error state -->
<input class="w-full px-4 py-2.5 bg-red-50 border border-red-400 rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500
              transition-all" />
```

### Badge

```html
<!-- Status / metric (pill) -->
<span class="inline-block bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full
             text-xs font-bold uppercase tracking-wider">
  Label
</span>

<!-- Feature badge (inline on card) -->
<span class="bg-[#F54A00]/95 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg
             text-[8px] sm:text-[10px] font-extrabold text-white uppercase tracking-wider">
  New
</span>

<!-- Success dot + label -->
<span class="flex items-center gap-1.5">
  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
  <span class="text-xs font-bold text-gray-600 uppercase tracking-wider">Mocktail</span>
</span>
```

### Modal

```html
<!-- Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4
            backdrop-blur-sm bg-white/30 animate-fade-in">

  <!-- Content -->
  <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-300
              animate-modal-enter">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4
                border-b border-gray-300 bg-gray-50 rounded-t-xl">
      <h2 class="text-lg font-bold text-gray-900">Title</h2>
      <button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
        <!-- X icon -->
      </button>
    </div>

    <!-- Body -->
    <div class="p-5 sm:p-6"><!-- content --></div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 px-5 py-4
                border-t border-gray-300 bg-gray-50 rounded-b-xl">
      <button class="...secondary button...">Cancel</button>
      <button class="...primary button...">Confirm</button>
    </div>
  </div>
</div>
```

### Navbar / Sidebar

```html
<!-- Desktop sidebar (fixed left) -->
<aside class="hidden md:flex flex-col w-56 h-screen fixed left-0 top-0
              bg-white border-r border-gray-200 shadow-sm z-30">
  <!-- nav items -->
</aside>

<!-- Mobile sidebar (slide-in drawer) -->
<aside class="fixed top-0 left-0 z-50 h-screen w-72
              bg-white border-r border-gray-200 shadow-xl
              transform transition-transform duration-300
              -translate-x-full [&.open]:translate-x-0">
  <!-- nav items -->
</aside>

<!-- Main content offset -->
<main class="md:ml-56 px-4 sm:px-6 lg:px-8"><!-- page content --></main>
```

### Table

```html
<table class="w-full">
  <thead>
    <tr class="bg-gray-50 border-b border-gray-100">
      <th class="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
        Name
      </th>
      <th class="text-right text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3">
        Amount
      </th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
      <td class="px-4 py-3 text-sm text-gray-900">Item</td>
      <td class="px-4 py-3 text-sm font-mono text-right text-gray-700">1.5 oz</td>
    </tr>
  </tbody>
</table>
```

---

## Layout

| Property | Value |
|---|---|
| Main max-width | `max-w-7xl` |
| Wide page max-width | `max-w-[1600px]` |
| Modal max-width | `max-w-md` |
| Sidebar width (desktop) | `w-56` (224px) |
| Sidebar width (mobile drawer) | `w-72` (288px) |
| Content offset (sidebar) | `md:ml-56` |

### Grid Conventions

| Use case | Classes |
|---|---|
| Gallery (cocktail cards) | `grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4` |
| Two-column asymmetric | `grid grid-cols-1 lg:grid-cols-12 gap-6` (7-col + 5-col) |
| Form field group | `grid grid-cols-1 md:grid-cols-3 gap-4` |
| Content centering | `max-w-2xl mx-auto` |

---

## Animations

Defined in `app/globals.css`:

```css
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes modal-enter {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);     }
}

.animate-fade-in    { animation: fade-in    0.2s ease-out; }
.animate-modal-enter { animation: modal-enter 0.3s ease-out; }
```

- Use `transition-all duration-300` for hover/focus state changes on interactive elements.
- Use `animate-spin` for loading spinners, `animate-pulse` for skeleton loading text.

---

## Rules & Conventions

1. **Read this file before any UI work.** Match existing patterns exactly — do not introduce new color values, radius tokens, or shadow styles without updating this document.
2. **Mobile-first always.** Write base styles for mobile, then add `sm:` / `md:` / `lg:` overrides.
3. **Orange is the only brand action color.** Do not use blue or purple for primary actions.
4. **Extrabold for headings, bold for labels.** Never use regular weight for any label or heading.
5. **All interactive elements get `transition-all`.** Buttons, cards, inputs — always animated.
6. **Cards use `rounded-xl`; modals use `rounded-2xl`.** Don't mix these.
7. **Use `font-mono` for any numeric value** shown in a table cell or measurement display.
8. **Status colors are semantic.** Green = success, Red = danger/delete, Yellow = warning, Blue = info. Don't repurpose them.
9. **Shadows indicate elevation.** `shadow-sm` = flat, `shadow-md` = card, `shadow-xl` = hover lift, `shadow-2xl` = modal.
10. **Always use `@/` path aliases** for imports — never relative paths like `../../`.
11. **Client components must have `"use client"` at the top.** Pages are server-rendered by default.
12. **Sidebar layout offset:** any full-page layout must account for the `md:ml-56` sidebar offset.
