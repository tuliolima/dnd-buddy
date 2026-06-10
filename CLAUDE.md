# D&D Buddy — Project Reference

## Overview

Static D&D rules reference site for use during campaigns. Hosted on GitHub Pages at no cost. Content comes from JSON files created manually by the user.

- **UI language:** Brazilian Portuguese — all user-facing text and content in PT-BR
- **Code language:** English — all variable names, function names, file names, JSON keys, CSS classes, HTML IDs, and code comments must be in English. Only strings rendered in the UI (button labels, placeholder text, error messages, page titles, etc.) are in PT-BR.
- **Stack:** Vanilla HTML + CSS + JS, no frameworks, no build step
- **Hosting:** GitHub Pages (direct deploy from `main` branch, root folder)
- **Local URL:** `python3 -m http.server 8080` from the project root

---

## File Structure

```
/
├── index.html           # Landing page (navigation cards)
├── magias.html          # Spell search/filter page
├── classes.html         # Class reference page
├── especies.html        # Species reference page
├── favoritos.html       # Favorites page (all saved items, grouped by type)
├── css/
│   └── style.css        # Single stylesheet — dark D&D theme
├── js/
│   ├── utils.js         # Shared functions: slugify, favorites, nav, badges
│   ├── magias.js        # Logic exclusive to the spells page
│   ├── classes.js       # Logic exclusive to the classes page
│   ├── especies.js      # Logic exclusive to the species page
│   └── favoritos.js     # Logic exclusive to the favorites page
└── data/
    ├── spells.json      # 366 spells — do not alter the structure
    ├── classes.json     # Created by the user
    └── especies.json    # Created by the user
```

Every new page follows the same pattern: `name.html` + `js/name.js` + `data/name.json`.

---

## Language Rules

| Context | Language |
|---|---|
| Variable, function, and parameter names | English |
| CSS class names and HTML `id` / `data-*` attributes | English |
| JSON field keys | English (exception: `spells.json` keys are fixed, do not change) |
| Code comments | English |
| File and folder names | English |
| UI strings (labels, placeholders, error messages, page titles) | PT-BR |
| JSON content values (spell names, descriptions, etc.) | PT-BR |

---

## Design System

### CSS Variables (defined in `css/style.css`)

```css
--bg: #0d1117          /* main background */
--bg-card: #161b22     /* cards */
--bg-elevated: #21262d /* inputs, stats, hovers */
--bg-modal: #1c2128    /* modal */
--gold: #c9a227        /* primary accent color */
--gold-dim: rgba(201,162,39,.3)  /* gold borders */
--red: #9b2335         /* red accent (reserved) */
--text: #e6edf3        /* primary text */
--text-muted: #8b949e  /* secondary text */
--text-dim: #6e7681    /* tertiary text, labels */
--border: #30363d      /* neutral border */
--border-gold: rgba(201,162,39,.25)  /* soft gold border */
--shadow-gold: 0 0 20px rgba(201,162,39,.15)
--font-title: 'Cinzel', Georgia, serif   /* titles, site name */
--font-body: system-ui, sans-serif       /* body text */
```

### Magic school badge colors

| School (PT-BR) | CSS class | Color |
|---|---|---|
| Abjuração | `badge-abjuracao` | `#60a5fa` |
| Adivinhação | `badge-adivinhacao` | `#22d3ee` |
| Conjuração | `badge-conjuracao` | `#34d399` |
| Encantamento | `badge-encantamento` | `#c084fc` |
| Evocação | `badge-evocacao` | `#fb923c` |
| Ilusão | `badge-ilusao` | `#2dd4bf` |
| Necromancia | `badge-necromancia` | `#a3a3a3` |
| Transmutação | `badge-transmutacao` | `#facc15` |

CSS class names use transliterated PT-BR (no diacritics) because they are code identifiers, not UI text.

### Visual rules

- Cinzel font **only** on: logo, page titles (`.page-title`), card titles (`.card-title`), modal title (`.modal-title`), section titles (`.section-title`)
- Everything else uses `var(--font-body)`
- Card hover: `translateY(-2px)` + `box-shadow: var(--shadow-gold)` + `border-color: var(--gold)`
- Do not create new CSS files. Append new styles to the end of `css/style.css` under a section comment `/* ── New Section ── */`

---

## Page Template

Every page follows this HTML structure:

```html
<nav>...</nav>         <!-- identical nav across all pages -->
<main>
  <h1 class="page-title">Icon Name</h1>
  <p class="page-subtitle">Brief description.</p>
  <div class="filters" id="filters">...</div>
  <div class="cards-grid" id="cards-grid">...</div>
</main>
<div class="modal-overlay" id="modal-overlay">
  <div class="modal">...</div>
</div>
<script src="js/utils.js"></script>
<script src="js/page-name.js"></script>
```

The `<nav>` must be copied verbatim from any existing page. Only the `data-page` attribute on the active link changes per page. The nav contains three content links (Magias, Classes, Espécies) — the logo navigates home and the `★` badge navigates to Favoritos, so neither needs a duplicate nav link.

---

## JS Module Pattern

Every page JS file follows this fixed structure:

```javascript
// 1. Module state
let allItems = [];
let showOnlyFavorites = false;

// 2. init() — called on DOMContentLoaded
async function init() {
  setActiveNav('page-name');   // from utils.js
  updateNavBadge();            // from utils.js
  // fetch data/name.json
  // register event listeners (search, filters, modal, ESC)
  // call applyFilters()
  // open modal if window.location.hash matches an item
}

// 3. applyFilters() — reads all filters and calls renderCards()
// 4. renderCards(items) — clears the grid and rebuilds cards
// 5. openModal(item) — populates and shows the modal, updates history.replaceState
// 6. closeModal() — removes .open, restores scroll, clears the hash
// 7. setFavBtn(slug, fav) — updates the favorite button in the modal
// 8. emptyState(icon, title, text) — returns empty-state HTML

document.addEventListener('DOMContentLoaded', init);
```

**Never** share global state between pages. Each `*.js` file is isolated.

---

## Favorites

Managed by `js/utils.js`. Favorites are **spells only** — classes and species pages do not have favorites support.

Structure in `localStorage`:

```json
{ "magias": ["slug-1", "slug-2"] }
```

- Key: `dnd-buddy-favorites`
- New favorites are prepended (`unshift`) — preserves "most recent first" order
- The nav badge is **always visible** — dimmed (`.empty`) when count is 0, fully gold with count when > 0

---

## Shareable URLs

- Format: `page.html#item-slug`
- `slugify(name)` in `utils.js`: lowercase → strip diacritics → remove special chars → spaces to hyphens
- `openModal` uses `history.replaceState(null, '', '#' + slug)` — no new history entry
- `closeModal` uses `history.replaceState(null, '', window.location.pathname)` — removes the hash
- In `init()`, after rendering, check `window.location.hash` and open the matching modal

---

## JSON Schemas

### `data/spells.json` — do not alter the structure

```json
{
  "nome": "Bola de Fogo",
  "descricao": "...",
  "circulo": "3",
  "escola": "Evocação",
  "classes": "Feiticeiro, Mago",
  "tempo_conjuracao": "Ação",
  "alcance": "45 metros",
  "componentes": "V, S, M",
  "duracao": "Instantânea"
}
```

- `circulo` is a string (`"0"` to `"9"`). Cantrip = `"0"`.
- `classes` is a comma-separated string of class names.
- Keys are in PT-BR because this file was created before the English-code rule; treat them as fixed legacy identifiers.

### `data/classes.json`

```json
{
  "nome": "Bárbaro",
  "descricao": "...",
  "dado_de_vida": "d12",
  "habilidade_primaria": "Força",
  "proficiencias": "Armaduras leves e médias, escudos...",
  "conjura_magias": false,
  "tracos": [
    "Fúria",
    { "nome": "Defesa Sem Armadura", "descricao": "..." }
  ]
}
```

- `tracos` accepts plain strings or `{ nome, descricao }` objects.

### `data/especies.json`

```json
{
  "nome": "Humano",
  "descricao": "...",
  "tamanho": "Médio",
  "deslocamento": "9 metros",
  "tracos": [
    { "nome": "Versátil", "descricao": "..." }
  ]
}
```

---

## Adding a New Page

1. Create `data/new-page.json` as an array of objects
2. Create `new-page.html` — copy the structure from `classes.html`, adjust the title, icon, and `data-page`
3. Create `js/new-page.js` — follow the module pattern described above
4. Update the `<nav>` in **all six** existing pages with the new link
5. In `index.html`: add a navigation card in `.nav-cards`

---

## Deploy — GitHub Pages

- Branch: `main`, folder: `/ (root)` — no build step required
- `fetch('data/file.json')` uses a root-relative path — works automatically on Pages
- To test locally before pushing: `python3 -m http.server 8080` (`fetch` does not work with `file://`)
- After pushing, Pages publishes in ~1 minute
